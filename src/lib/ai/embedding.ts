import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize GenAI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// In this environment, gemini-embedding-001 returns 3072 dimensions
const embeddingModel = genAI.getGenerativeModel(
  { model: "models/gemini-embedding-001" }
);

/**
 * 生成文本向量 
 * @param text 输入文本
 * @returns 3072维向量数组 (和该环境下 gemini-embedding-001 保持一致)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // === MOCK MODE START ===
  if (process.env.MOCK_AI === 'true') {
    return new Array(3072).fill(0).map(() => Math.random());
  }
  // === MOCK MODE END ===

  try {
    const cleanText = text.replace(/\s+/g, " ").trim().slice(0, 8000); 
    
    // Using 3072 as per identified dimension
    const result = await (embeddingModel as any).embedContent({
      content: { parts: [{ text: cleanText }] }
    });
    const embedding = result.embedding;
    
    const values = embedding.values;
    if (values.length > 3072) {
      return values.slice(0, 3072);
    } else if (values.length < 3072) {
      return [...values, ...new Array(3072 - values.length).fill(0)];
    }
    
    return values;
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error("AI 向量生成失败，请检查 API Key 或网络连接");
  }
}
