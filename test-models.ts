
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

// Load env vars
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("No API KEY found in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testEmbedding() {
  const models = ["models/gemini-embedding-001"];

  for (const m of models) {
    console.log(`\n--- Testing ${m} ---`);
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await (model as any).embedContent("Hello world");
      console.log(`✅ SUCCESS: Dimension ${result.embedding.values.length}`);
    } catch (error: any) {
      console.log(`❌ FAILED: ${error.message}`);
    }
  }
}

testEmbedding();
