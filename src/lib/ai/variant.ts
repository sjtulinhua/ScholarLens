import { GoogleGenerativeAI } from "@google/generative-ai";
import { ANALYSIS_PROMPTS } from "./prompts";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-3-pro-preview",
}, {
  baseUrl: process.env.GEMINI_API_BASE_URL
});

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
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // 清洗 JSON
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson) as VariantResult;
  } catch (error) {
    console.error("Variant Generation Error:", error);
    throw new Error("变式题生成失败，请稍后重试");
  }
}
