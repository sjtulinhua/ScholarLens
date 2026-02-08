import OpenAI from "openai";

// DashScope API is compatible with OpenAI SDK
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || "",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

/**
 * 使用 Qwen-VL-Max 分析图片
 * @param images 图片数组
 * @param prompt 提示词
 */
export async function analyzeImageWithQwen(
  images: { buffer: Buffer; mimeType: string }[],
  prompt: string
) {
  if (!process.env.DASHSCOPE_API_KEY) {
    throw new Error("Missing DASHSCOPE_API_KEY");
  }

  // Construct content array for OpenAI format
  const content: any[] = [{ type: "text", text: prompt }];

  // Add images
  images.forEach((img) => {
    const base64 = img.buffer.toString("base64");
    content.push({
      type: "image_url",
      image_url: {
        // Qwen supports data URI scheme
        url: `data:${img.mimeType};base64,${base64}`,
      },
    });
  });

  console.time(`⏱️ [AI Perf] Qwen-VL-Max`);
  try {
    console.log("🤖 Asking Qwen-VL-Max...");
    const response = await openai.chat.completions.create({
      model: "qwen-vl-max",
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
      // Qwen recommendations
      temperature: 0.1, 
      top_p: 0.01,
      // response_format: { type: "json_object" } // Qwen VL doesn't strictly enforce JSON mode yet, stick to text parsing
    });

    const text = response.choices[0].message.content || "";
    console.log("✅ Qwen-VL-Max responded. Length:", text.length);

    // Reuse robust JSON extraction
    const jsonMatch = text.match(/\[[\s\S]*\]/) || text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      // Clean markdown code blocks
      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const retryMatch = cleanText.match(/\[[\s\S]*\]/) || cleanText.match(/\{[\s\S]*\}/);
      if (retryMatch) {
        return JSON.parse(retryMatch[0]);
      }
      console.error("🔴 Qwen Raw Response:", text);
      throw new Error("Qwen response did not contain valid JSON");
    }

    console.timeEnd(`⏱️ [AI Perf] Qwen-VL-Max`);
    return JSON.parse(jsonMatch[0]);

  } catch (error: any) {
    console.error("Qwen Analysis Error:", error.message);
    throw error;
  }
}

/**
 * 使用 Qwen-Max 生成文本
 */
export async function generateTextWithQwen(prompt: string) {
  if (!process.env.DASHSCOPE_API_KEY) {
    throw new Error("Missing DASHSCOPE_API_KEY");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "qwen-max",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    return response.choices[0].message.content || "";
  } catch (error: any) {
    console.error("Qwen Text Gen Error:", error.message);
    throw error;
  }
}
