const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const auth     = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload  = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/ingestion/upload
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];

    if (ext === '.csv') {
      const { parse } = require('csv-parse/sync');
      rows = parse(req.file.buffer.toString('utf-8'), { columns: true, skip_empty_lines: true });
    } else if (ext === '.xlsx' || ext === '.xls') {
      const XLSX = require('xlsx');
      const wb   = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws);
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use CSV or XLSX.' });
    }

    if (!rows.length) return res.status(400).json({ error: 'File is empty or could not be parsed.' });

    const headers = Object.keys(rows[0]);
    const preview = rows.slice(0, 5);

    // ── Auto-Mapping & Advanced Analytics ───────────────────────
    // 1. Identify key columns
    const deptCol = headers.find(h => /dept|ministry|sector/i.test(h)) || headers[0];
    const allocCol = headers.find(h => /alloc|budget|be2/i.test(h)) || headers.find(h => !isNaN(parseFloat(rows[0][h])));
    const spentCol = headers.find(h => /spent|actual|re2|expend/i.test(h)) || headers.reverse().find(h => !isNaN(parseFloat(rows[0][h])));
    headers.reverse(); // put headers back in order

    // 2. Departmental Aggregation (for Pie Chart)
    const deptMap = {};
    rows.forEach(r => {
      const name = r[deptCol] || 'Unknown';
      if (!deptMap[name]) deptMap[name] = { allocated: 0, spent: 0 };
      deptMap[name].allocated += parseFloat(r[allocCol]) || 0;
      deptMap[name].spent += parseFloat(r[spentCol]) || 0;
    });

    const deptStats = Object.keys(deptMap).map(name => ({
      name,
      allocated: Math.round(deptMap[name].allocated * 100) / 100,
      spent: Math.round(deptMap[name].spent * 100) / 100,
      utilization: deptMap[name].allocated > 0 ? Math.round((deptMap[name].spent / deptMap[name].allocated) * 100) : 0
    })).sort((a, b) => b.allocated - a.allocated);

    // 3. Spike detection (for Line Chart)
    // We'll treat the row index as a proxy for time/sequence if no date is found
    const spikes = rows.map((r, i) => {
      const allocated = parseFloat(r[allocCol]) || 1;
      const spent = parseFloat(r[spentCol]) || 0;
      const ratio = spent / allocated;
      return { 
        index: i + 1, 
        label: r[deptCol] || `Row ${i+1}`,
        value: Math.round(ratio * 100),
        isAnomaly: ratio > 1.2 || ratio < 0.4
      };
    }).slice(0, 50); // limit to first 50 for visualization

    // 4. AI Insights / Fallback Analysis
    let aiInsights = "Analyzing dataset for insights...";
    try {
      const geminiService = require('../services/geminiService');
      // Pass a subset of the aggregated data to Gemini
      aiInsights = await geminiService.getAIAnalysis(
        deptStats.map(d => ({ ministry: d.name, be2324Total: d.allocated, currentSpent: d.spent, utilizationRate: d.utilization })),
        "Analyze this uploaded dataset. Identify top 3 spending anomalies, suggest 2 reallocation opportunities, and predict year-end spend percentage.",
        "Custom Dataset"
      );
    } catch (err) {
      console.warn("AI Ingestion Insight Error:", err.message);
      // Simple rule-based summary as fallback
      const totalAlloc = deptStats.reduce((s, d) => s + d.allocated, 0);
      const totalSpent = deptStats.reduce((s, d) => s + d.spent, 0);
      const avgUtil = totalAlloc > 0 ? (totalSpent / totalAlloc * 100).toFixed(1) : 0;
      aiInsights = `### Dataset Summary (Fallback)
      - **Total Allocation**: ₹${totalAlloc.toLocaleString()} Cr
      - **Current Utilization**: ${avgUtil}%
      - **Key Observation**: ${deptStats[0]?.name} is the largest sector with ${deptStats[0]?.utilization}% utilization.
      - **Reallocation**: Suggest reviewing ${deptStats.find(d => d.utilization < 40)?.name || 'low-utilization sectors'} for potential fund movement.`;
    }

    // Auto-detect numeric columns for basic analytics
    const numericCols = headers.filter(h => !isNaN(parseFloat(rows[0][h])));
    const colStats = numericCols.map(col => {
      const values = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
      const sum    = values.reduce((a, b) => a + b, 0);
      const avg    = sum / values.length;
      const max    = Math.max(...values);
      const min    = Math.min(...values);
      return { col, sum: Math.round(sum * 100) / 100, avg: Math.round(avg * 100) / 100, max, min, count: values.length };
    });

    res.json({
      filename:   req.file.originalname,
      totalRows:  rows.length,
      headers,
      preview,
      numericCols,
      colStats,
      advanced: {
        deptStats,
        spikes,
        aiInsights
      }
    });
  } catch (err) {
    console.error('Ingestion error:', err);
    res.status(500).json({ error: 'Failed to process file: ' + err.message });
  }
});

module.exports = router;
