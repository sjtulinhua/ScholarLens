import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { setupNetwork } from './network-helper.mjs';

// Apply environment-specific network configuration
setupNetwork();

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

// Initialize with v1beta to ensure compatibility with File API
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

async function processPdf(filePath) {
  console.log(`Processing: ${filePath}`);

  // 1. Upload the file to Google AI File Manager
  const uploadResponse = await fileManager.uploadFile(filePath, {
    mimeType: "application/pdf",
    displayName: path.basename(filePath),
  });

  const fileUri = uploadResponse.file.uri;
  console.log(`Uploaded file URI: ${fileUri}`);

  // 2. Wait for file to be processed
  let file = await fileManager.getFile(uploadResponse.file.name);
  while (file.state === "PROCESSING") {
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    file = await fileManager.getFile(uploadResponse.file.name);
  }

  if (file.state === "FAILED") {
    throw new Error("File processing failed.");
  }
  console.log("\nFile ready. Waiting 3s for sync...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 3. Define the prompt for the "Smart Collector"
  // Use v1beta explicitly for the model call
  const model = genAI.getGenerativeModel(
    { model: "gemini-3-pro-preview" }, 
    { apiVersion: 'v1beta' }
  );

  const prompt = `
    你是一个中学教育专家和试卷数字化专家。
    请分析这份数学真题 PDF。这是一份来自 Word 的解析卷，题目后面通常跟着【答案】和【解析】。
    你的任务是将每一道题目提取为结构化的 JSON 数据。
    
    规则：
    1. content: 题干内容，要求完整保留题目中的所有文本。
    2. options: 如果是选择题，提取选项 A, B, C, D。
    3. answer: 正确答案。
    4. analysis: 对应的【分析】+【详解】+【解析】内容。
    5. knowledge_points: 该题涉及的知识点列表，按层级描述。
    6. difficulty: 难度等级 (1-5)。
    7. 所有的数学公式（包括上下标、根号等）必须转换为标准的 LaTeX 格式（例如 $\\sqrt{5}$）。

    注意：请只提取真题 PDF 中的前 2 道大题（包括子题目）作为测试成果。
    
    JSON 格式要求：
    {
      "questions": [
        {
          "original_id": "题号",
          "content": "...",
          "options": ["...", "..."],
          "answer": "...",
          "analysis": "...",
          "knowledge_points": ["...", "..."],
          "difficulty": 3
        }
      ]
    }
  `;

  // 4. Generate Content
  console.log("Generating content...");
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        {
          fileData: {
            mimeType: file.mimeType,
            fileUri: file.uri,
          },
        },
        { text: prompt },
      ],
    }],
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const output = result.response.text();
  console.log("--- Processed Result ---");
  console.log(output);

  // 5. Save to processed folder
  const outputPath = path.join('data', 'processed', `result_${path.basename(filePath, '.pdf')}.json`);
  fs.writeFileSync(outputPath, output);
  console.log(`Saved result to: ${outputPath}`);
}

const pdfPath = 'data/raw_exams/2017年福建省中考数学真题（解析卷）.pdf';
processPdf(pdfPath).catch(console.error);
