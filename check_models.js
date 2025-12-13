
const apiKey = "AIzaSyAqVuwmFO8c7tjuAuOdW85_F_VNlZlAJqo"; 
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Fetching models...");

try {
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
       console.error("API Error:", data.error);
  } else if (data.models) {
      console.log("Available Models:");
      data.models.forEach(m => {
          // Filter for models that support generateContent
          if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
               console.log(`- ${m.name}`);
          }
      });
  } else {
      console.log("No models found", data);
  }
} catch (e) {
  console.error("Fetch failed:", e);
}
