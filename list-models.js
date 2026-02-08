require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
  try {
    const models = await genAI.listModels();
    console.log("Available models:");
    for (const m of models.models) {
        if (m.name.includes("embedding")) {
            console.log(`- ${m.name} (Supported: ${m.supportedGenerationMethods})`);
        }
    }
  } catch (e) {
    console.error("Error listing models:", e.message);
  }
}

test();
