const express = require('express');
const router = express.Router();
const BudgetRecord = require('../models/BudgetRecord');
const auth = require('../middleware/auth');

// GET /api/budget?year=2024&dept=Education&district=North+India
router.get('/', auth, async (req, res) => {
  try {
    const { year, dept, district } = req.query;
    const query = {};
    if (year)     query.year = parseInt(year);
    if (dept)     query.department = dept;
    if (district) query.district = district;

    const records = await BudgetRecord.find(query).lean();
    res.json({ records, count: records.length });
  } catch (err) {
    console.error('Budget query error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/budget/meta — returns constants (departments, districts, years, months)
router.get('/meta', auth, async (req, res) => {
  res.json({
    departments: ['Health & Family Welfare', 'Education', 'Road Transport & Highways', 'Agriculture & Farmers', 'Rural Development'],
    districts: ['North India', 'South India', 'East India', 'West India', 'Central India', 'Northeast India', 'Northwest India', 'Coastal Regions', 'Deccan Plateau', 'Hill States'],
    years: [2022, 2023, 2024],
    months: ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
  });
});

module.exports = router;
