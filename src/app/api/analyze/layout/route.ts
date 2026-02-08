import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

/**
 * 真实 AI 布局识别：使用 Gemini 1.5 Flash 寻找题目框
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Model Fallback Strategy
    const cookieStore = await cookies();
    const selectedModel = cookieStore.get("scholar_lens_model")?.value;
    
    const defaultModels = ["gemini-2.0-flash-exp", "gemini-2.0-pro-exp", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"];
    
    // If user selected a model, put it FIRST.
    const modelsToTry = selectedModel 
      ? [selectedModel, ...defaultModels.filter(m => m !== selectedModel)]
      : defaultModels;

    let result = null;
    let usedModel = "";

    for (const modelName of modelsToTry) {
        try {
            console.log(`Trying layout analysis with model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = `
              Find all individual question regions in this exam/task image.
              Return the bounding boxes as a JSON array of objects with "box_2d" and "label".
              "box_2d" should be [ymin, xmin, ymax, xmax] in normalized coordinates (0-1000).
              Only return the JSON.
            `;
            
            result = await model.generateContent([
                {
                    inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: file.type
                    }
                },
                prompt
            ]);
            usedModel = modelName;
            break; // Success!
        } catch (e: any) {
            console.warn(`Model ${modelName} failed: ${e.message}`);
            // Continue to next model
        }
    }

    if (!result) {
        throw new Error("All layout analysis models failed.");
    }

    let regions = [];
    try {
      const text = result.response.text();
      // 更加鲁棒的 JSON 提取：支持 ```json 代码块
      const jsonContent = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          regions = parsed;
        }
      }
    } catch (parseError) {
      console.warn("Failed to parse AI layout response, falling back to empty regions");
    }

    return NextResponse.json({ regions, model: usedModel });
  } catch (error: any) {
    console.error("Layout analysis failed:", error);
    return NextResponse.json({ 
      error: error.message,
      regions: [] // 即使报错也给个空数组，防止前端 map 崩溃
    }, { status: 500 });
  }
}
