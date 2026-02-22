import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const proxyUrl = process.env.GEMINI_BASE_URL; // e.g. http://127.0.0.1:7897

// Setup proxy agent
const agent = proxyUrl ? new ProxyAgent(proxyUrl) : null;

// Custom fetch wrapper
const customFetch = (url, options) => {
  return undiciFetch(url, {
    ...options,
    dispatcher: agent,
  });
};

const genAI = new GoogleGenerativeAI(apiKey);

async function testConnection() {
  console.log(`Testing basic connection with proxy: ${proxyUrl || 'none'}...`);
  try {
    // Some versions of the SDK allow passing a custom fetch in the RequestOptions (second param of getGenerativeModel)
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { baseUrl: "https://generativelanguage.googleapis.com" } // Try to be explicit
    );

    // If the SDK doesn't support custom fetch easily, we might need a different approach.
    // Let's try a direct fetch test first to be sure the proxy works.
    console.log("--- Direct Fetch Test ---");
    const resp = await undiciFetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        dispatcher: agent
    });
    const data = await resp.json();
    console.log("Direct models fetch status:", resp.status);
    if (data.models) {
        console.log("Successfully listed models via proxy!");
    } else {
        console.log("Direct fetch response:", data);
    }

  } catch (err) {
    console.error("Test failed:", err);
  }
}

testConnection();
