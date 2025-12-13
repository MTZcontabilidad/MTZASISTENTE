
const apiKey = "AIzaSyAqVuwmFO8c7tjuAuOdW85_F_VNlZlAJqo"; 
const modelName = "gemini-2.0-flash";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

console.log(`Testing ${modelName}...`);

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Hello, confirm you are working." }] }]
    })
  });
  
  const data = await response.json();
  
  if (response.ok) {
      console.log("SUCCESS! Response:", data.candidates?.[0]?.content?.parts?.[0]?.text);
  } else {
      console.error("FAILED. Status:", response.status, data);
  }
} catch (e) {
  console.error("Fetch failed:", e);
}
