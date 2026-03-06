// ============================================================
// prediction.js — Fund Lapse Risk Forecasting Engine
// National Budget Flow Intelligence Platform
// ============================================================

const LAPSE_RISK_THRESHOLD    = 80;  // % utilization = fund lapse risk boundary
const CRITICAL_RISK_THRESHOLD = 68;  // % utilization = critical lapse risk

// ── Linear Regression ─────────────────────────────────────────

function linearRegression(xArr, yArr) {
  const n = xArr.length;
  if (n < 2) return { slope: 0, intercept: yArr[0] || 0 };
  const sumX  = xArr.reduce((a, b) => a + b, 0);
  const sumY  = yArr.reduce((a, b) => a + b, 0);
  const sumXY = xArr.reduce((acc, x, i) => acc + x * yArr[i], 0);
  const sumX2 = xArr.reduce((acc, x) => acc + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope: Math.round(slope * 10000) / 10000, intercept: Math.round(intercept * 100) / 100 };
}

function predict(model, x) {
  return Math.max(0, Math.round((model.slope * x + model.intercept) * 100) / 100);
}

// ── Forecast Per Department ────────────────────────────────────

function forecastDepartment(dept, year, records) {
  const deptRecords = records.filter(r =>
    r.department === dept && r.year === year
  ).sort((a, b) => a.month - b.month);

  if (deptRecords.length < 3) return null;

  const xArr = deptRecords.map(r => r.month);
  const yArr = deptRecords.map(r => r.utilizationRate);

  const model = linearRegression(xArr, yArr);

  // Project next 3 months
  const lastMonth = Math.max(...xArr);
  const futureMonths = [lastMonth + 1, lastMonth + 2, lastMonth + 3].filter(m => m <= 11);
  const projections = futureMonths.map(m => ({
    month: m,
    monthName: BudgetData.months[m],
    projected: Math.min(130, Math.max(0, predict(model, m)))
  }));

  // Cumulative spending vs allocation
  const totalAllocated = deptRecords.reduce((s, r) => s + r.allocated, 0);
  const totalSpent     = deptRecords.reduce((s, r) => s + r.spent, 0);
  const avgMonthlySpend = totalSpent / deptRecords.length;

  // Estimate year-end utilization
  const remainingMonths = 11 - lastMonth;
  const projectedAdditionalSpend = projections.reduce((s, p) => {
    return s + (totalAllocated / 12) * (p.projected / 100);
  }, 0);
  const estimatedYearEnd = totalSpent + projectedAdditionalSpend;
  const estimatedUtilization = Math.round((estimatedYearEnd / totalAllocated) * 100);

  // Risk scoring
  let riskLevel, riskColor, riskIcon, recommendation;
  if (estimatedUtilization < CRITICAL_RISK_THRESHOLD) {
    riskLevel = 'Critical'; riskColor = '#ff3b5c'; riskIcon = '🔴';
    recommendation = 'Immediate reallocation required — high lapse risk';
  } else if (estimatedUtilization < LAPSE_RISK_THRESHOLD) {
    riskLevel = 'High'; riskColor = '#ff8c42'; riskIcon = '🟠';
    recommendation = 'Accelerate spending or initiate partial reallocation';
  } else if (estimatedUtilization < 85) {
    riskLevel = 'Medium'; riskColor = '#f7c948'; riskIcon = '🟡';
    recommendation = 'Monitor closely — minor intervention needed';
  } else {
    riskLevel = 'Low'; riskColor = '#4ade80'; riskIcon = '🟢';
    recommendation = 'On track — no intervention required';
  }

  const lapsedAmount = Math.max(0, Math.round((totalAllocated - estimatedYearEnd) * 100) / 100);

  return {
    department: dept, year,
    model,
    historical: deptRecords.map(r => ({ month: r.month, monthName: r.monthName, actual: r.utilizationRate })),
    projections,
    totalAllocated: Math.round(totalAllocated * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    estimatedYearEnd: Math.round(estimatedYearEnd * 100) / 100,
    estimatedUtilization,
    lapsedAmount,
    riskLevel, riskColor, riskIcon, recommendation,
    trend: model.slope > 0.5 ? 'Improving' : model.slope < -0.5 ? 'Declining' : 'Stable'
  };
}

// ── All Department Forecasts ───────────────────────────────────

function generateAllForecasts(records, year) {
  const forecasts = BudgetData.departments.map(dept =>
    forecastDepartment(dept, year, records)
  ).filter(Boolean);

  // Risk heatmap: dept × district utilization projections
  const heatmap = [];
  BudgetData.departments.forEach(dept => {
    BudgetData.districts.forEach(district => {
      const subset = records.filter(r =>
        r.year === year && r.department === dept && r.district === district
      ).sort((a, b) => a.month - b.month);

      if (subset.length < 2) return;
      const xArr = subset.map(r => r.month);
      const yArr = subset.map(r => r.utilizationRate);
      const model = linearRegression(xArr, yArr);
      const lastM = Math.max(...xArr);
      const proj  = Math.min(130, Math.max(0, predict(model, lastM + 2)));

      heatmap.push({
        dept, district,
        projectedUtil: Math.round(proj * 10) / 10,
        isAtRisk: proj < LAPSE_RISK_THRESHOLD
      });
    });
  });

  const totalAtRisk = forecasts.filter(f => f.riskLevel === 'Critical' || f.riskLevel === 'High');
  const totalLapseRisk = totalAtRisk.reduce((s, f) => s + f.lapsedAmount, 0);

  return { forecasts, heatmap, totalAtRisk: totalAtRisk.length, totalLapseRisk: Math.round(totalLapseRisk * 100) / 100 };
}

window.PredictionEngine = { generateAllForecasts, forecastDepartment };
