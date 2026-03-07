const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const BudgetRecord    = require('../models/BudgetRecord');
const anomalyService  = require('../services/anomalyService');
const predictionService = require('../services/predictionService');
const optimizerService  = require('../services/optimizerService');

// ── Helper: pick financial columns based on selected FY ──────
function getFYFields(fy) {
  switch (fy) {
    case '2023': return { allocated: 'actuals2122Total', revenue: 'actuals2122Revenue', capital: 'actuals2122Capital', spent: 'actuals2122Total', label: 'FY 2023-24 (Actuals)' };
    case '2024': return { allocated: 'be2223Total', revenue: 'be2223Revenue', capital: 'be2223Capital', spent: 're2223Total', label: 'FY 2024-25 (Revised)' };
    case '2025': return { allocated: 'be2324Total', revenue: 'be2324Revenue', capital: 'be2324Capital', spent: 'currentSpent', label: 'FY 2025-26 (Current)' };
    default:     return { allocated: 'be2324Total', revenue: 'be2324Revenue', capital: 'be2324Capital', spent: 'currentSpent', label: 'FY 2025-26 (Current)' };
  }
}

// ── GET /api/analytics/overview ──────────────────────────────
router.get('/overview', auth, async (req, res) => {
  console.log('📬 GET /api/analytics/overview called by:', req.user?.email);
  try {
    const fy = req.query.year || '2023';
    const fields = getFYFields(fy);

    // Ministry-level totals
    const totals = await BudgetRecord.find({ isTotal: true }).lean();
    // Scheme-level records
    const schemes = await BudgetRecord.find({ isTotal: false }).lean();

    // KPIs
    const totalAllocated = totals.reduce((s, r) => s + (r[fields.allocated] || 0), 0);
    const totalSpent     = totals.reduce((s, r) => s + (r[fields.spent] || 0), 0);
    const totalBalance   = Math.round((totalAllocated - totalSpent) * 100) / 100;
    const utilizationRate = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

    // By Ministry (top 10 by allocation)
    const byMinistry = {};
    totals.forEach(r => {
      if (!byMinistry[r.ministry]) byMinistry[r.ministry] = { allocated: 0, spent: 0, revenue: 0, capital: 0 };
      byMinistry[r.ministry].allocated += r[fields.allocated] || 0;
      byMinistry[r.ministry].spent     += r[fields.spent] || 0;
      byMinistry[r.ministry].revenue   += r[fields.revenue] || 0;
      byMinistry[r.ministry].capital   += r[fields.capital] || 0;
    });

    const ministries = Object.keys(byMinistry).sort((a, b) => byMinistry[b].allocated - byMinistry[a].allocated);
    const topMinistries = ministries.slice(0, 10);

    // By Year comparison
    const yearComparison = totals.reduce((acc, r) => {
      acc.actuals2122 += r.actuals2122Total || 0;
      acc.be2223 += r.be2223Total || 0;
      acc.re2223 += r.re2223Total || 0;
      acc.be2324 += r.be2324Total || 0;
      return acc;
    }, { actuals2122: 0, be2223: 0, re2223: 0, be2324: 0 });

    // Anomaly detection on scheme-level rows
    const schemeData = schemes.map(r => ({
      ...r,
      allocated: r[fields.allocated] || 0,
      spent: r[fields.spent] || 0,
    })).filter(r => r.allocated > 0);

    const anomalies = anomalyService.detectAnomalies(schemeData);
    const anomSummary = anomalyService.getSummary(anomalies);
    const recentAnomalies = anomalies.slice(0, 8);

    res.json({
      kpi: { totalAllocated: Math.round(totalAllocated * 100) / 100, totalSpent: Math.round(totalSpent * 100) / 100, totalBalance, utilizationRate },
      byMinistry,
      topMinistries,
      allMinistries: ministries,
      yearComparison,
      anomSummary,
      recentAnomalies,
      fyLabel: fields.label,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics/anomalies ─────────────────────────────
router.get('/anomalies', auth, async (req, res) => {
  try {
    const fy = req.query.year || '2023';
    const fields = getFYFields(fy);

    const schemes = await BudgetRecord.find({ isTotal: false }).lean();
    const schemeData = schemes.map(r => ({
      ...r,
      allocated: r[fields.allocated] || 0,
      spent: r[fields.spent] || 0,
    })).filter(r => r.allocated > 0);

    const anomalies = anomalyService.detectAnomalies(schemeData);
    const summary   = anomalyService.getSummary(anomalies);

    res.json({ anomalies, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics/predictions ───────────────────────────
router.get('/predictions', auth, async (req, res) => {
  try {
    const totals = await BudgetRecord.find({ isTotal: true }).lean();

    const estimates = totals.map(r => {
      const dataPoints = [
        { year: 'FY 23-24', val: r.actuals2122Total || 0 },
        { year: 'FY 24-25', val: r.be2223Total || 0 },
        { year: 'FY 24-25 (Rev)', val: r.re2223Total || 0 },
        { year: 'FY 25-26', val: r.be2324Total || 0 },
      ];

      const allocated = r.be2324Total || 1;
      const spent     = r.currentSpent || 0;
      const { slope } = predictionService.linearRegression([0, 1, 2, 3], dataPoints.map(d => d.val));
      
      const projectedTotalSpent = Math.round(spent * (12 / 11.2));
      const estimatedUtilization = Math.round((projectedTotalSpent / allocated) * 100);
      const projectedNextYear = Math.round(allocated + slope);

      let riskLevel = 'Low', riskIcon = '🟢', riskColor = '#16a34a';
      if (estimatedUtilization < 75) { 
        riskLevel = 'Critical'; riskIcon = '🔴'; riskColor = '#e11d48'; 
      } else if (estimatedUtilization < 85) { 
        riskLevel = 'High'; riskIcon = '🟠'; riskColor = '#d97706'; 
      } else if (estimatedUtilization < 92) { 
        riskLevel = 'Medium'; riskIcon = '🟡'; riskColor = '#f59e0b'; 
      }

      const lapsedAmount = Math.max(0, allocated - projectedTotalSpent);
      const trend = slope > 100 ? 'Improving' : slope < -100 ? 'Declining' : 'Stable';
      const recommendation = riskLevel === 'Critical' ? 'Immediate fund reallocation required to prevent massive lapse.' :
        riskLevel === 'High' ? 'Accelerate procurement and disbursement for current month.' :
        riskLevel === 'Medium' ? 'Monitor month-end reconciliation closely.' : 'Maintaining healthy utilization pace.';

      return {
        ministry: r.ministry,
        historical: dataPoints.map(d => ({ period: d.year, actual: d.val })),
        chartData: [...dataPoints.map(d => d.val), projectedNextYear], // 5 points
        projectedNextYear, estimatedUtilization, riskLevel, riskIcon, riskColor, lapsedAmount, trend, recommendation,
      };
    }).filter(f => f.historical.some(h => h.actual > 0));

    const forecasts = estimates.sort((a, b) => a.estimatedUtilization - b.estimatedUtilization);
    const totalAtRisk    = forecasts.filter(f => f.riskLevel === 'Critical' || f.riskLevel === 'High').length;
    const totalLapseRisk = forecasts.reduce((s, f) => s + f.lapsedAmount, 0);
    const periods = ['FY 23-24', 'FY 24-25', 'FY 24-25 (Rev)', 'FY 25-26', 'FY 26-27 (Proj)'];

    res.json({ forecasts: forecasts.slice(0, 15), totalAtRisk, totalLapseRisk, periods, totalMinistries: forecasts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics/optimizer ─────────────────────────────
router.get('/optimizer', auth, async (req, res) => {
  try {
    const totals = await BudgetRecord.find({ isTotal: true }).lean();

    const ministryData = totals.map(r => {
      const allocated = r.be2324Total || 1;
      const spent     = r.currentSpent || 0;
      const util      = Math.round((spent / allocated) * 100);
      return { ministry: r.ministry, allocated, spent, utilizationRate: util, balance: allocated - spent };
    }).filter(r => r.allocated > 100);

    const avgUtil = ministryData.reduce((s, r) => s + r.utilizationRate, 0) / (ministryData.length || 1);
    
    // Wider dynamic thresholds to ensure results
    let surplus = ministryData.filter(r => r.utilizationRate < (avgUtil - 1.5)).sort((a,b) => b.balance - a.balance);
    let deficit = ministryData.filter(r => r.utilizationRate > (avgUtil + 1.5)).sort((a,b) => a.balance - b.balance);

    // Fallback if thresholds are too tight: take top/bottom 15%
    if (surplus.length === 0) surplus = [...ministryData].sort((a,b) => a.utilizationRate - b.utilizationRate).slice(0, Math.ceil(ministryData.length * 0.15));
    if (deficit.length === 0) deficit = [...ministryData].sort((a,b) => b.utilizationRate - a.utilizationRate).slice(0, Math.ceil(ministryData.length * 0.15));

    const transfers = [];
    const ministryDeltas = {};

    surplus.slice(0, 5).forEach((s, i) => {
      const target = deficit[i % deficit.length];
      if (!target || s.ministry === target.ministry) return;

      const amount = Math.min(s.balance * 0.18, 1200);
      if (amount < 50) return; // Ignore trivial moves

      transfers.push({
        from: s.ministry, fromUtilBefore: s.utilizationRate,
        to: target.ministry, toUtilBefore: target.utilizationRate,
        amount: Math.round(amount),
        impact: amount > 800 ? 'High' : amount > 300 ? 'Medium' : 'Low'
      });

      ministryDeltas[s.ministry] = (ministryDeltas[s.ministry] || 0) - amount;
      ministryDeltas[target.ministry] = (ministryDeltas[target.ministry] || 0) + amount;
    });

    const beforeEfficiency = Math.round(avgUtil * 10) / 10;
    const totalAmountMoved = transfers.reduce((s, t) => s + t.amount, 0);

    const top10 = ministryData.sort((a,b) => b.allocated - a.allocated).slice(0, 10);
    const originalForecasts = top10.map(r => ({ ministry: r.ministry, estimatedUtilization: r.utilizationRate }));
    const optimizedForecasts = top10.map(r => {
      const delta = ministryDeltas[r.ministry] || 0;
      const newAlloc = r.allocated + delta;
      const newUtil = Math.round((r.spent / newAlloc) * 100);
      return { ministry: r.ministry, estimatedUtilization: newUtil };
    });

    const afterEfficiency = Math.round(optimizedForecasts.reduce((s, r) => s + r.estimatedUtilization, 0) / optimizedForecasts.length * 10) / 10;


    res.json({
      transfers,
      originalForecasts, optimizedForecasts,
      departments: top10.map(r => r.ministry),
      beforeEfficiency, afterEfficiency,
      efficiencyGain: Math.round((afterEfficiency - beforeEfficiency) * 10) / 10,
      totalAmountMoved: Math.round(totalAmountMoved),
      totalLapseReduction: Math.round(totalAmountMoved * 0.45) // Estimated economic save
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analytics/reports ───────────────────────────────
router.get('/reports', auth, async (req, res) => {
  try {
    const totals = await BudgetRecord.find({ isTotal: true }).lean();

    const summary = [
      { year: '2023', label: 'FY 2023-24', totalAllocated: 0, totalSpent: 0 },
      { year: '2024', label: 'FY 2024-25', totalAllocated: 0, totalSpent: 0 },
      { year: '2025', label: 'FY 2025-26', totalAllocated: 0, totalSpent: 0 },
    ];
    totals.forEach(r => {
      summary[0].totalAllocated += r.actuals2122Total || 0;
      summary[0].totalSpent     += r.actuals2122Total || 0;
      summary[1].totalAllocated += r.be2223Total || 0;
      summary[1].totalSpent     += r.re2223Total || 0;
      summary[2].totalAllocated += r.be2324Total || 0;
      summary[2].totalSpent     += r.currentSpent || r.actuals2122Total || 0;
    });
    summary.forEach(s => {
      s.totalAllocated  = Math.round(s.totalAllocated * 100) / 100;
      s.totalSpent      = Math.round(s.totalSpent * 100) / 100;
      s.unspentBalance  = Math.round((s.totalAllocated - s.totalSpent) * 100) / 100;
      s.utilizationRate = s.totalAllocated > 0 ? Math.round((s.totalSpent / s.totalAllocated) * 100) : 0;
    });

    // Ministry summary
    const deptSummary = totals.map(r => ({
      ministry: r.ministry,
      totalAllocated: r.be2324Total || 0,
      totalSpent: r.currentSpent || r.actuals2122Total || 0,
      avgUtilization: r.be2324Total > 0 ? Math.round(((r.currentSpent || r.actuals2122Total || 0) / r.be2324Total) * 100) : 0,
    })).filter(d => d.totalAllocated > 0).sort((a, b) => b.totalAllocated - a.totalAllocated);

    res.json({ summary, deptSummary, years: ['2023-24', '2024-25', '2025-26'] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
