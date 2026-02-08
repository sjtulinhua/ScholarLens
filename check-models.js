const https = require('https');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        console.log("Available Models:");
        json.models.forEach(m => {
          if (m.supportedGenerationMethods.includes('generateContent')) {
             console.log(`- ${m.name} (${m.displayName})`);
          }
        });
      } else {
        console.log("No models found or error:", json);
      }
    } catch (e) {
      console.error("Parse error", e);
    }
  });
}).on('error', (e) => {
  console.error("Request error", e);
});
