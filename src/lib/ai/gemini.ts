import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

/**
 * 使用 Gemini 2.0 Flash 分析图片
 */
export async function analyzeImageWithGemini(
  imageBuffer: Buffer,
  mimeType: string,
  prompt: string
) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-pro-preview",
    }, {
      baseUrl: process.env.GEMINI_API_BASE_URL
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType
        }
      },
      prompt
    ]);

    const response = await result.response;
    const text = response.text();
    
    // 尝试清洗 JSON (Gemini 有时会加上 ```json ... ```)
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("AI 分析失败，请检查配置或图片质量");
  }
}
