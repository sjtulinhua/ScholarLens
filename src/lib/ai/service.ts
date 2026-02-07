import { analyzeImageWithGemini } from "./gemini";
import { ANALYSIS_PROMPTS } from "./prompts";
import { Subject } from "../supabase/types";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "./embedding";

/**
 * 错题分析统一调度服务 (RAG Enhanced)
 */
export async function analyzeMistake(
  imageBuffer: Buffer,
  mimeType: string,
  subject: Subject
) {
  const isScience = ["math", "physics", "chemistry"].includes(subject);
  let prompt = "";

  if (isScience) {
    // 1. 理科走 RAG 流程
    // 这里的难点是：我们手里只有图片，还没有文字，怎么搜相似题？
    // 策略 A (完美 RAG): 先让 Gemini 做一次 OCR，拿到文字，再去搜相似题，然后再把相似题塞回 Prompt 做第二次分析。
    // 策略 B (简化 RAG - MVP): 暂时不搜相似题，或者假设前端已经传了 OCR 文本（目前没有）。
    // 策略 C (混合): 在第一次请求 Gemini 时，让它先返回 OCR 内容，我们在 Server Action 里做逻辑。
    
    // 为了不破坏现有架构，采用 策略 A 的变体：
    // 我们把 OCR 和分析合二为一目前是最高效的。如果要引入 RAG，必须分两步。
    
    // 临时方案（为了演示 RAG 能力）：
    // 我们假设这是一道"典型的二次函数题"，先搜几道二次函数真题进去。
    // TODO: 真正的 RAG 需要先 OCR。这里我们先查"为了难度校准，随机抽取的3道真题"。
    
    const supabase = await createClient();
    
    // 尝试获取基准参考题 (Reference Questions)
    // 理想情况下应该用 embedding 搜。但因为我们还没 OCR，先随机取几道同科目的基准题作为 Difficulty Anchor (锚点)
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
    const result = await analyzeImageWithGemini(imageBuffer, mimeType, prompt);
    return result;
  } catch (error) {
    console.error("Master Analysis Service Error:", error);
    throw error;
  }
}

