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
    });
  } catch (err) {
    console.error('Ingestion error:', err);
    res.status(500).json({ error: 'Failed to process file: ' + err.message });
  }
});

module.exports = router;
