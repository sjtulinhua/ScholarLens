import { ANALYSIS_PROMPTS } from "./prompts";
import { generateTextWithGemini } from "./gemini";

export interface VariantResult {
  variant_content: string;
  analysis: string;
  solution: string;
  similarity_explanation: string;
}

/**
 * 生成变式题
 * @param originalContent 原题 Markdown
 * @param knowledgePoints 知识点数组
 */
export async function generateVariant(
  originalContent: string,
  knowledgePoints: string[]
): Promise<VariantResult> {
  const prompt = ANALYSIS_PROMPTS.variant(originalContent, knowledgePoints);
  
  try {
    const text = await generateTextWithGemini(prompt, "models/gemini-3-pro-preview");
    
    // Robust extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as VariantResult;
    }
    throw new Error("No JSON found in AI response");

  } catch (error) {
    console.error(`Variant Generation Error:`, error);
    throw new Error("变式题生成失败，请稍后重试");
  }
}
