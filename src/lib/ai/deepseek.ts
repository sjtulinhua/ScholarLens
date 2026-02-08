import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

/**
 * 文本分析服务 (已迁移至 Gemini 2.0 Flash/Pro)
 * 原 DeepSeek 接口保留名称以兼容现有代码，但底层已切换为 Gemini
 */
export async function analyzeTextWithDeepSeek(content: string, prompt: string) {
  const modelsToTry = ["gemini-2.0-flash-exp", "gemini-2.0-pro-exp", "gemini-1.5-pro"];
  
  for (const modelName of modelsToTry) {
    try {
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });
        
        const result = await model.generateContent([
            { text: prompt },
            { text: content }
        ]);
        
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);

    } catch (e: any) {
        console.warn(`Text analysis model ${modelName} failed:`, e.message);
        if (modelName === modelsToTry[modelsToTry.length - 1]) {
            throw new Error(`Text Analysis Failed. Last error: ${e.message}`);
        }
    }
  }
}
