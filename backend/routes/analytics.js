const express = require('express');
const router = express.Router();
const BudgetRecord = require('../models/BudgetRecord');
const auth = require('../middleware/auth');
const { detectAnomalies, anomalySummary } = require('../services/anomalyService');
const { generateAllForecasts } = require('../services/predictionService');
const { buildReallocationPlan } = require('../services/optimizerService');

const DEPARTMENTS = ['Health & Family Welfare', 'Education', 'Road Transport & Highways', 'Agriculture & Farmers', 'Rural Development'];
const DISTRICTS   = ['North India', 'South India', 'East India', 'West India', 'Central India', 'Northeast India', 'Northwest India', 'Coastal Regions', 'Deccan Plateau', 'Hill States'];
const MONTHS      = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

function getYear(req) { return parseInt(req.query.year) || 2024; }

// GET /api/analytics/overview?year=2024
router.get('/overview', auth, async (req, res) => {
  try {
    const year = getYear(req);
    const records = await BudgetRecord.find({ year }).lean();

    // Aggregate by dept
    const byDept = {};
    DEPARTMENTS.forEach(d => { byDept[d] = { allocated: 0, spent: 0, balance: 0 }; });
    records.forEach(r => {
      if (byDept[r.department]) {
        byDept[r.department].allocated += r.allocated;
        byDept[r.department].spent     += r.spent;
        byDept[r.department].balance   += r.balance;
      }
    });
    DEPARTMENTS.forEach(d => {
      byDept[d].utilizationRate = Math.round((byDept[d].spent / byDept[d].allocated) * 10000) / 100;
    });

    // Aggregate by district
    const byDistrict = {};
    DISTRICTS.forEach(d => { byDistrict[d] = { allocated: 0, spent: 0, balance: 0 }; });
    records.forEach(r => {
      if (byDistrict[r.district]) {
        byDistrict[r.district].allocated += r.allocated;
        byDistrict[r.district].spent     += r.spent;
        byDistrict[r.district].balance   += r.balance;
      }
    });
    DISTRICTS.forEach(d => {
      byDistrict[d].utilizationRate = Math.round((byDistrict[d].spent / byDistrict[d].allocated) * 10000) / 100;
    });

    // Monthly aggregates
    const byMonth = MONTHS.map((m, i) => {
      const monthRecs = records.filter(r => r.month === i);
      return {
        month: m, index: i,
        allocated: Math.round(monthRecs.reduce((s, r) => s + r.allocated, 0) * 100) / 100,
        released:  Math.round(monthRecs.reduce((s, r) => s + r.released, 0) * 100) / 100,
        spent:     Math.round(monthRecs.reduce((s, r) => s + r.spent, 0) * 100) / 100,
      };
    });

    const totalAlloc = Object.values(byDept).reduce((s, d) => s + d.allocated, 0);
    const totalSpent = Object.values(byDept).reduce((s, d) => s + d.spent, 0);

    const anomalies = detectAnomalies(records);
    const anomSummary = anomalySummary(anomalies);

    res.json({
      year, departments: DEPARTMENTS, districts: DISTRICTS, months: MONTHS,
      byDept, byDistrict, byMonth,
      kpi: {
        totalAllocated: Math.round(totalAlloc * 100) / 100,
        totalSpent:     Math.round(totalSpent * 100) / 100,
        utilizationRate: Math.round((totalSpent / totalAlloc) * 100),
        totalBalance:   Math.round((totalAlloc - totalSpent) * 100) / 100,
      },
      anomSummary,
      recentAnomalies: anomalies.slice(0, 8),
    });
  } catch (err) {
    console.error('Overview error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/anomalies?year=2024
router.get('/anomalies', auth, async (req, res) => {
  try {
    const year = getYear(req);
    const records = await BudgetRecord.find({ year }).lean();
    const anomalies = detectAnomalies(records);
    const summary = anomalySummary(anomalies);
    res.json({ anomalies, summary, year });
  } catch (err) {
    console.error('Anomalies error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/predictions?year=2024
router.get('/predictions', auth, async (req, res) => {
  try {
    const year = getYear(req);
    const records = await BudgetRecord.find({ year }).lean();
    const result = generateAllForecasts(records, year, DISTRICTS);
    res.json({ ...result, year, departments: DEPARTMENTS, districts: DISTRICTS, months: MONTHS });
  } catch (err) {
    console.error('Predictions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/optimizer?year=2024
router.get('/optimizer', auth, async (req, res) => {
  try {
    const year = getYear(req);
    const records = await BudgetRecord.find({ year }).lean();
    const { forecasts } = generateAllForecasts(records, year, DISTRICTS);
    const plan = buildReallocationPlan(forecasts, records, DISTRICTS);
    res.json({ ...plan, year, departments: DEPARTMENTS, districts: DISTRICTS });
  } catch (err) {
    console.error('Optimizer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/reports — multi-year summary
router.get('/reports', auth, async (req, res) => {
  try {
    const years = [2022, 2023, 2024];
    const summary = [];
    const deptAllYears = {};
    DEPARTMENTS.forEach(d => { deptAllYears[d] = { allocated: 0, spent: 0, anomalies: 0 }; });

    for (const year of years) {
      const records = await BudgetRecord.find({ year }).lean();
      const totalAlloc = Math.round(records.reduce((s, r) => s + r.allocated, 0) * 100) / 100;
      const totalSpent = Math.round(records.reduce((s, r) => s + r.spent, 0) * 100) / 100;
      const anomalies  = detectAnomalies(records);
      summary.push({
        year, totalAllocated: totalAlloc, totalSpent,
        unspentBalance: Math.round((totalAlloc - totalSpent) * 100) / 100,
        utilizationRate: Math.round((totalSpent / totalAlloc) * 100),
        anomalies: anomalies.length,
      });
      DEPARTMENTS.forEach(d => {
        const dRecs = records.filter(r => r.department === d);
        deptAllYears[d].allocated += dRecs.reduce((s, r) => s + r.allocated, 0);
        deptAllYears[d].spent     += dRecs.reduce((s, r) => s + r.spent, 0);
        deptAllYears[d].anomalies += anomalies.filter(a => a.department === d).length;
      });
    }

    const deptSummary = DEPARTMENTS.map(d => ({
      department: d,
      totalAllocated: Math.round(deptAllYears[d].allocated * 100) / 100,
      totalSpent:     Math.round(deptAllYears[d].spent * 100) / 100,
      avgUtilization: Math.round((deptAllYears[d].spent / deptAllYears[d].allocated) * 100),
      anomalies:      deptAllYears[d].anomalies,
    }));

    res.json({ summary, deptSummary, years, departments: DEPARTMENTS });
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
