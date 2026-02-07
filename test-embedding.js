
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const dns = require('dns');

// Force IPv4
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const baseUrl = process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com';

console.log(`Testing Embedding with:`);
console.log(`- Base URL: ${baseUrl}`);
console.log(`- API Key: ${apiKey ? 'Found' : 'Missing'}`);

const genAI = new GoogleGenerativeAI(apiKey);

async function testEmbedding() {
  const modelsToTest = [
    "text-embedding-004", 
    "embedding-001"
  ];

  console.log("Fetching available models (REST)...");
  try {
     const url = `${baseUrl}/v1beta/models?key=${apiKey}`;
     const res = await fetch(url);
     const data = await res.json();
     if(data.models) {
         console.log("Available models:");
         data.models.forEach(m => console.log(` - ${m.name} (${m.supportedGenerationMethods})`));
     }
  } catch(e) {
      console.log("List models failed", e);
  }

  // ... (keep rest if needed, but the list above is key)
}

testEmbedding();
