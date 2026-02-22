import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';
import dns from 'dns';

// Fix VPN connectivity issues in Node.js
dns.setDefaultResultOrder('ipv4first');

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testConnection() {
  console.log("Testing basic connection (v1beta)...");
  try {
    const model = genAI.getGenerativeModel(
        { model: "gemini-1.5-flash" },
        { apiVersion: 'v1beta' }
    );
    const result = await model.generateContent("Say 'hello world'");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testConnection();
