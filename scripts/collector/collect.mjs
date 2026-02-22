/**
 * Smart Collector - Full Pipeline
 * 
 * Phase 1: Gemini 3.0 Pro reads the PDF and extracts questions with structured data
 *           AND identifies bounding boxes (as % of page) for any figures/images.
 * Phase 2: Using Poppler (pdftoppm) or native PDF rendering to get page images,
 *           then sharp crops the identified regions.
 * 
 * Prerequisites:
 *  - GOOGLE_GEMINI_API_KEY
 *  - NETWORK_MODE in .env.local
 *  - Install Poppler (Windows): https://github.com/oschwartz10612/poppler-windows/releases
 *    and add it to PATH, so `pdftoppm` is available.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';
import { setupNetwork } from './network-helper.mjs';

setupNetwork();

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const PDF_PATH = process.argv[2] || 'data/raw_exams/2017年福建省中考数学真题（解析卷）.pdf';
const OUTPUT_DIR = 'data/processed';
const IMAGES_DIR = 'public/exam-images/ref';
const PAGE_IMAGES_DIR = 'data/page_renders';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(IMAGES_DIR, { recursive: true });
fs.mkdirSync(PAGE_IMAGES_DIR, { recursive: true });

// Step 1: Render PDF pages to images using pdftoppm (Poppler)
// Each pdf page -> page-001.ppm, page-002.ppm, ...
function renderPdfPages(pdfPath) {
  const baseName = path.basename(pdfPath, '.pdf');
  const outputPrefix = path.join(PAGE_IMAGES_DIR, baseName);
  
  try {
    console.log('Rendering PDF pages to images via pdftoppm...');
    execSync(`pdftoppm -r 200 -png "${pdfPath}" "${outputPrefix}"`, { stdio: 'pipe' });
    
    // Find all generated images
    const pages = fs.readdirSync(PAGE_IMAGES_DIR)
      .filter(f => f.startsWith(baseName) && f.endsWith('.png'))
      .sort()
      .map(f => path.join(PAGE_IMAGES_DIR, f));
    
    console.log(`Rendered ${pages.length} pages.`);
    return pages;
  } catch (err) {
    console.error('pdftoppm failed. Make sure Poppler is installed and in PATH.');
    console.error('Install: https://github.com/oschwartz10612/poppler-windows/releases');
    console.error('Error:', err.message);
    return [];
  }
}

// Step 2: Ask Gemini to extract questions including figure bounding boxes
async function extractQuestionsFromPdf(pdfPath) {
  console.log(`Uploading ${path.basename(pdfPath)} to Gemini File API...`);
  
  const uploadResponse = await fileManager.uploadFile(pdfPath, {
    mimeType: "application/pdf",
    displayName: path.basename(pdfPath),
  });

  let file = await fileManager.getFile(uploadResponse.file.name);
  while (file.state === "PROCESSING") {
    process.stdout.write(".");
    await new Promise(r => setTimeout(r, 2000));
    file = await fileManager.getFile(uploadResponse.file.name);
  }
  if (file.state === "FAILED") throw new Error("File processing failed.");
  console.log("\nFile ready.");

  const model = genAI.getGenerativeModel(
    { model: "gemini-3-pro-preview" },
    { apiVersion: 'v1beta' }
  );

  const prompt = `
你是一个专业的中学数学试卷数字化专家。
请分析这份数学真题 PDF，提取所有题目为结构化 JSON 数据。

**重要规则：**
1. content: 题目完整文字，数学公式用 LaTeX（如 $\\sqrt{5}$，$\\frac{a}{b}$）。
2. options: 选择题的4个选项 A/B/C/D。
3. answer: 正确答案。
4. analysis: 【分析】+【解答】+【点评】的完整解析。
5. knowledge_points: 该题涉及的知识点列表（如 ["几何-相似三角形", "代数-二次方程"]）。
6. subject: 学科，这里统一为 "math"。
7. difficulty: 难度 1-5。
8. has_figure: 该题是否包含几何图形/函数图像？true/false。
9. figure_bbox: 如果 has_figure=true，请估计图形在其所在 PDF **页面** 中的位置。
   - 用 page_number (1-indexed), x, y, width, height 表示（均为 0-1 的比例值）。
   - 例如：{"page_number": 1, "x": 0.05, "y": 0.30, "width": 0.45, "height": 0.20}
   - 如果没有图形，设为 null。

**输出格式（严格 JSON）：**
{
  "questions": [
    {
      "original_id": "1",
      "content": "...",
      "options": ["...", "...", "...", "..."],
      "answer": "A",
      "analysis": "...",
      "knowledge_points": ["..."],
      "subject": "math",
      "difficulty": 2,
      "has_figure": false,
      "figure_bbox": null
    }
  ]
}

请提取所有题目（选择题、填空题、解答题都要提取）。
  `;

  console.log('Extracting questions with bounding boxes...');
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
        { text: prompt },
      ],
    }],
    generationConfig: { responseMimeType: "application/json" }
  });

  return JSON.parse(result.response.text());
}

// Step 3: Crop figures from rendered page images
async function cropFigures(questions, pageImages, pdfBaseName) {
  const questionsWithImages = [];

  for (const q of questions) {
    const result = { ...q, images: [] };

    if (q.has_figure && q.figure_bbox && pageImages.length > 0) {
      const { page_number, x, y, width, height } = q.figure_bbox;
      const pageIdx = page_number - 1;
      
      if (pageIdx < pageImages.length) {
        const pagePath = pageImages[pageIdx];
        
        try {
          const meta = await sharp(pagePath).metadata();
          const pageW = meta.width;
          const pageH = meta.height;

          // Convert relative bbox to pixels
          const left = Math.floor(x * pageW);
          const top = Math.floor(y * pageH);
          const cropW = Math.floor(width * pageW);
          const cropH = Math.floor(height * pageH);

          // Add padding
          const padding = 20;
          const cropLeft = Math.max(0, left - padding);
          const cropTop = Math.max(0, top - padding);
          const cropWidth = Math.min(pageW - cropLeft, cropW + 2 * padding);
          const cropHeight = Math.min(pageH - cropTop, cropH + 2 * padding);

          const imageFileName = `${pdfBaseName}_q${q.original_id}_fig.jpg`;
          const imagePath = path.join(IMAGES_DIR, imageFileName);
          
          await sharp(pagePath)
            .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
            .jpeg({ quality: 90 })
            .toFile(imagePath);

          result.images = [`/exam-images/ref/${imageFileName}`];
          console.log(`  ✅ Cropped figure for Q${q.original_id}: ${imageFileName}`);
        } catch (err) {
          console.error(`  ❌ Failed to crop Q${q.original_id}:`, err.message);
        }
      }
    }

    questionsWithImages.push(result);
  }

  return questionsWithImages;
}

// Main pipeline
async function runPipeline(pdfPath) {
  const pdfBaseName = path.basename(pdfPath, '.pdf');
  
  console.log('\n🚀 Smart Collector Pipeline Starting...');
  console.log(`📄 Source: ${pdfBaseName}\n`);

  // Phase 1: Render PDF pages
  const pageImages = renderPdfPages(pdfPath);
  
  // Phase 2: AI extraction
  const { questions } = await extractQuestionsFromPdf(pdfPath);
  console.log(`\n📊 Extracted ${questions.length} questions.`);

  // Phase 3: Auto crop figures
  let finalQuestions = questions;
  if (pageImages.length > 0) {
    console.log('\n🔍 Cropping figures...');
    finalQuestions = await cropFigures(questions, pageImages, pdfBaseName);
  } else {
    console.log('\n⚠️  Skipping figure cropping (pdftoppm not available).');
    console.log('   Questions will have empty images array.');
    finalQuestions = questions.map(q => ({ ...q, images: [] }));
  }

  // Phase 4: Save results
  const outputPath = path.join(OUTPUT_DIR, `${pdfBaseName}_full.json`);
  fs.writeFileSync(outputPath, JSON.stringify({ questions: finalQuestions }, null, 2));
  
  console.log(`\n✅ Pipeline complete!`);
  console.log(`📁 Output: ${outputPath}`);
  console.log(`🖼️  Figures with images: ${finalQuestions.filter(q => q.images?.length > 0).length}`);
  console.log('\nSample output (first 2 questions):');
  console.log(JSON.stringify(finalQuestions.slice(0, 2), null, 2));
}

runPipeline(PDF_PATH).catch(console.error);
