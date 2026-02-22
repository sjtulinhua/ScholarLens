/**
 * Batch Ingest Script - Process all PDFs in data/raw_exams/ and insert into Supabase
 * 
 * This script:
 * 1. Scans for all PDFs or uses already-processed JSON files
 * 2. For each PDF not yet processed, runs the Smart Collector pipeline
 * 3. Generates 3072-dim embeddings for each question
 * 4. Inserts into Supabase `questions` table with is_reference=true
 * 
 * Usage:
 *   node -r dotenv/config scripts/collector/ingest.mjs dotenv_config_path=.env.local
 *   node -r dotenv/config scripts/collector/ingest.mjs dotenv_config_path=.env.local --skip-extract
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { createClient } from '@supabase/supabase-js';
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

// Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const defaultUserId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000';

// Embedding model
const embeddingModel = genAI.getGenerativeModel(
  { model: "models/gemini-embedding-001" },
  { apiVersion: 'v1beta' }
);

const RAW_DIR = 'data/raw_exams';
const OUTPUT_DIR = 'data/processed';
const IMAGES_DIR = 'public/exam-images/ref';
const PAGE_RENDERS_DIR = 'data/page_renders';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(IMAGES_DIR, { recursive: true });
fs.mkdirSync(PAGE_RENDERS_DIR, { recursive: true });

// ============================================================
// Phase 1: Render PDF pages using Poppler
// ============================================================
function renderPdfPages(pdfPath) {
  const baseName = path.basename(pdfPath, '.pdf');
  const outputPrefix = path.join(PAGE_RENDERS_DIR, baseName);

  // Check if pages already rendered
  const existingPages = fs.readdirSync(PAGE_RENDERS_DIR)
    .filter(f => f.startsWith(baseName) && f.endsWith('.png'))
    .sort()
    .map(f => path.join(PAGE_RENDERS_DIR, f));
  
  if (existingPages.length > 0) {
    console.log(`  [Render] Found ${existingPages.length} existing page renders, skipping.`);
    return existingPages;
  }

  try {
    console.log(`  [Render] Rendering PDF pages...`);
    execSync(`pdftoppm -r 200 -png "${pdfPath}" "${outputPrefix}"`, { stdio: 'pipe' });
    
    const pages = fs.readdirSync(PAGE_RENDERS_DIR)
      .filter(f => f.startsWith(baseName) && f.endsWith('.png'))
      .sort()
      .map(f => path.join(PAGE_RENDERS_DIR, f));
    
    console.log(`  [Render] Rendered ${pages.length} pages.`);
    return pages;
  } catch (err) {
    console.error('  [Render] pdftoppm failed:', err.message);
    return [];
  }
}

// ============================================================
// Phase 2: Gemini extraction
// ============================================================
async function extractQuestionsFromPdf(pdfPath) {
  console.log(`  [AI] Uploading to Gemini File API...`);
  
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

  const model = genAI.getGenerativeModel(
    { model: "gemini-3-pro-preview" },
    { apiVersion: 'v1beta' }
  );

  const prompt = `
你是一个专业的中学数学试卷数字化专家。
请分析这份数学真题 PDF，提取所有题目为结构化 JSON 数据。

**重要规则：**
1. content: 题目完整文字，数学公式用 LaTeX（如 $\\sqrt{5}$，$\\frac{a}{b}$）。
2. options: 选择题的4个选项 A/B/C/D。非选择题留空数组 []。
3. answer: 正确答案。
4. analysis: 【分析】+【解答】+【点评】的完整解析。
5. knowledge_points: 该题涉及的知识点列表（如 ["几何-相似三角形", "代数-二次方程"]）。
6. subject: 学科，这里统一为 "math"。
7. difficulty: 难度 1-5。
8. has_figure: 该题是否包含几何图形/函数图像？true/false。
9. figure_bbox: 如果 has_figure=true，请估计图形在其所在 PDF **页面** 中的位置。
   - 用 page_number (1-indexed), x, y, width, height 表示（均为 0-1 的比例值）。
   - 如果没有图形，设为 null。

**输出格式（严格 JSON）：**
{
  "questions": [
    {
      "original_id": "1",
      "content": "...",
      "options": [],
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

// ============================================================
// JSON Sanitizer: Fixes Gemini's broken LaTeX escapes
// Gemini outputs \angle, \triangle etc. inside JSON strings,
// but JSON.parse treats \a as invalid and \t as tab.
// We fix this by double-escaping lone backslashes.
// ============================================================
function sanitizeGeminiJson(raw) {
  // Strategy: Replace any backslash NOT followed by a valid JSON escape char
  // Valid JSON escapes: " \ / b f n r t u
  // We double-escape everything else (e.g., \a -> \\a, \s -> \\s)
  const fixed = raw.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
  try {
    return JSON.parse(fixed);
  } catch (e) {
    // Fallback: try extracting JSON from markdown code block
    const match = fixed.match(/```json\s*([\s\S]*?)```/);
    if (match) {
      try { return JSON.parse(match[1]); } catch {}
    }
    // Last resort: find the first { and last }
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) {
      const slice = raw.slice(start, end + 1);
      const fixedSlice = slice.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
      try { return JSON.parse(fixedSlice); } catch {}
    }
    throw new Error(`JSON parse failed after sanitization: ${e.message}`);
  }
}

  console.log(`  [AI] Extracting questions...`);
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
        { text: prompt },
      ],
    }],
    // NOTE: Do NOT use responseMimeType: "application/json" here!
    // Gemini outputs LaTeX like \angle which breaks JSON.parse at SDK level.
    // We get raw text and sanitize manually.
  });

  const rawText = result.response.text();
  return sanitizeGeminiJson(rawText);


}

// ============================================================
// Phase 3: Crop figures
// ============================================================
async function cropFigures(questions, pageImages, pdfBaseName) {
  const results = [];
  for (const q of questions) {
    const result = { ...q, images: [] };
    if (q.has_figure && q.figure_bbox && pageImages.length > 0) {
      const { page_number, x, y, width, height } = q.figure_bbox;
      const pageIdx = page_number - 1;
      if (pageIdx < pageImages.length) {
        try {
          const meta = await sharp(pageImages[pageIdx]).metadata();
          const pW = meta.width, pH = meta.height;
          const padding = 20;
          const left = Math.max(0, Math.floor(x * pW) - padding);
          const top = Math.max(0, Math.floor(y * pH) - padding);
          const cropW = Math.min(pW - left, Math.floor(width * pW) + 2 * padding);
          const cropH = Math.min(pH - top, Math.floor(height * pH) + 2 * padding);

          const fileName = `${pdfBaseName}_q${q.original_id}_fig.jpg`;
          const filePath = path.join(IMAGES_DIR, fileName);
          
          await sharp(pageImages[pageIdx])
            .extract({ left, top, width: cropW, height: cropH })
            .jpeg({ quality: 90 })
            .toFile(filePath);

          result.images = [`/exam-images/ref/${fileName}`];
        } catch (e) { /* skip */ }
      }
    }
    results.push(result);
  }
  return results;
}

// ============================================================
// Phase 4: Generate embedding
// ============================================================
async function generateEmbedding(text) {
  const cleanText = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text: cleanText }] }
  });
  const values = result.embedding.values;
  if (values.length > 3072) return values.slice(0, 3072);
  if (values.length < 3072) return [...values, ...new Array(3072 - values.length).fill(0)];
  return values;
}

// ============================================================
// Phase 5: Insert into Supabase
// ============================================================
async function insertToDatabase(questions, officialYear) {
  let inserted = 0, skipped = 0;
  
  for (const q of questions) {
    try {
      // Check for duplicate by content (first 100 chars)
      const contentPrefix = q.content.slice(0, 100);
      const { data: existing } = await supabase
        .from('questions')
        .select('id')
        .like('content', `${contentPrefix}%`)
        .eq('is_reference', true)
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const embedding = await generateEmbedding(q.content);
      
      const { error } = await supabase.from('questions').insert({
        user_id: defaultUserId,
        subject: q.subject || 'math',
        content: q.content,
        answer: q.answer || '',
        analysis: q.analysis || '',
        options: q.options || [],
        difficulty: q.difficulty || 3,
        knowledge_points: q.knowledge_points || [],
        is_reference: true,
        official_year: officialYear,
        embedding: embedding,
        images: q.images || [],
      });

      if (!error) {
        inserted++;
      } else {
        console.error(`  [DB] Insert error for Q${q.original_id}:`, error.message);
      }
    } catch (err) {
      console.error(`  [DB] Error processing Q${q.original_id}:`, err.message);
    }
  }
  
  return { inserted, skipped };
}

// ============================================================
// Main Pipeline
// ============================================================
async function processSinglePdf(pdfPath) {
  const baseName = path.basename(pdfPath, '.pdf');
  const jsonPath = path.join(OUTPUT_DIR, `${baseName}_full.json`);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📄 Processing: ${baseName}`);
  console.log(`${'═'.repeat(60)}`);

  let questions;
  const skipExtract = process.argv.includes('--skip-extract');

  // Check if already extracted
  if (fs.existsSync(jsonPath) && skipExtract) {
    console.log(`  [Cache] Found existing JSON, loading...`);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    questions = data.questions;
  } else {
    // Render pages
    const pageImages = renderPdfPages(pdfPath);
    
    // Extract with Gemini
    const result = await extractQuestionsFromPdf(pdfPath);
    questions = result.questions;
    console.log(`  [AI] Extracted ${questions.length} questions.`);

    // Crop figures
    if (pageImages.length > 0) {
      questions = await cropFigures(questions, pageImages, baseName);
      const figCount = questions.filter(q => q.images?.length > 0).length;
      console.log(`  [Crop] Cropped ${figCount} figures.`);
    }

    // Save JSON
    fs.writeFileSync(jsonPath, JSON.stringify({ questions }, null, 2));
    console.log(`  [Save] Saved to ${jsonPath}`);
  }

  // Extract year from filename (e.g., "2017年..."" -> "2017")
  const yearMatch = baseName.match(/(\d{4})/);
  const officialYear = yearMatch ? `${yearMatch[1]}年福建中考数学` : baseName;

  // Insert into database
  console.log(`  [DB] Inserting ${questions.length} questions...`);
  const { inserted, skipped } = await insertToDatabase(questions, officialYear);
  console.log(`  [DB] ✅ Inserted: ${inserted}, Skipped (duplicate): ${skipped}`);

  return { baseName, total: questions.length, inserted, skipped };
}

async function main() {
  console.log('\n🚀 ScholarLens Batch Ingestion Starting...\n');

  // Find all PDFs
  const pdfs = fs.readdirSync(RAW_DIR)
    .filter(f => f.endsWith('.pdf'))
    .sort()
    .map(f => path.join(RAW_DIR, f));

  console.log(`Found ${pdfs.length} PDFs to process:\n`);
  pdfs.forEach((p, i) => console.log(`  ${i + 1}. ${path.basename(p)}`));

  const results = [];
  for (const pdfPath of pdfs) {
    try {
      const result = await processSinglePdf(pdfPath);
      results.push(result);
    } catch (err) {
      console.error(`\n❌ Failed to process ${path.basename(pdfPath)}:`, err.message);
      results.push({ baseName: path.basename(pdfPath), total: 0, inserted: 0, skipped: 0, error: err.message });
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Batch Ingestion Summary');
  console.log('═'.repeat(60));
  
  let totalInserted = 0, totalSkipped = 0;
  for (const r of results) {
    const status = r.error ? `❌ ${r.error}` : `✅ ${r.inserted} inserted, ${r.skipped} skipped`;
    console.log(`  ${r.baseName}: ${status}`);
    totalInserted += r.inserted || 0;
    totalSkipped += r.skipped || 0;
  }
  
  console.log(`\n  Total: ${totalInserted} questions inserted, ${totalSkipped} duplicates skipped`);
  console.log('═'.repeat(60));
}

main().catch(console.error);
