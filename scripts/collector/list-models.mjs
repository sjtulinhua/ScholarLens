import 'dotenv/config';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

async function listModels() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  console.log("Fetching models...");
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available models:");
      data.models.forEach(m => {
        if (m.supportedGenerationMethods.includes("generateContent")) {
            console.log(` - ${m.name}`);
        }
      });
    } else {
        console.error("Failed:", data);
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

listModels();
