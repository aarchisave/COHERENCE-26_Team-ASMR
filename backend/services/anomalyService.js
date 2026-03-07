// ============================================================
// anomalyService.js — Anomaly detection for real budget data
// Uses Z-score on utilization and spending patterns
// ============================================================

function zScore(value, mean, stdDev) {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

function mean(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }
function stdDev(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length || 1));
}

function classifyAnomaly(allocated, spent) {
  const ratio = spent / (allocated || 1);
  if (ratio > 1.5)  return 'SPIKE';
  if (ratio < 0.3)  return 'UNDERUTILIZATION';
  if (ratio > 1.2)  return 'LEAKAGE_RISK';
  if (ratio < 0.5)  return 'DELAY';
  return null;
}

function getSeverity(z) {
  const absZ = Math.abs(z);
  if (absZ >= 3)   return { level: 'Critical', icon: '🔴', color: '#e11d48' };
  if (absZ >= 2)   return { level: 'High',     icon: '🟠', color: '#d97706' };
  if (absZ >= 1.5) return { level: 'Medium',   icon: '🟡', color: '#f59e0b' };
  return { level: 'Low', icon: '🟢', color: '#16a34a' };
}

function detectAnomalies(records) {
  if (!records.length) return [];

  const ratios = records.map(r => r.spent / (r.allocated || 1));
  const m = mean(ratios);
  const sd = stdDev(ratios);

  const anomalies = [];
  for (const r of records) {
    const ratio = r.spent / (r.allocated || 1);
    const z = zScore(ratio, m, sd);
    const type = classifyAnomaly(r.allocated, r.spent);
    // Ignore anomalies on very low allocations (< 1 Cr) as they lead to misleading noise
    if (r.allocated >= 1 && Math.abs(z) >= 1.3 && type) {
      const utilizationRate = Math.round(ratio * 10000) / 100;
      const financialImpact = Math.abs(r.allocated - r.spent);
      anomalies.push({
        ministry: r.ministry,
        scheme: r.scheme,
        demandNo: r.demandNo,
        allocated: Math.round(r.allocated * 100) / 100,
        spent: Math.round(r.spent * 100) / 100,
        utilizationRate,
        zScore: Math.round(z * 100) / 100,
        type,
        severity: getSeverity(z),
        financialImpact: Math.round(financialImpact * 100) / 100,
      });
    }
  }

  anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
  return anomalies;
}

function getSummary(anomalies) {
  const bySev  = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  const byType = {};
  for (const a of anomalies) {
    bySev[a.severity.level] = (bySev[a.severity.level] || 0) + 1;
    byType[a.type] = (byType[a.type] || 0) + 1;
  }
  return { total: anomalies.length, bySev, byType, criticalCount: bySev.Critical };
}

module.exports = { detectAnomalies, getSummary };
