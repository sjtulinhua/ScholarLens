require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  
  try {
    const result = await model.embedContent({
      content: { parts: [{ text: "Hello World" }] },
      outputDimensionality: 1536
    });
    console.log("Embedding length:", result.embedding.values.length);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
