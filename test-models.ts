
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

async function listModels() {
  console.log("Fetching available models...");
  
  const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-002",
    "gemini-2.0-flash-exp"
  ];

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello");
      console.log(`SUCCESS: ${modelName} works! Response: ${result.response.text().slice(0, 20)}...`);
      // Found a working one? We can stop or keep going to see all options.
    } catch (error: any) {
      // Print short error
      const msg = error.message || String(error);
      const shortMsg = msg.split('\n')[0]; 
      console.log(`FAILED: ${modelName} - ${shortMsg}`); 
    }
  }
}

listModels();
