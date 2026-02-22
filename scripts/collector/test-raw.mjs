import 'dotenv/config';

async function testFetch() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  // Let's try gemini-1.5-pro as it's definitely supported in v1beta
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

  console.log("Sending direct fetch to:", url.split('?')[0]);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Say 'hello world'" }]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
        console.error("HTTP Error:", response.status, data);
    } else {
        console.log("Success! Response text:", data.candidates?.[0]?.content?.parts?.[0]?.text);
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

testFetch();
