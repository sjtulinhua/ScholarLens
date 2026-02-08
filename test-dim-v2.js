require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
  // Specify v1beta if needed, or stick to default
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  
  try {
    console.log("Testing with outputDimensionality: 1536...");
    const result = await model.embedContent({
      content: { parts: [{ text: "ScholarLens test" }] },
      outputDimensionality: 1536
    });
    console.log("SUCCESS! Embedding length:", result.embedding.values.length);
  } catch (e) {
    console.error("FAIL:", e.message);
    
    console.log("Trying default (no dimensionality set)...");
    try {
        const result2 = await model.embedContent("ScholarLens test");
        console.log("DEFAULT Embedding length:", result2.embedding.values.length);
    } catch (e2) {
        console.error("TOTAL FAIL:", e2.message);
    }
  }
}

test();
