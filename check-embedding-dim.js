
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const dns = require('dns');

// Force IPv4
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const baseUrl = process.env.GEMINI_API_BASE_URL;

const genAI = new GoogleGenerativeAI(apiKey);

async function checkDim() {
  console.log("Checking gemini-embedding-001 dimension...");
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-embedding-001" 
    }, {
        baseUrl: baseUrl
    });

    // Test with explicit taskType and outputDimensionality if supported
    // Note: getGenerativeModel doesn't take outputDimensionality in config, embedContent does? 
    // Actually SDK structure: 
    // const result = await model.embedContent({ content: ..., outputDimensionality: 768 });
    
    // Let's try passing it in embedContent options
    const result = await model.embedContent({
      content: { role: "user", parts: [{ text: "Hello world" }] },
      outputDimensionality: 768
    });

    const dim = result.embedding.values.length;
    console.log(`Model returned ${dim} dimensions with request for 768.`);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

checkDim();
