// ============================================================
// anomaly.js — Statistical Anomaly Detection Engine
// National Budget Flow Intelligence Platform
// ============================================================

const ANOMALY_THRESHOLDS = {
  CRITICAL: 3.0,
  HIGH:     2.5,
  MEDIUM:   2.0,
  LOW:      1.5
};

const UTIL_UNDERUTILIZATION_THRESHOLD = 40; // % utilization
const UTIL_SPIKE_THRESHOLD           = 100;  // % utilization

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr) {
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

function zScore(value, m, sd) {
  if (sd === 0) return 0;
  return (value - m) / sd;
}

function getSeverity(absZ) {
  if (absZ >= ANOMALY_THRESHOLDS.CRITICAL) return { level: 'Critical', color: '#ff3b5c', icon: '🔴' };
  if (absZ >= ANOMALY_THRESHOLDS.HIGH)     return { level: 'High',     color: '#ff8c42', icon: '🟠' };
  if (absZ >= ANOMALY_THRESHOLDS.MEDIUM)   return { level: 'Medium',   color: '#f7c948', icon: '🟡' };
  return                                            { level: 'Low',     color: '#4ade80', icon: '🟢' };
}

function classifyAnomaly(record, z) {
  if (record.anomalyType) return record.anomalyType;
  if (record.utilizationRate > UTIL_SPIKE_THRESHOLD)           return 'SPIKE';
  if (record.utilizationRate < UTIL_UNDERUTILIZATION_THRESHOLD) return 'UNDERUTILIZATION';
  if (z < -ANOMALY_THRESHOLDS.LOW)                              return 'DELAY';
  return 'LEAKAGE_RISK';
}

function getTypeLabel(type) {
  const labels = {
    'SPIKE':            { label: 'Expenditure Spike',     icon: '📈', color: '#ff3b5c' },
    'UNDERUTILIZATION': { label: 'Underutilization',      icon: '📉', color: '#f7c948' },
    'DELAY':            { label: 'Disbursement Delay',    icon: '⏳', color: '#60a5fa' },
    'LEAKAGE_RISK':     { label: 'Leakage Risk',          icon: '⚠️', color: '#f97316' }
  };
  return labels[type] || { label: type, icon: '❓', color: '#94a3b8' };
}

// ── Core Detection ─────────────────────────────────────────────

function detectAnomalies(records) {
  // Group spending ratios per department to compute baseline distribution
  const deptRatios = {};
  BudgetData.departments.forEach(d => { deptRatios[d] = []; });

  records.forEach(r => {
    deptRatios[r.department].push(r.utilizationRate);
  });

  const deptStats = {};
  BudgetData.departments.forEach(d => {
    const arr = deptRatios[d];
    deptStats[d] = { mean: mean(arr), sd: stdDev(arr) };
  });

  const detected = [];

  records.forEach(r => {
    const stats = deptStats[r.department];
    const z = zScore(r.utilizationRate, stats.mean, stats.sd);
    const absZ = Math.abs(z);

    if (absZ >= ANOMALY_THRESHOLDS.LOW || r.isAnomaly) {
      const severity = getSeverity(absZ >= ANOMALY_THRESHOLDS.LOW ? absZ : ANOMALY_THRESHOLDS.MEDIUM);
      const type = classifyAnomaly(r, z);
      const typeInfo = getTypeLabel(type);
      const expected = Math.round(stats.mean * 100) / 100;
      const deviation = Math.round((r.utilizationRate - expected) * 100) / 100;

      detected.push({
        ...r,
        zScore: Math.round(z * 100) / 100,
        severity,
        type,
        typeInfo,
        expected,
        deviation,
        financialImpact: Math.round(Math.abs(r.spent - (r.allocated * stats.mean / 100)) * 100) / 100
      });
    }
  });

  // Sort by severity then financial impact
  detected.sort((a, b) => {
    const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    const sDiff = (severityOrder[b.severity.level] || 0) - (severityOrder[a.severity.level] || 0);
    if (sDiff !== 0) return sDiff;
    return b.financialImpact - a.financialImpact;
  });

  return detected;
}

// ── Summary Stats ──────────────────────────────────────────────

function anomalySummary(anomalies) {
  const byType   = {};
  const bySev    = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  const byDept   = {};
  let totalImpact = 0;

  anomalies.forEach(a => {
    byType[a.type] = (byType[a.type] || 0) + 1;
    bySev[a.severity.level] = (bySev[a.severity.level] || 0) + 1;
    byDept[a.department] = (byDept[a.department] || 0) + 1;
    totalImpact += a.financialImpact;
  });

  return {
    total: anomalies.length,
    byType, bySev, byDept,
    totalImpact: Math.round(totalImpact * 100) / 100,
    criticalCount: bySev.Critical
  };
}

window.AnomalyEngine = { detectAnomalies, anomalySummary, getTypeLabel };
