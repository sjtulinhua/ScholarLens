
const apiKey = "AIzaSyAS5j8x45zV0YuV9ojt5ALMBEQJyiqKPN0";

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    console.error("Error listing models:", data.error);
    return;
  }

  require("fs").writeFileSync("models.json", JSON.stringify(data, null, 2));
  console.log("Wrote models.json");
}

listModels();
