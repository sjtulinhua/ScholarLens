"use server";

import { createClient } from "@/lib/supabase/server";
import { generateVariant } from "@/lib/ai/variant";

/**
 * 为指定错题生成变式题
 */
export async function createVariant(questionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Permission denied" };

  // 1. 获取原题内容
  const { data: question } = await supabase
    .from("questions")
    .select("content, knowledge_points, subject")
    .eq("id", questionId)
    .single();

  if (!question) return { error: "Question not found" };

  // 2. 调用 AI 生成变式题
  try {
    const rawKnowledge = question.knowledge_points;
    // 兼容: 数据库里存的可能是 string[] 或者 JSONB
    const knowledgePoints = Array.isArray(rawKnowledge) 
      ? rawKnowledge.map(k => String(k))
      : [];

    const variantData = await generateVariant(question.content, knowledgePoints);

    // 3. 存入 practice_records 表
    const { data: record, error } = await supabase
      .from("practice_records")
      .insert({
        user_id: user.id,
        question_id: questionId,
        variant_content: variantData.variant_content, // 核心题目
        is_correct: false, // 默认未作答/答错
        // 暂时可以把 analysis / solution 存在一个临时字段，或者存入 meta_data
        // 这里假设 practice_records 有个 extra_data JSONB 字段？
        // 回头看 Schema，001_initial 好像没写 extra_data。
        // 简单起见，我们只能把 content 和 solution 拼在一起存，或者只存 content。
        // **修正**：MVP 阶段为了快，我们临时把所有数据拼成一个 JSON 字符串存在 variant_content 列里，
        // 或者直接去改 schema 加字段。
        // 为了稳健，我们暂时只存 content。
        // 更好的方案：variant_content 存 JSON 字符串。
      })
      .select()
      .single();

    if (error) {
      console.error("Save Variant Error:", error);
      return { error: "保存变式题记录失败" };
    }
    
    // 返回包含 ID 的完整对象，方便前端重定向
    // 我们也把 solution 带着返回给前端（但不存库？或者存 JSON）
    // 决定：variant_content 字段直接存 JSON 字符串，包含 content, solution, analysis 方便前端取用
    
    // UPDATE: 重新执行一次 update，把 variant_content 存为 JSON 字符串
    await supabase
      .from("practice_records")
      .update({
        variant_content: JSON.stringify(variantData)
      })
      .eq("id", record.id);

    return { success: true, recordId: record.id };

  } catch (err: any) {
    return { error: err.message };
  }
}
