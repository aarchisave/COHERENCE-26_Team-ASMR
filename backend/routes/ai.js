const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const BudgetRecord = require('../models/BudgetRecord');
const geminiService = require('../services/geminiService');

// POST /api/ai/chat
router.post('/chat', auth, async (req, res) => {
  try {
    const { year, query } = req.body;
    console.log(`🤖 AI Request: year=${year}, query="${query}"`);
    
    const data = await BudgetRecord.find({ isTotal: true }).lean();
    console.log(`📊 Found ${data.length} records for context.`);
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No budget data found for the current context." });
    }

    const aiResponse = await geminiService.getAIAnalysis(data, query, year || "2025");
    console.log(`✅ AI Response generated (${aiResponse.length} chars)`);
    
    res.json({ response: aiResponse });
  } catch (err) {
    console.error("AI Route Error:", err);
    res.status(500).json({ error: "Failed to process AI request: " + err.message });
  }
});

// POST /api/ai/report - Generate a detailed long-form report
router.post('/report', auth, async (req, res) => {
  try {
    const { year, data } = req.body;
    console.log(`📋 Detailed Report Request for year=${year}`);
    
    if (!data || data.length === 0) {
      return res.status(400).json({ error: "No data provided for report generation." });
    }

    const aiResponse = await geminiService.getAIAnalysis(data, "Detailed Executive Report", year || "2025", true);
    console.log(`✅ Detailed AI Report generated (${aiResponse.length} chars)`);
    
    res.json({ report: aiResponse });
  } catch (err) {
    console.error('AI Report Route Error:', err);
    res.status(500).json({ error: 'Failed to generate detailed report: ' + err.message });
  }
});

module.exports = router;
