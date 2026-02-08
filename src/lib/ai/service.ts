import { analyzeImageWithGemini } from "./gemini";
import { ANALYSIS_PROMPTS } from "./prompts";
import { Subject } from "../supabase/types";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "./embedding";

/**
 * 错题分析统一调度服务 (RAG Enhanced)
 */
export async function analyzeMistake(
  images: { buffer: Buffer; mimeType: string }[],
  subject: Subject,
  selectedModel?: string
) {
  const isScience = ["math", "physics", "chemistry"].includes(subject);
  let prompt = "";

  if (isScience) {
    // 1. 理科走 RAG 流程
    // 目前简单处理：随机抽取几道真题作为难度锚点
    // Phase 4 Update: 未来可以在这里先对第一张图做 OCR，然后根据 OCR 结果检索真题
    
    const supabase = await createClient();
    
    const { data: references } = await supabase
      .from("questions")
      .select("content, difficulty")
      .eq("is_reference", true)
      .eq("subject", subject)
      .limit(3);

    const refList = references?.map(r => ({ content: r.content, difficulty: r.difficulty || 3 })) || [];
    
    prompt = ANALYSIS_PROMPTS.science(refList);
  } else {
    prompt = ANALYSIS_PROMPTS.arts();
  }

  try {
    const result = await analyzeImageWithGemini(images, prompt, selectedModel);
    // Ensure result is an array
    const mistakes = Array.isArray(result) ? result : [result];
    return mistakes;
  } catch (error) {
    console.error("Master Analysis Service Error:", error);
    throw error;
  }
}

