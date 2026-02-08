import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const key = process.env.GOOGLE_GEMINI_API_KEY;
if (key) {
  console.log(`[Gemini Init] Key loaded. Length: ${key.length}, Starts with: ${key.substring(0, 4)}..., Ends with: ...${key.substring(key.length - 4)}`);
} else {
  console.error("[Gemini Init] Error: GOOGLE_GEMINI_API_KEY is not defined!");
}
const genAI = new GoogleGenerativeAI(key || "");

/**
 * 使用 Gemini 分析图片
 * @param images 图片数组
 * @param prompt 提示词
 * @param selectedModel (Optional) 用户指定的模型，优先使用
 */
export async function analyzeImageWithGemini(
    images: { buffer: Buffer; mimeType: string }[], 
    prompt: string,
    selectedModel?: string
) {
  // === MOCK MODE START ===
  if (process.env.MOCK_AI === 'true') {
     // ... mock logic ...
  }
  // === MOCK MODE END ===

  let text = "";
  
  // Model Fallback Strategy: Selected -> 3 Flash -> 3 Pro
  const defaultModels = ["models/gemini-3-flash-preview", "models/gemini-3-pro-preview"];
  
  // If user selected a model, put it FIRST.
  const modelsToTry = selectedModel 
    ? [selectedModel, ...defaultModels.filter(m => m !== selectedModel)]
    : defaultModels;

  let modelInstance;
  let usedModelName = "";

  console.time(`⏱️ [AI Perf] Gemini`);
  for (const modelName of modelsToTry) {
    try {
        console.log(`🤖 Attempting analysis with model: ${modelName}`);
        modelInstance = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
            },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        }, { timeout: 300000 }); // 5 min timeout

        // Constuct Parts
        const imageParts = images.map(img => ({
            inlineData: {
                data: img.buffer.toString("base64"),
                mimeType: img.mimeType
            }
        }));

        // Try generation
        const result = await modelInstance.generateContent([
            ...imageParts,
            prompt
        ]);
        
        const response = await result.response;
        text = response.text();
        usedModelName = modelName;
        console.log(`✅ Success with model: ${modelName}`);
        break; // Success, exit loop

    } catch (e: any) {
        console.warn(`⚠️ Model ${modelName} failed:`, e.message);
        // If this was the last model, rethrow
        if (modelName === modelsToTry[modelsToTry.length - 1]) {
            console.error("❌ All models failed.");
            throw new Error(`All AI models failed. Last error: ${e.message}`);
        }
    }
  }

  try {
     // Robust JSON Extraction
    const jsonMatch = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      // 尝试最后一次清洗
      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const retryMatch = cleanText.match(/\[[\s\S]*\]/) || cleanText.match(/\{[\s\S]*\}/);
      if (retryMatch) {
          return JSON.parse(retryMatch[0]);
      }
      throw new Error(`No JSON found. Raw text length: ${text.length}`);
    }

    const cleanedJson = jsonMatch[0];
    console.timeEnd(`⏱️ [AI Perf] Gemini`);
    return {
      mistakes: JSON.parse(cleanedJson),
      usedModel: usedModelName
    };

  } catch (error) {
    console.error("Gemini Analysis Parsing Error:", error);
    try {
        console.error("🔴 Failed Raw Text:", text);
    } catch (e) {
        console.error("🔴 Could not print text");
    }
    throw new Error(`AI 分析成功但解析失败 (${usedModelName})，请重试`);
  }
}

/**
 * 使用 Gemini 生成纯文本 (支持 JSON)
 */
export async function generateTextWithGemini(prompt: string, selectedModel?: string) {
  const defaultModels = ["models/gemini-3-flash-preview", "models/gemini-3-pro-preview"];
  const modelsToTry = selectedModel 
    ? [selectedModel.startsWith("models/") ? selectedModel : `models/${selectedModel}`, ...defaultModels.filter(m => !m.includes(selectedModel))]
    : defaultModels;

  for (const modelName of modelsToTry) {
    try {
      console.log(`🤖 Generating text with: ${modelName}`);
      const modelInstance = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      });
      const result = await modelInstance.generateContent(prompt);
      const text = result.response.text();
      
      // Use the same robust JSON extraction as analyzeImageWithGemini
      const jsonMatch = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return jsonMatch[0];
      
      return text;
    } catch (e: any) {
      console.warn(`⚠️ Text generation failed with ${modelName}:`, e.message);
    }
  }
  throw new Error("All models failed for text generation");
}
