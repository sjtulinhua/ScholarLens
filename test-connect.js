
const dotenv = require('dotenv');
const dns = require('dns');

// Force IPv4
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const baseUrl = process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com';

async function testConnection() {
  console.log(`Testing connection to ${baseUrl} ...`);
  console.log(`Using IPv4 preferred.`);
  
  // Test List Models directly via REST
  const url = `${baseUrl}/v1beta/models?key=${apiKey}`;
  
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status} ${res.statusText}`);
    
    if (res.ok) {
      const data = await res.json();
      console.log("Success! Models found:");
      console.log(data.models?.map(m => m.name).slice(0, 5)); // Show first 5
    } else {
      const text = await res.text();
      console.log("Error Body:", text);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testConnection();
