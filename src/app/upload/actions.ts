"use server";

import { createClient } from "@/lib/supabase/server";
import { uploadExamImage } from "@/lib/supabase/storage";
import { analyzeMistake } from "@/lib/ai/service";
import { Subject } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type UploadState = {
  error?: string;
  success?: boolean;
  questionId?: string;
};

/**
 * 处理错题上传与分析
 */
export async function processMistake(
  prevState: UploadState | null,
  formData: FormData
): Promise<UploadState> {
  const file = formData.get("image") as File;
  const subject = formData.get("subject") as Subject;

  if (!file || file.size === 0) {
    return { error: "请选择题目图片" };
  }

  if (!subject) {
    return { error: "请选择科目" };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    // 1. 上传图片到 Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, path } = await uploadExamImage(buffer, file.name, file.type);

    // 2. 调用 AI 分析
    const analysis = await analyzeMistake(buffer, file.type, subject);

    // 3. 保存到数据库 (questions 表)
    const { data: questionData, error: qError } = await supabase
      .from("questions")
      .insert({
        user_id: user.id,
        subject,
        content: analysis.content,
        images: [url], // 存储公共 URL 或相对路径
        knowledge_points: analysis.knowledge_points,
        error_type: analysis.error_type,
        error_analysis: analysis.error_analysis,
        difficulty: analysis.difficulty,
        meta_data: {
          solution: analysis.solution,
          recommendation: analysis.recommendation,
          storage_path: path
        }
      })
      .select()
      .single();

    if (qError) {
      console.error("DB Question Insert Error:", qError);
      throw new Error("保存题目数据失败");
    }

    // 4. 创建错题记录 (mistakes 表)
    // 根据业务逻辑，上传一个新题目通常会自动产生一条错题记录
    const { error: mError } = await supabase
      .from("mistakes")
      .insert({
        user_id: user.id,
        question_id: questionData.id,
        status: "active"
      });

    if (mError) {
      console.error("DB Mistake Insert Error:", mError);
      // 题目已存，错题记录失败，也抛出异常以回滚/提示
      throw new Error("创建错题记录失败");
    }

    revalidatePath("/");
    revalidatePath("/mistakes");
    
    return { 
      success: true, 
      questionId: questionData.id 
    };

  } catch (error: any) {
    console.error("Upload process error:", error);
    return { error: error.message || "处理失败，请稍后重试" };
  }
}
