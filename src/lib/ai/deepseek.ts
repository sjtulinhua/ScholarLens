/**
 * DeepSeek V3 分析服务 (通过 API 调用)
 * 注：DeepSeek 目前主推文本，对于图片可以先尝试 OCR + 文本分析，
 * 或者使用其支持 Vision 的模型（如果可用）。
 * 
 * 简化版：这里演示如何调用 DeepSeek API 处理文本分析。
 */

export async function analyzeTextWithDeepSeek(content: string, prompt: string) {
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("DeepSeek Analysis Error:", error);
    throw new Error("DeepSeek 分析服务由于网络或密钥原因暂时不可用");
  }
}
