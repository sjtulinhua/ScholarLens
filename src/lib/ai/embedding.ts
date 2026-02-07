import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({ 
  model: "gemini-embedding-001" 
}, {
  baseUrl: process.env.GEMINI_API_BASE_URL
});

/**
 * 生成文本向量 
 * @param text 输入文本
 * @returns 768维向量数组
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // 预处理文本：移除多余空白，截断过长文本（Gemini 有 Token 限制，但 004 很高）
    const cleanText = text.replace(/\s+/g, " ").trim().slice(0, 8000); 
    
    const result = await embeddingModel.embedContent({
      content: { role: "user", parts: [{ text: cleanText }] },
      // outputDimensionality: 768  <-- 移除此行，让模型输出原生的 3072 维
    });
    const embedding = result.embedding;
    
    return embedding.values;
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error("AI 向量生成失败，请检查 API Key 或网络连接");
  }
}
