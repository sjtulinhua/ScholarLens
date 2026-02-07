import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { generateEmbedding } from "@/lib/ai/embedding";

// 实例化 Gemini (用于解析 PDF 内容)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-3-pro-preview",
  generationConfig: {
    responseMimeType: "application/json",
  }
}, {
  baseUrl: process.env.GEMINI_API_BASE_URL
});

/**
 * 辅助函数：从 AI 回复中提取 JSON
 * 解决 "AI 返回格式错误" 的核心逻辑
 */
function cleanAndParseJSON(text: string): any {
  // 1. 尝试直接解析
  try {
    return JSON.parse(text);
  } catch (e) {
    // 2. 提取 markdown 代码块 ```json ... ```
    const jsonBlockMatch = text.match(/```json([\s\S]*?)```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      try {
        return JSON.parse(jsonBlockMatch[1]);
      } catch (e2) {
        // continue
      }
    }

    // 3. 暴力提取：找第一个 [ 和最后一个 ]
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      const arrayStr = text.slice(start, end + 1);
      try {
        return JSON.parse(arrayStr);
      } catch (e3) {
        console.error("Deep JSON Clean failed:", e3);
      }
    }
    
    throw new Error("Unable to extract valid JSON from response");
  }
}

/**
 * 管理员 API: 上传真题/质检卷 (支持多文件) -> 解析 -> 向量化 -> 入库
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  
  // 1. 权限校验
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[]; // 获取所有文件
    const description = formData.get("description") as string;
    const subject = formData.get("subject") as string;
    
    if (!files || files.length === 0 || !subject) {
      return NextResponse.json({ error: "Missing files or subject" }, { status: 400 });
    }

    // 2. 构建 Gemini 多模态输入 parts
    const inputParts: Part[] = [];
    
    // Prompt
    inputParts.push({
      text: `
      请分析这些试卷文件（可能是多张图片或多个 PDF）。
      
      任务：
      1. 识别出试卷中的所有题目。
      2. 忽略此时的“答题卡”、“密封线”等无关内容。
      3. 将每道题目转换为独立的 JSON 对象。
      
      请返回一个 JSON 数组，每个元素包含：
      - content: 题目完整内容 (Markdown 格式，公式用 LaTeX)
      - difficulty: 预估难度 (1-5，参考厦门中考标准)
      - knowledge_points: 涉及的知识点列表
      
      格式严格遵守：
      [
        { "content": "...", "difficulty": 3, "knowledge_points": ["..."] },
        ...
      ]
      
      只返回纯 JSON，不要任何其他闲聊文本。
      `
    });

    // Files
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      
      inputParts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    }

    // 3. 调用 Gemini
    console.log(`Sending ${files.length} files to Gemini 3.0 Pro...`);
    const result = await model.generateContent(inputParts);
    const responseText = result.response.text();
    
    console.log("Gemini Raw Response (first 200 chars):", responseText.slice(0, 200));

    // 4. 解析结果 (使用增强版解析器)
    let rawResult;
    try {
        rawResult = cleanAndParseJSON(responseText);
    } catch (e) {
        console.error("JSON Parsing Finally Failed. Raw:", responseText);
        throw new Error("AI 返回数据格式异常，请重试");
    }

    // 鲁棒性处理：如果 AI 返回的是 { questions: [...] } 而不是 [...]，我们需要提取出来
    let questions;
    if (Array.isArray(rawResult)) {
      questions = rawResult;
    } else if (rawResult && typeof rawResult === 'object') {
      // 尝试找对象里唯一的数组属性
      const arrayKey = Object.keys(rawResult).find(key => Array.isArray((rawResult as any)[key]));
      if (arrayKey) {
        questions = (rawResult as any)[arrayKey];
      } else {
        throw new Error("AI 返回的对象中未找到题目数组");
      }
    } else {
      throw new Error("AI 解析结果格式错误");
    }

    // 5. 遍历题目，生成向量并入库
    let insertedCount = 0;
    for (const q of questions) {
      // 生成向量 (系统会自动处理 3072 维)
      const embedding = await generateEmbedding(q.content);

      // 入库
      const { error } = await supabase.from("questions").insert({
        user_id: user.id,
        subject: subject,
        content: q.content,
        difficulty: q.difficulty,
        knowledge_points: q.knowledge_points || [],
        is_reference: true, // 标记为基准题
        official_year: description,
        embedding: embedding,
        images: [] 
      });

      if (!error) {
        insertedCount++;
      } else {
        console.error("Insert error:", error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: insertedCount,
      message: `成功解析并收录 ${insertedCount} 道基准题 (来自 ${files.length} 个文件)` 
    });

  } catch (error: any) {
    console.error("Reference upload failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
