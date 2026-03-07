require('dotenv').config();
const { getAIAnalysis } = require('../services/geminiService');

async function testGemini() {
  console.log("Testing Gemini API integration...");
  
  const mockData = [
    { ministry: "Health", scheme: "Hospital Upgrade", be2324Total: 1000, currentSpent: 200, utilizationRate: 20 },
    { ministry: "Education", scheme: "School Building", be2324Total: 500, currentSpent: 450, utilizationRate: 90 }
  ];

  try {
    const response = await getAIAnalysis(mockData, "Find Reallocation Opportunities", "2025");
    console.log("\n--- Gemini Response ---\n");
    console.log(response);
    console.log("\n--- End of Response ---\n");
    console.log("✅ Gemini Integration Test Passed!");
  } catch (error) {
    console.error("❌ Gemini Integration Test Failed:", error.message);
  }
}

testGemini();
