"use server";

import { createClient } from "@/lib/supabase/server";
import { uploadExamImage } from "@/lib/supabase/storage";
import { analyzeMistake } from "@/lib/ai/service";
import { generateEmbedding } from "@/lib/ai/embedding";
import { Subject } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export type UploadState = {
  error?: string;
  success?: boolean;
  count?: number; // 成功识别并保存的错题数量
};

/**
 * 处理错题上传与分析
 */
export async function processMistake(
  prevState: UploadState | null,
  formData: FormData
): Promise<UploadState> {
  const files = formData.getAll("image") as File[];
  const subject = formData.get("subject") as Subject;
  const occurredAt = formData.get("occurredAt") as string; // 获取做题日期

  if (!files || files.length === 0) {
    return { error: "请至少选择一张图片" };
  }

  if (files.length > 10) {
    return { error: "一次最多上传 10 张图片" };
  }

  // 过滤无效文件并检查总大小
    const validFiles = files.filter(f => f.size > 0 && f.type.startsWith("image/"));
    if (validFiles.length === 0) {
        return { error: "请选择有效的图片文件" };
    }

  if (!subject) {
    return { error: "请选择科目" };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    const cookieStore = await cookies();
    const selectedModel = cookieStore.get("scholar_lens_model")?.value || undefined;
    console.log("Using AI Model:", selectedModel || "Default (Auto)");

    // 1. 并发上传图片到 Storage
    const uploadPromises = validFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { url, path } = await uploadExamImage(buffer, file.name, file.type);
        return { 
            url, 
            path, 
            buffer, 
            mimeType: file.type 
        };
    });

    const uploadedImages = await Promise.all(uploadPromises);
    const imageUrls = uploadedImages.map(img => img.url);

    // 2. 调用 AI 分析 (并行调度)
    const analysisPromises = uploadedImages.map(async (img) => {
        try {
            const results = await analyzeMistake([{ buffer: img.buffer, mimeType: img.mimeType }], subject, selectedModel);
            return {
              item: results[0],
              sourceImg: img
            };
        } catch (e) {
            console.error("Single image analysis failed:", e);
            return null;
        }
    });

    const results = await Promise.all(analysisPromises);
    const analysisResults = results.filter(r => r !== null && r.item !== null);
    
    if (analysisResults.length === 0) {
        throw new Error("AI 未能识别出任何错题，请检查图片清晰度或重试");
    }

    // 3. 循环保存每道错题 (Atomic Persistence with Deduplication)
    const savePromises = analysisResults.map(async (entry) => {
        const { item, sourceImg } = entry!;
        // 3.0 语义级查重
        let questionId: string;
        const embedding = await generateEmbedding(item.content);
        
        const { data: existingQuestions, error: matchError } = await supabase
          .rpc("match_user_questions", {
            query_embedding: embedding,
            match_threshold: 0.95, // 95% 相似度视为同一道题
            match_count: 1,
            user_uuid: user.id
          });

        if (matchError) {
          console.error("Deduplication check failed:", matchError);
        }

        if (existingQuestions && existingQuestions.length > 0) {
          console.log(`🎯 Found duplicate question: ${existingQuestions[0].id}`);
          questionId = existingQuestions[0].id;
        } else {
          // 3.1 存入 questions 表 (这是新题)
          const { data: qData, error: qError } = await supabase
            .from("questions")
            .insert({
              user_id: user.id,
              subject,
              content: item.content,
              embedding, // 保存向量，方便下次查重
              images: [item.imageUrl || sourceImg.url], // 仅存当前图片
              occurred_at: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
              knowledge_points: item.knowledge_points,
              error_type: item.error_type,
              error_analysis: item.error_analysis,
              difficulty: item.difficulty,
              meta_data: {
                solution: item.solution,
                recommendation: item.recommendation,
                storage_paths: [sourceImg.path]
              }
            })
            .select()
            .single();

          if (qError) throw qError;
          questionId = qData.id;
        }

        // 3.2 存入 mistakes 表 (防止重复 - Idempotency)
        // 检查是否已存在 active 状态的错题记录
        const { data: existingMistake } = await supabase
            .from("mistakes")
            .select("id")
            .eq("user_id", user.id)
            .eq("question_id", questionId)
            .eq("status", "active")
            .maybeSingle();

        if (!existingMistake) {
            const { error: mError } = await supabase
              .from("mistakes")
              .insert({
                user_id: user.id,
                question_id: questionId,
                status: "active"
              });
            
            if (mError) throw mError;
        } else {
             console.log(`🎯 Mistake entry already exists for question: ${questionId}, skipping insert.`);
        }
        
        return questionId;
    });

    const savedQuestionIds = await Promise.all(savePromises);

    revalidatePath("/");
    revalidatePath("/mistakes");
    
    return { 
      success: true, 
      count: savedQuestionIds.length 
    };

  } catch (error: any) {
    console.error("Upload process error:", error);
    return { error: error.message || "处理失败，请稍后重试" };
  }
}
