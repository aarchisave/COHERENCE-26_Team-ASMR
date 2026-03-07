require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const result = await genAI.listModels();
    console.log("Available Models:");
    result.models.forEach(model => {
      console.log(`- ${model.name}`);
    });
  } catch (error) {
    console.error("Listing Models Error:", error.message);
  }
}

listModels();
