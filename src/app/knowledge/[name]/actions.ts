"use server"

import { analyzeMistake } from "@/lib/ai/service";
import { createClient } from "@/lib/supabase/server";

/**
 * 分析特定知识点：定义、考点、解题技巧
 */
export async function analyzeKnowledgePoint(name: string) {
  // Use specialized prompt for generic knowledge point explanation
  const prompt = `
    你是一名厦门初中数学特级教师。请为以下知识点生成一份简明扼要的“知识卡片”。
    
    知识点：${name}
    
    要求：
    1. 核心定义：使用 LaTeX 描述核心公式或定理，语言直白地解释清楚。
    2. 中考考点：列出 2-3 条厦门中考中针对该知识点的常见出题方式或考察目标。
    3. 解析风格：专业、精简、符合厦门中考考纲。
    
    请以 JSON 格式返回：
    {
      "definition": "...",
      "tips": ["考点1...", "考点2..."]
    }
  `;

  const supabase = await createClient();

  // 1. Check Cache First
  const { data: cached } = await supabase
    .from("knowledge_base")
    .select("definition, tips")
    .eq("name", name)
    .single();

  if (cached) {
    console.log(`[Knowledge Cache] Hit for: ${name}`);
    return {
      definition: cached.definition,
      tips: cached.tips as string[]
    };
  }

  // 2. Not in Cache, Generate with Gemini 3 Pro
  try {
    const { generateTextWithGemini } = await import("@/lib/ai/gemini");
    const jsonStr = await generateTextWithGemini(prompt, "models/gemini-3-pro-preview");
    
    console.log(`[Knowledge AI] Raw Output: ${jsonStr.substring(0, 100)}...`);
    
    const parsed = JSON.parse(jsonStr);
    const result = {
      definition: parsed.definition || `关于 **${name}** 的定义正在生成中...`,
      tips: Array.isArray(parsed.tips) ? parsed.tips : ["基础核心概念", "常见考试场景", "提分关键技巧"]
    };

    // 3. Persist to Cache (Fire and forget, but we await for stability here)
    await supabase
      .from("knowledge_base")
      .insert({
        name,
        definition: result.definition,
        tips: result.tips
      });

    return result;
  } catch (e) {
    console.error("Knowledge analysis fully failed", e);
    return {
      definition: `AI 正在深入思考中... 请刷新页面重试。 (Details: ${name})`,
      tips: ["基础运用分析", "中考变式预测", "解题技巧总结"]
    };
  }
}
