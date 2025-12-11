
const apiKey = "AIzaSyCrSxpJz9HyUmWu4PS-hmBUHXIh8HgakLg";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

const data = {
  contents: [{ parts: [{ text: "Test" }] }]
};

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testKey() {
  for (let i = 0; i < 3; i++) {
      try {
        console.log(`Attempt ${i+1}...`);
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          console.log("Status:", response.status);
          const text = await response.text();
          console.log("Response:", text);
          if (response.status === 429) {
             console.log("Waiting 65 seconds...");
             await wait(65000);
             continue;
          }
        } else {
          const json = await response.json();
          console.log("Success!", JSON.stringify(json, null, 2));
        }
        break; // Exit loop on success or non-retriable error
      } catch (err) {
        console.error("Error:", err);
        break;
      }
  }
}

testKey();
