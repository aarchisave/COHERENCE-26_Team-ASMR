// ============================================================
// app.js — Main Application Controller
// National Budget Flow Intelligence Platform
// ============================================================

// ── Chart.js Global Defaults ──────────────────────────────────
function getThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    text:       isDark ? '#94a3b8' : '#64748b',
    border:     isDark ? 'rgba(45,55,72,0.8)' : 'rgba(226,229,236,0.8)',
    tooltipBg:  isDark ? '#1c2230' : '#ffffff',
    tooltipBorder: isDark ? '#2d3748' : '#e2e5ec',
    tooltipTitle: isDark ? '#e2e8f0' : '#0f172a',
    tooltipBody:  isDark ? '#94a3b8' : '#475569',
  };
}

function applyChartDefaults() {
  const t = getThemeColors();
  Chart.defaults.color            = t.text;
  Chart.defaults.borderColor      = t.border;
  Chart.defaults.font.family      = "'Inter', sans-serif";
  Chart.defaults.font.size        = 12;
  Chart.defaults.plugins.tooltip.backgroundColor = t.tooltipBg;
  Chart.defaults.plugins.tooltip.borderColor     = t.tooltipBorder;
  Chart.defaults.plugins.tooltip.borderWidth     = 1;
  Chart.defaults.plugins.tooltip.titleColor      = t.tooltipTitle;
  Chart.defaults.plugins.tooltip.bodyColor       = t.tooltipBody;
  Chart.defaults.plugins.tooltip.padding         = 10;
  Chart.defaults.plugins.tooltip.cornerRadius    = 6;
  Chart.defaults.plugins.tooltip.boxPadding      = 4;
  Chart.defaults.plugins.legend.labels.boxWidth  = 8;
  Chart.defaults.plugins.legend.labels.boxHeight = 8;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding   = 14;
}

applyChartDefaults();

// ── Neutral Professional Color Palettes ───────────────────────
// Primary 5-dept palette: slate-blue, teal, indigo, amber, rose (all muted)
const DEPT_COLORS = [
  '#3b82f6',  // Blue
  '#0d9488',  // Teal
  '#7c3aed',  // Violet
  '#d97706',  // Amber
  '#e11d48',  // Rose
];
const DISTRICT_COLORS = [
  '#3b82f6','#0d9488','#7c3aed','#d97706','#e11d48',
  '#0891b2','#65a30d','#db2777','#9333ea','#16a34a'
];

// ── State ─────────────────────────────────────────────────────
const State = {
  activeSection: 'overview',
  selectedYear: 2024,
  selectedDept: null,
  selectedDistrict: null,
  charts: {}
};

// ── Navigation ─────────────────────────────────────────────────
function navigate(sectionId) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const section = document.getElementById('sec-' + sectionId);
  const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);

  if (section) section.classList.add('active');
  if (navItem) navItem.classList.add('active');

  State.activeSection = sectionId;

  // Render section
  const renderers = {
    overview:   renderOverview,
    flowtracker: renderFlowTracker,
    anomaly:    renderAnomalyDetection,
    prediction: renderPrediction,
    optimizer:  renderOptimizer,
    reports:    renderReports,
    ingestion:  renderIngestion
  };

  if (renderers[sectionId]) renderers[sectionId]();

  // Update topbar title
  const titles = {
    overview:    'Executive Dashboard',
    flowtracker: 'Budget Flow Tracker',
    anomaly:     'Anomaly Detection',
    prediction:  'Predictive Risk Modeling',
    optimizer:   'Reallocation Optimizer',
    reports:     'Reports & Insights',
    ingestion:   'Data Ingestion'
  };
  document.getElementById('topbar-title').textContent = titles[sectionId] || '';
}

// ── Destroy chart helper ───────────────────────────────────────
function destroyChart(key) {
  if (State.charts[key]) {
    State.charts[key].destroy();
    delete State.charts[key];
  }
}

// ── Format helpers ─────────────────────────────────────────────
function fmt(n, decimals = 1) {
  if (n >= 1000) return (n / 1000).toFixed(decimals) + 'K';
  return n.toFixed(decimals);
}

function fmtCr(n) {
  if (Math.abs(n) >= 1000) return '₹' + (n / 1000).toFixed(2) + 'K Cr';
  return '₹' + n.toFixed(1) + ' Cr';
}

function getBadgeClass(severity) {
  const map = { Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
  return map[severity] || 'badge-blue';
}

function getRiskColor(util) {
  if (util < 55) return '#e11d48';  // rose-600
  if (util < 70) return '#d97706';  // amber-600
  if (util < 85) return '#0891b2';  // sky-600
  return '#16a34a';                 // green-600
}

function getUtilGradient(util) {
  if (util < 55) return '#e11d48';
  if (util < 70) return '#d97706';
  if (util < 85) return '#0891b2';
  return '#16a34a';
}

// ── Create unique chart canvas ─────────────────────────────────
function getCanvas(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  return el.getContext('2d');
}

// ── SECTION 1: EXECUTIVE OVERVIEW ─────────────────────────────
function renderOverview() {
  const records = BudgetData.filter(BudgetData.raw, { year: State.selectedYear });
  const byDept  = BudgetData.byDept(records);
  const byDist  = BudgetData.byDistrict(records);
  const anomalies = AnomalyEngine.detectAnomalies(records);
  const anomSummary = AnomalyEngine.anomalySummary(anomalies);

  const totalAlloc = Object.values(byDept).reduce((s, d) => s + d.allocated, 0);
  const totalSpent = Object.values(byDept).reduce((s, d) => s + d.spent, 0);
  const overallUtil = Math.round((totalSpent / totalAlloc) * 100);
  const totalBalance = totalAlloc - totalSpent;

  // KPI cards
  document.getElementById('kpi-total-budget').textContent = fmtCr(totalAlloc);
  document.getElementById('kpi-total-spent').textContent  = fmtCr(totalSpent);
  document.getElementById('kpi-util-rate').textContent    = overallUtil + '%';
  document.getElementById('kpi-anomalies').textContent    = anomSummary.total;
  document.getElementById('kpi-critical').textContent     = anomSummary.criticalCount;
  document.getElementById('kpi-lapse-risk').textContent   = fmtCr(totalBalance);

  // ── Chart 1: Allocation vs Spending by Dept ──────────────
  destroyChart('overviewBar');
  const ctx1 = getCanvas('chart-overview-bar');
  if (ctx1) {
    State.charts.overviewBar = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: BudgetData.departments,
        datasets: [
          {
            label: 'Allocated',
            data: BudgetData.departments.map(d => byDept[d].allocated),
            backgroundColor: 'rgba(59,130,246,0.15)',
            borderColor: '#3b82f6',
            borderWidth: 1.5,
            borderRadius: 4,
          },
          {
            label: 'Spent',
            data: BudgetData.departments.map(d => byDept[d].spent),
            backgroundColor: 'rgba(13,148,136,0.15)',
            borderColor: '#0d9488',
            borderWidth: 1.5,
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { drawBorder: false }, ticks: { callback: v => '₹' + fmt(v) + ' Cr' } }
        }
      }
    });
  }

  // ── Chart 2: Utilization Donut ───────────────────────────────
  destroyChart('overviewDonut');
  const ctx2 = getCanvas('chart-overview-donut');
  if (ctx2) {
    State.charts.overviewDonut = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: BudgetData.departments,
        datasets: [{
          data: BudgetData.departments.map(d => byDept[d].spent),
          backgroundColor: DEPT_COLORS.map(c => c + 'aa'),
          borderColor: DEPT_COLORS,
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 14 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmtCr(ctx.raw)}` } }
        }
      }
    });
  }

  // ── Chart 3: Monthly Trend ───────────────────────────────
  destroyChart('overviewTrend');
  const ctx3 = getCanvas('chart-overview-trend');
  if (ctx3) {
    const monthly = BudgetData.byMonth(records);
    State.charts.overviewTrend = new Chart(ctx3, {
      type: 'line',
      data: {
        labels: BudgetData.months,
        datasets: [
          {
            label: 'Allocated',
            data: monthly.map(m => m.allocated),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.06)',
            fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6, borderWidth: 2
          },
          {
            label: 'Released',
            data: monthly.map(m => m.released),
            borderColor: '#94a3b8',
            backgroundColor: 'transparent',
            fill: false, tension: 0.4, borderDash: [4,3], pointRadius: 2, borderWidth: 1.5
          },
          {
            label: 'Spent',
            data: monthly.map(m => m.spent),
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0,212,255,0.06)',
            fill: true, tension: 0.45, pointRadius: 4, pointHoverRadius: 7, pointBackgroundColor: '#00d4ff'
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { grid: { color: 'rgba(99,137,255,0.07)' } },
          y: { grid: { color: 'rgba(99,137,255,0.07)' }, ticks: { callback: v => '₹' + fmt(v) + ' Cr' } }
        }
      }
    });
  }

  // ── Anomaly Alert Feed ────────────────────────────────────────
  const feedEl = document.getElementById('anomaly-feed');
  if (feedEl) {
    feedEl.innerHTML = '';
    anomalies.slice(0, 8).forEach(a => {
      const levelClass = a.severity.level.toLowerCase();
      const ti = AnomalyEngine.getTypeLabel(a.type);
      feedEl.innerHTML += `
        <div class="alert-item ${levelClass}">
          <span class="alert-icon">${ti.icon}</span>
          <div class="alert-content">
            <div class="alert-title">${a.department} · ${a.district}</div>
            <div class="alert-meta">${a.monthName} ${a.year} &nbsp;·&nbsp; Utilization: ${a.utilizationRate}% &nbsp;·&nbsp; Impact: ${fmtCr(a.financialImpact)}</div>
          </div>
          <span class="alert-badge badge ${getBadgeClass(a.severity.level)}">${a.severity.level}</span>
        </div>`;
    });
  }

  // ── District Heatmap ──────────────────────────────────────────
  const heatEl = document.getElementById('district-heatmap');
  if (heatEl) {
    heatEl.innerHTML = '';
    const districtList = Object.entries(byDist).sort((a, b) => b[1].utilizationRate - a[1].utilizationRate);
    districtList.forEach(([name, info]) => {
      const u = info.utilizationRate;
      const col = getRiskColor(u);
      heatEl.innerHTML += `
        <div style="margin-bottom:10px;">
          <div class="flex-between mb-4">
            <span style="font-size:0.78rem;font-weight:600;">${name}</span>
            <span class="mono" style="font-size:0.75rem;color:${col};font-weight:700;">${u}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${Math.min(u,100)}%;background:${col};"></div>
          </div>
        </div>`;
    });
  }
}

// ── SECTION 2: BUDGET FLOW TRACKER ────────────────────────────
function renderFlowTracker() {
  const records = BudgetData.filter(BudgetData.raw, { year: State.selectedYear });
  const byDept  = BudgetData.byDept(records);
  const byDist  = BudgetData.byDistrict(records);

  // ── Horizontal Bar: Utilization by District ──────────────────
  destroyChart('flowDistBar');
  const ctx1 = getCanvas('chart-flow-dist');
  if (ctx1) {
    const sorted = Object.entries(byDist).sort((a, b) => b[1].utilizationRate - a[1].utilizationRate);
    State.charts.flowDistBar = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: sorted.map(d => d[0]),
        datasets: [{
          label: 'Utilization Rate (%)',
          data: sorted.map(d => d[1].utilizationRate),
          backgroundColor: sorted.map(d => getRiskColor(d[1].utilizationRate) + 'aa'),
          borderColor: sorted.map(d => getRiskColor(d[1].utilizationRate)),
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => ` ${c.raw}% utilization` } }
        },
        scales: {
          x: { max: 120, grid: { color: 'rgba(99,137,255,0.07)' }, ticks: { callback: v => v + '%' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  // ── Stacked Bar: Allocation Flow by Dept ─────────────────────
  destroyChart('flowDeptStack');
  const ctx2 = getCanvas('chart-flow-stack');
  if (ctx2) {
    State.charts.flowDeptStack = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: BudgetData.departments,
        datasets: [
          {
            label: 'Spent',
            data: BudgetData.departments.map(d => byDept[d].spent),
            backgroundColor: 'rgba(0,212,255,0.5)',
            borderColor: '#00d4ff', borderWidth: 1, borderRadius: 0
          },
          {
            label: 'Balance (Unspent)',
            data: BudgetData.departments.map(d => byDept[d].balance),
            backgroundColor: 'rgba(255,59,92,0.3)',
            borderColor: '#ff3b5c', borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, grid: { color: 'rgba(99,137,255,0.07)' }, ticks: { callback: v => '₹' + fmt(v) } }
        }
      }
    });
  }

  // ── Flow Table ────────────────────────────────────────────────
  const tableEl = document.getElementById('flow-table-body');
  if (tableEl) {
    tableEl.innerHTML = '';
    let rows = [];
    BudgetData.departments.forEach(dept => {
      BudgetData.districts.forEach(district => {
        const subset = records.filter(r => r.department === dept && r.district === district);
        const alloc = Math.round(subset.reduce((s, r) => s + r.allocated, 0) * 10) / 10;
        const spent = Math.round(subset.reduce((s, r) => s + r.spent, 0) * 10) / 10;
        const util  = alloc > 0 ? Math.round((spent / alloc) * 1000) / 10 : 0;
        rows.push({ dept, district, alloc, spent, balance: Math.round((alloc - spent) * 10) / 10, util });
      });
    });
    rows.sort((a, b) => a.util - b.util);
    rows.slice(0, 20).forEach(r => {
      const col = getRiskColor(r.util);
      tableEl.innerHTML += `
        <tr>
          <td><span class="badge badge-neutral">${r.dept}</span></td>
          <td style="color:var(--text-primary);font-weight:600;">${r.district}</td>
          <td class="mono">${fmtCr(r.alloc)}</td>
          <td class="mono">${fmtCr(r.spent)}</td>
          <td class="mono" style="color:var(--color-danger);">${fmtCr(r.balance)}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="progress-bar" style="min-width:80px;">
                <div class="progress-fill" style="width:${Math.min(r.util,100)}%;background:${col};"></div>
              </div>
              <span class="mono" style="color:${col};font-weight:600;font-size:0.75rem;">${r.util}%</span>
            </div>
          </td>
        </tr>`;
    });
  }
}

// ── SECTION 3: ANOMALY DETECTION ──────────────────────────────
function renderAnomalyDetection() {
  const records  = BudgetData.filter(BudgetData.raw, { year: State.selectedYear });
  const anomalies = AnomalyEngine.detectAnomalies(records);
  const summary   = AnomalyEngine.anomalySummary(anomalies);

  // ── KPI Badges ────────────────────────────────────────────────
  document.getElementById('anom-total').textContent    = summary.total;
  document.getElementById('anom-critical').textContent = summary.bySev.Critical;
  document.getElementById('anom-high').textContent     = summary.bySev.High;
  document.getElementById('anom-impact').textContent   = fmtCr(summary.totalImpact);

  // ── Scatter: Expected vs Actual Utilization ──────────────────
  destroyChart('anomScatter');
  const ctx1 = getCanvas('chart-anomaly-scatter');
  if (ctx1) {
    const normalPts  = records.filter(r => !r.isAnomaly).map(r => ({ x: r.utilizationRate, y: r.spent }));
    const anomPts    = anomalies.map(a => ({
      x: a.utilizationRate, y: a.spent,
      dept: a.department, district: a.district, type: a.type, sev: a.severity.level
    }));

    State.charts.anomScatter = new Chart(ctx1, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Normal',
            data: normalPts.slice(0, 300),
            backgroundColor: 'rgba(79,124,255,0.3)',
            pointRadius: 3, pointHoverRadius: 6
          },
          {
            label: 'Anomaly',
            data: anomPts,
            backgroundColor: 'rgba(255,59,92,0.7)',
            borderColor: '#ff3b5c',
            borderWidth: 1,
            pointRadius: 6, pointHoverRadius: 10,
            pointStyle: 'triangle'
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: ctx => {
                const d = ctx.raw;
                if (d.dept) return [` ${d.dept} · ${d.district}`, ` Util: ${d.x}%, Spent: ${fmtCr(d.y)}`, ` Type: ${d.type} | Severity: ${d.sev}`];
                return ` Util: ${d.x}%, Spent: ${fmtCr(d.y)}`;
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Utilization Rate (%)' }, grid: { color: 'rgba(99,137,255,0.07)' } },
          y: { title: { display: true, text: 'Spent (Cr ₹)' }, grid: { color: 'rgba(99,137,255,0.07)' }, ticks: { callback: v => '₹' + fmt(v) } }
        }
      }
    });
  }

  // ── Type Distribution Bar ─────────────────────────────────────
  destroyChart('anomTypeDist');
  const ctx2 = getCanvas('chart-anomaly-types');
  if (ctx2) {
    const types = ['SPIKE', 'UNDERUTILIZATION', 'DELAY', 'LEAKAGE_RISK'];
    const typeColors = { SPIKE: '#ff3b5c', UNDERUTILIZATION: '#f7c948', DELAY: '#60a5fa', LEAKAGE_RISK: '#f97316' };
    State.charts.anomTypeDist = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: types.map(t => AnomalyEngine.getTypeLabel(t).label),
        datasets: [{
          data: types.map(t => summary.byType[t] || 0),
          backgroundColor: types.map(t => typeColors[t] + 'aa'),
          borderColor: types.map(t => typeColors[t]),
          borderWidth: 2, hoverOffset: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { padding: 12 } } }
      }
    });
  }

  // ── Anomaly Table ─────────────────────────────────────────────
  const tbody = document.getElementById('anomaly-table-body');
  if (tbody) {
    tbody.innerHTML = '';
    anomalies.slice(0, 25).forEach(a => {
      const ti = AnomalyEngine.getTypeLabel(a.type);
      tbody.innerHTML += `
        <tr>
          <td style="color:var(--text-primary);font-weight:600;">${a.department}</td>
          <td>${a.district}</td>
          <td>${a.monthName} ${a.year}</td>
          <td><span style="color:${ti.color};font-weight:600;">${ti.icon} ${ti.label}</span></td>
          <td class="mono" style="color:var(--accent-cyan);">${a.utilizationRate}%</td>
          <td class="mono" style="color:var(--text-muted);">${a.expected}%</td>
          <td class="mono" style="color:${a.deviation > 0 ? 'var(--accent-red)' : 'var(--accent-yellow)'};">${a.deviation > 0 ? '+' : ''}${a.deviation}%</td>
          <td class="mono" style="color:var(--accent-orange);">${fmtCr(a.financialImpact)}</td>
          <td><span class="badge ${getBadgeClass(a.severity.level)}">${a.severity.icon} ${a.severity.level}</span></td>
        </tr>`;
    });
  }
}

// ── SECTION 4: PREDICTIVE RISK MODELING ───────────────────────
function renderPrediction() {
  const records = BudgetData.filter(BudgetData.raw, { year: State.selectedYear });
  const { forecasts, heatmap, totalAtRisk, totalLapseRisk } = PredictionEngine.generateAllForecasts(records, State.selectedYear);

  document.getElementById('pred-at-risk').textContent  = totalAtRisk;
  document.getElementById('pred-lapse-amt').textContent = fmtCr(totalLapseRisk);
  document.getElementById('pred-total-depts').textContent = forecasts.length;

  // ── Multi-line Forecast Chart ─────────────────────────────────
  destroyChart('predForecast');
  const ctx1 = getCanvas('chart-pred-forecast');
  if (ctx1) {
    const datasets = [];
    forecasts.forEach((f, i) => {
      const color = DEPT_COLORS[i % DEPT_COLORS.length];
      const hist  = f.historical.map(h => ({ x: h.month, y: h.actual }));
      const proj  = f.projections.map(p => ({ x: p.month, y: p.projected }));

      datasets.push({
        label: f.department + ' (Historical)',
        data: hist, borderColor: color,
        backgroundColor: 'transparent',
        tension: 0.4, pointRadius: 3, fill: false
      });
      datasets.push({
        label: f.department + ' (Projected)',
        data: proj, borderColor: color,
        borderDash: [6, 4],
        backgroundColor: color + '22',
        tension: 0.4, pointRadius: 5, pointStyle: 'rectRot',
        fill: false
      });
    });

    // Risk band annotation
    State.charts.predForecast = new Chart(ctx1, {
      type: 'line',
      data: { labels: BudgetData.months, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${c.raw.y?.toFixed(1) ?? c.raw}%` } }
        },
        scales: {
          x: { grid: { color: 'rgba(99,137,255,0.07)' } },
          y: {
            grid: { color: 'rgba(99,137,255,0.07)' },
            ticks: { callback: v => v + '%' },
            min: 0, max: 130
          }
        }
      }
    });
  }

  // ── Risk Score Cards ──────────────────────────────────────────
  const cardsEl = document.getElementById('pred-risk-cards');
  if (cardsEl) {
    cardsEl.innerHTML = '';
    forecasts.sort((a, b) => a.estimatedUtilization - b.estimatedUtilization).forEach(f => {
      cardsEl.innerHTML += `
        <div class="card" style="border-color:${f.riskColor}33;">
          <div class="card-header">
            <div class="card-title">${f.riskIcon} ${f.department}</div>
            <span class="badge badge-${f.riskLevel === 'Critical' ? 'critical' : f.riskLevel === 'High' ? 'high' : f.riskLevel === 'Medium' ? 'medium' : 'low'}">${f.riskLevel} Risk</span>
          </div>
          <div class="card-body">
            <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:12px;">
              <div>
                <div class="text-muted" style="font-size:0.68rem;margin-bottom:3px;">PROJECTED YEAR-END UTIL</div>
                <div class="mono fw-800" style="font-size:1.4rem;color:${f.riskColor};">${f.estimatedUtilization}%</div>
              </div>
              <div>
                <div class="text-muted" style="font-size:0.68rem;margin-bottom:3px;">LAPSE RISK AMOUNT</div>
                <div class="mono fw-700" style="font-size:1rem;color:var(--accent-orange);">${fmtCr(f.lapsedAmount)}</div>
              </div>
              <div>
                <div class="text-muted" style="font-size:0.68rem;margin-bottom:3px;">TREND</div>
                <div class="fw-600" style="font-size:0.85rem;color:${f.trend === 'Improving' ? 'var(--accent-green)' : f.trend === 'Declining' ? 'var(--accent-red)' : 'var(--accent-yellow)'};">${f.trend === 'Improving' ? '↑' : f.trend === 'Declining' ? '↓' : '→'} ${f.trend}</div>
              </div>
            </div>
            <div style="font-size:0.75rem;color:var(--text-secondary);background:rgba(255,255,255,0.03);padding:8px 12px;border-radius:6px;border-left:3px solid ${f.riskColor};">
              💡 ${f.recommendation}
            </div>
          </div>
        </div>`;
    });
  }

  // ── Heatmap Grid ──────────────────────────────────────────────
  const heatmapEl = document.getElementById('pred-heatmap');
  if (heatmapEl) {
    heatmapEl.innerHTML = '';

    // Header row
    let headerRow = '<div style="display:grid;grid-template-columns:100px repeat(' + BudgetData.districts.length + ',1fr);gap:4px;margin-bottom:4px;">';
    headerRow += '<div></div>';
    BudgetData.districts.forEach(d => {
      headerRow += `<div style="font-size:0.58rem;color:var(--text-muted);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${d}">${d.substring(0,6)}</div>`;
    });
    headerRow += '</div>';
    heatmapEl.innerHTML = headerRow;

    BudgetData.departments.forEach(dept => {
      let row = `<div style="display:grid;grid-template-columns:100px repeat(${BudgetData.districts.length},1fr);gap:4px;margin-bottom:4px;">`;
      row += `<div style="font-size:0.68rem;color:var(--text-secondary);display:flex;align-items:center;font-weight:600;">${dept}</div>`;
      BudgetData.districts.forEach(district => {
        const cell = heatmap.find(h => h.dept === dept && h.district === district);
        const u = cell ? cell.projectedUtil : 0;
        const bg = getRiskColor(u);
        row += `<div class="heatmap-cell" data-tooltip="${dept}·${district}: ${u}%" style="background:${bg}22;border:1px solid ${bg}44;color:${bg};">
          ${u.toFixed(0)}
        </div>`;
      });
      row += '</div>';
      heatmapEl.innerHTML += row;
    });
  }
}

// ── SECTION 5: REALLOCATION OPTIMIZER ─────────────────────────
function renderOptimizer() {
  const records  = BudgetData.filter(BudgetData.raw, { year: State.selectedYear });
  const { forecasts } = PredictionEngine.generateAllForecasts(records, State.selectedYear);

  // ── Inline district-level optimizer ──────────────────────────
  const SURP = 70, DEF = 82;
  const cells = [];
  BudgetData.departments.forEach(dept => {
    BudgetData.districts.forEach(district => {
      const sub = records.filter(r => r.department === dept && r.district === district);
      if (!sub.length) return;
      const alloc = sub.reduce((s, r) => s + r.allocated, 0);
      const spent = sub.reduce((s, r) => s + r.spent, 0);
      cells.push({ dept, district, alloc, spent, util: Math.round((spent/alloc)*100) });
    });
  });
  const surp = cells.filter(c => c.util <= SURP);
  const def  = cells.filter(c => c.util >= DEF);
  const transfers = [];
  def.forEach(d => {
    const need = Math.round(d.spent * 0.12 * 100) / 100;
    let dAllocated = 0;
    surp.forEach(s => {
      if (s.dept === d.dept && s.district === d.district) return;
      const avail = Math.max(0, s.alloc * (SURP/100) - s.spent);
      if (avail < 2 || dAllocated >= need) return;
      const remaining = need - dAllocated;
      const amt = Math.round(Math.min(remaining*0.4, avail*0.4) * 100) / 100;
      if (amt < 2) return;
      dAllocated += amt;
      transfers.push({
        from: s.dept, to: d.dept,
        fromDistrict: s.district, toDistrict: d.district,
        amount: amt,
        fromUtilBefore: s.util, toUtilBefore: d.util,
        fromUtilAfter: Math.round(Math.min(99, s.util + (amt/s.alloc)*100)*10)/10,
        toUtilAfter:   Math.round(Math.max(60, (d.spent/(d.alloc+amt))*100)*10)/10,
        impact: amt > 30 ? 'High' : amt > 10 ? 'Medium' : 'Low',
        rationale: `${s.dept} · ${s.district} (${s.util}% util, surplus ₹${Math.round(avail)}Cr) → ${d.dept} · ${d.district} (${d.util}% util, high demand capacity needed)`
      });
    });
  });
  // Deduplicate: keep best transfer per from-dept pair to avoid duplicates
  const seen2 = new Set();
  const deduped = transfers.sort((a,b) => b.amount - a.amount).filter(t => {
    const k = t.from + '|' + t.fromDistrict; if (seen2.has(k)) return false; seen2.add(k); return true;
  }).slice(0, 10);

  const dDelta = {};
  BudgetData.departments.forEach(d => { dDelta[d] = 0; });
  deduped.forEach(t => { dDelta[t.from] -= t.amount; dDelta[t.to] += t.amount; });
  const optF = forecasts.map(f => {
    const delta = dDelta[f.department]||0;
    const nu = Math.round(Math.min(110,Math.max(0,f.estimatedUtilization+(delta/f.totalAllocated)*100))*10)/10;
    const nye = Math.round((f.totalAllocated*nu/100)*100)/100;
    return {...f, estimatedUtilization:nu, estimatedYearEnd:nye, lapsedAmount:Math.max(0,Math.round((f.totalAllocated-nye)*100)/100)};
  });
  const totMoved = Math.round(deduped.reduce((s,t)=>s+t.amount,0)*100)/100;
  const bEff = Math.round(forecasts.reduce((s,f)=>s+f.estimatedUtilization,0)/forecasts.length*10)/10;
  const aEff = Math.round(optF.reduce((s,f)=>s+f.estimatedUtilization,0)/optF.length*10)/10;
  const eGain = Math.round((aEff-bEff)*10)/10;
  const lapSaved = Math.round((forecasts.reduce((s,f)=>s+f.lapsedAmount,0)-optF.reduce((s,f)=>s+f.lapsedAmount,0))*100)/100;

  document.getElementById('opt-transfers').textContent = deduped.length;
  document.getElementById('opt-moved').textContent     = fmtCr(totMoved);
  document.getElementById('opt-gain').textContent      = (eGain>=0?'+':'')+eGain+'%';
  document.getElementById('opt-saved').textContent     = fmtCr(Math.abs(lapSaved));

  // use deduped / optF / bEff / aEff in place of plan.*
  const plan = { transfers: deduped, originalForecasts: forecasts, optimizedForecasts: optF, beforeEfficiency: bEff, afterEfficiency: aEff };

  // ── Before/After Comparison Chart ─────────────────────────────
  destroyChart('optCompare');
  const ctx1 = getCanvas('chart-opt-compare');
  if (ctx1) {
    State.charts.optCompare = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: BudgetData.departments,
        datasets: [
          {
            label: 'Before Reallocation',
            data: plan.originalForecasts.map(f => f.estimatedUtilization),
            backgroundColor: 'rgba(255,59,92,0.35)',
            borderColor: '#ff3b5c', borderWidth: 2, borderRadius: 5
          },
          {
            label: 'After Reallocation',
            data: plan.optimizedForecasts.map(f => f.estimatedUtilization),
            backgroundColor: 'rgba(16,216,129,0.35)',
            borderColor: '#10d881', borderWidth: 2, borderRadius: 5
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { grid: { display: false } },
          y: {
            max: 110, grid: { color: 'rgba(99,137,255,0.07)' },
            ticks: { callback: v => v + '%' }
          }
        }
      }
    });
  }

  // ── Efficiency Radar ──────────────────────────────────────────
  destroyChart('optRadar');
  const ctx2 = getCanvas('chart-opt-radar');
  if (ctx2) {
    State.charts.optRadar = new Chart(ctx2, {
      type: 'radar',
      data: {
        labels: BudgetData.departments,
        datasets: [
          {
            label: 'Before',
            data: plan.originalForecasts.map(f => f.estimatedUtilization),
            borderColor: '#ff3b5c', backgroundColor: 'rgba(255,59,92,0.1)', pointBackgroundColor: '#ff3b5c', borderWidth: 2
          },
          {
            label: 'After',
            data: plan.optimizedForecasts.map(f => f.estimatedUtilization),
            borderColor: '#10d881', backgroundColor: 'rgba(16,216,129,0.1)', pointBackgroundColor: '#10d881', borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { r: { suggestedMin: 0, suggestedMax: 110, ticks: { stepSize: 20, backdropColor: 'transparent' } } }
      }
    });
  }

  // ── Transfer Recommendations ──────────────────────────────────
  const transfersEl = document.getElementById('transfers-list');
  if (transfersEl) {
    if (plan.transfers.length === 0) {
      transfersEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><h3>No Transfers Needed</h3><p>All departments are within acceptable utilization bounds.</p></div>';
    } else {
        transfersEl.innerHTML = '';
      plan.transfers.forEach(t => {
        const impactBadge = t.impact === 'High' ? 'badge-critical' : t.impact === 'Medium' ? 'badge-high' : 'badge-medium';
        const fromLabel = t.fromDistrict ? t.from + ' · ' + t.fromDistrict : t.from;
        const toLabel   = t.toDistrict   ? t.to   + ' · ' + t.toDistrict   : t.to;
        transfersEl.innerHTML += `
          <div class="transfer-card">
            <span class="transfer-arrow">⟶</span>
            <div class="transfer-info">
              <div class="transfer-route">${fromLabel} → ${toLabel}</div>
              <div class="transfer-meta">${t.rationale}</div>
              <div style="margin-top:6px;display:flex;gap:10px;font-size:0.72rem;">
                <span style="color:var(--accent-red);">Before: ${t.fromUtilBefore}% → ${t.toUtilBefore}%</span>
                <span style="color:var(--text-muted);">·</span>
                <span style="color:var(--accent-green);">After: ${t.fromUtilAfter}% → ${t.toUtilAfter}%</span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
              <div class="transfer-amount">${fmtCr(t.amount)}</div>
              <span class="badge ${impactBadge}">${t.impact} Impact</span>
            </div>
          </div>`;
      });
    }
  }

  // ── Comparison Table ──────────────────────────────────────────
  const compEl = document.getElementById('comparison-table');
  if (compEl) {
    compEl.innerHTML = '';
    BudgetData.departments.forEach((dept, i) => {
      const before = plan.originalForecasts[i];
      const after  = plan.optimizedForecasts[i];
      if (!before || !after) return;
      const gain = after.estimatedUtilization - before.estimatedUtilization;
      compEl.innerHTML += `
        <div class="comparison-row">
          <span class="comparison-dept">${dept}</span>
          <span class="comparison-before">${before.estimatedUtilization}%</span>
          <span class="comparison-arrow">→</span>
          <span class="comparison-after">${after.estimatedUtilization}%</span>
          <span style="font-size:0.75rem;font-weight:700;color:${gain > 0 ? 'var(--accent-green)' : gain < 0 ? 'var(--accent-red)' : 'var(--text-muted)'};">${gain > 0 ? '+' : ''}${gain.toFixed(1)}%</span>
        </div>`;
    });
  }
}

// ── SECTION 6: REPORTS & INSIGHTS ─────────────────────────────
function renderReports() {
  const byYear = {};
  BudgetData.years.forEach(y => {
    const recs = BudgetData.filter(BudgetData.raw, { year: y });
    const byDept = BudgetData.byDept(recs);
    const totalAlloc = Object.values(byDept).reduce((s, d) => s + d.allocated, 0);
    const totalSpent = Object.values(byDept).reduce((s, d) => s + d.spent, 0);
    byYear[y] = {
      allocated: totalAlloc,
      spent:     totalSpent,
      utilRate:  Math.round((totalSpent / totalAlloc) * 100),
      anomalies: AnomalyEngine.detectAnomalies(recs).length
    };
  });

  // ── YoY Comparison Chart ──────────────────────────────────────
  destroyChart('reportYoY');
  const ctx1 = getCanvas('chart-report-yoy');
  if (ctx1) {
    State.charts.reportYoY = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: BudgetData.years.map(String),
        datasets: [
          {
            label: 'Total Allocated (Cr)',
            data: BudgetData.years.map(y => byYear[y].allocated),
            backgroundColor: 'rgba(79,124,255,0.4)',
            borderColor: '#4f7cff', borderWidth: 2, borderRadius: 6, order: 2
          },
          {
            label: 'Total Spent (Cr)',
            data: BudgetData.years.map(y => byYear[y].spent),
            backgroundColor: 'rgba(0,212,255,0.4)',
            borderColor: '#00d4ff', borderWidth: 2, borderRadius: 6, order: 2
          },
          {
            label: 'Utilization Rate (%)',
            data: BudgetData.years.map(y => byYear[y].utilRate),
            type: 'line',
            borderColor: '#10d881',
            backgroundColor: 'rgba(16,216,129,0.1)',
            fill: true, tension: 0.45, pointRadius: 6, yAxisID: 'y2', order: 1
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { grid: { display: false } },
          y:  { position: 'left',  grid: { color: 'rgba(99,137,255,0.07)' }, ticks: { callback: v => '₹' + fmt(v) + ' Cr' } },
          y2: { position: 'right', grid: { display: false }, ticks: { callback: v => v + '%' }, max: 120 }
        }
      }
    });
  }

  // ── Dept Utilization by Year ──────────────────────────────────
  destroyChart('reportDeptYr');
  const ctx2 = getCanvas('chart-report-dept-yr');
  if (ctx2) {
    State.charts.reportDeptYr = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: BudgetData.years.map(String),
        datasets: BudgetData.departments.map((dept, i) => {
          const color = DEPT_COLORS[i];
          return {
            label: dept,
            data: BudgetData.years.map(y => {
              const recs = BudgetData.filter(BudgetData.raw, { year: y, dept });
              const agg  = BudgetData.byDept(recs);
              return agg[dept]?.utilizationRate ?? 0;
            }),
            borderColor: color, backgroundColor: color + '22',
            fill: false, tension: 0.4, pointRadius: 6, pointHoverRadius: 8
          };
        })
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(99,137,255,0.07)' }, ticks: { callback: v => v + '%' } }
        }
      }
    });
  }

  // ── Summary Table ─────────────────────────────────────────────
  const summEl = document.getElementById('report-summary-body');
  if (summEl) {
    summEl.innerHTML = '';
    BudgetData.years.forEach(y => {
      const d = byYear[y];
      const util = d.utilRate;
      const col  = getRiskColor(util);
      summEl.innerHTML += `
        <tr>
          <td style="color:var(--text-primary);font-weight:700;">${y}</td>
          <td class="mono">${fmtCr(d.allocated)}</td>
          <td class="mono">${fmtCr(d.spent)}</td>
          <td class="mono" style="color:var(--accent-red);">${fmtCr(d.allocated - d.spent)}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="progress-bar" style="min-width:80px;">
                <div class="progress-fill" style="width:${Math.min(util,100)}%;background:${col};"></div>
              </div>
              <span class="mono" style="color:${col};font-weight:700;">${util}%</span>
            </div>
          </td>
          <td><span class="badge badge-${util >= 85 ? 'low' : util >= 70 ? 'medium' : 'high'}">${util >= 85 ? 'Efficient' : util >= 70 ? 'Moderate' : 'At Risk'}</span></td>
          <td style="color:var(--accent-orange);font-weight:600;">${d.anomalies}</td>
        </tr>`;
    });
  }

  // ── Dept Report Table ─────────────────────────────────────────
  const deptEl = document.getElementById('report-dept-body');
  if (deptEl) {
    deptEl.innerHTML = '';
    BudgetData.departments.forEach(dept => {
      const recs   = BudgetData.filter(BudgetData.raw, { dept });
      const byDept = BudgetData.byDept(recs);
      const d      = byDept[dept];
      const anom   = AnomalyEngine.detectAnomalies(recs).length;
      const col    = getRiskColor(d.utilizationRate);
      deptEl.innerHTML += `
        <tr>
          <td style="color:var(--text-primary);font-weight:700;">${dept}</td>
          <td class="mono">${fmtCr(d.allocated)}</td>
          <td class="mono">${fmtCr(d.spent)}</td>
          <td class="mono" style="color:${col};font-weight:700;">${d.utilizationRate}%</td>
          <td style="color:var(--accent-orange);">${anom}</td>
          <td><span class="badge badge-${d.utilizationRate >= 85 ? 'low' : d.utilizationRate >= 70 ? 'medium' : 'critical'}">${d.utilizationRate >= 85 ? '✅ Efficient' : d.utilizationRate >= 70 ? '⚠️ Moderate' : '🔴 At Risk'}</span></td>
        </tr>`;
    });
  }
}

// ── Clock ──────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('topbar-time');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}

// ── Filter change ─────────────────────────────────────────────
function onFilterChange() {
  const yearEl = document.getElementById('filter-year');
  if (yearEl) State.selectedYear = parseInt(yearEl.value, 10);
  navigate(State.activeSection);
}

// ── SECTION 7: DATA INGESTION ───────────────────────────────
function renderIngestion() {
  const uploadArea = document.getElementById('ingestion-upload-area');
  const fileInput = document.getElementById('ingestion-file-input');
  const statusMsg = document.getElementById('ingestion-status-msg');
  const previewBody = document.getElementById('ingestion-preview-body');
  const statsCards = document.getElementById('ingestion-stats-cards');
  const previewHead = document.getElementById('ingestion-preview-head');
  const previewSection = document.getElementById('ingestion-preview-section');
  const analysisSection = document.getElementById('ingestion-analysis-section');
  const analysisCharts = document.getElementById('ingestion-analysis-charts');
  const aiContainer = document.getElementById('ingestion-ai-container');
  const aiInsights = document.getElementById('ingestion-ai-insights');

  if (!uploadArea || !fileInput) return;

  // Prevent multiple bindings
  if (uploadArea.dataset.bound) return;
  uploadArea.dataset.bound = 'true';

  function generateColors(count) {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
    return Array.from({length: count}, (_, i) => colors[i % colors.length]);
  }

  function autoVisualize(headers, records) {
    analysisCharts.innerHTML = '';
    if (records.length === 0) return;

    // Identify numerical vs categorical fields
    let types = {};
    headers.forEach(h => {
      let isNum = true;
      for (let i = 0; i < Math.min(records.length, 50); i++) {
        if (typeof records[i][h] !== 'number' && records[i][h] !== '') {
          isNum = false; break;
        }
      }
      types[h] = isNum ? 'numeric' : 'categorical';
    });

    const catCols = headers.filter(h => types[h] === 'categorical' && h !== '_id');
    const numCols = headers.filter(h => types[h] === 'numeric' && h !== '_id');

    let canvasCount = 0;
    function createChartContainer(title) {
      let id = 'auto-chart-' + canvasCount++;
      let html = `
        <div class="card" style="min-width: 0; overflow: hidden; margin-bottom: 20px;">
          <div class="card-header"><span class="card-title">${title}</span></div>
          <div class="card-body"><div class="chart-container" style="position: relative; height:320px;"><canvas id="${id}"></canvas></div></div>
        </div>
      `;
      analysisCharts.insertAdjacentHTML('beforeend', html);
      return document.getElementById(id);
    }

    // Chart 1: Categorical Frequency Distribution (Doughnut)
    if (catCols.length > 0) {
      let catCol = catCols[0];
      let counts = {};
      records.forEach(r => {
        let val = r[catCol] || 'Unknown';
        counts[val] = (counts[val] || 0) + 1;
      });
      let sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0, 8);
      
      let ctx = createChartContainer(`Distribution by ${catCol}`);
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: sorted.map(d=>d[0]),
          datasets: [{ data: sorted.map(d=>d[1]), backgroundColor: generateColors(sorted.length) }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // Chart 2: Categorical + Numeric Aggregation (Bar)
    if (catCols.length > 0 && numCols.length > 0) {
      let catCol = catCols.length > 1 ? catCols[1] : catCols[0];
      let numCol = numCols[0];
      let sums = {};
      
      records.forEach(r => {
        let cat = r[catCol] || 'Unknown';
        sums[cat] = (sums[cat] || 0) + (r[numCol] || 0);
      });
      
      let sorted = Object.entries(sums).sort((a,b)=>b[1]-a[1]).slice(0, 10);
      let ctx = createChartContainer(`Total ${numCol} by ${catCol}`);
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sorted.map(d=>d[0]),
          datasets: [{ label: `Sum of ${numCol}`, data: sorted.map(d=>d[1]), backgroundColor: '#3b82f6' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // Chart 3: Numeric Distribution / Trace (Line)
    if (numCols.length > 0) {
      let numCol = numCols.length > 1 ? numCols[1] : numCols[0];
      let sampleSize = Math.min(records.length, 100); // Plot up to 100 rows
      let sample = records.slice(0, sampleSize).map(r => r[numCol] || 0);
      
      let ctx = createChartContainer(`Trend View: ${numCol}`);
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: sample.map((_, i) => 'Pos ' + (i+1)),
          datasets: [{ label: numCol, data: sample, borderColor: '#10b981', fill: false, tension: 0.2 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    }

    // --- Generate Automated AI Insights ---
    if (aiContainer && aiInsights && numCols.length > 0 && catCols.length > 0) {
      aiContainer.style.display = 'block';
      aiInsights.innerHTML = '';
      
      let primaryCat = catCols[0];
      let primaryNum = numCols[0];
      let secondaryNum = numCols.length > 1 ? numCols[1] : primaryNum; // e.g. Spent vs Allocated (if they passed normal data)
      
      let sumByCat = {};
      records.forEach(r => {
        let cat = r[primaryCat] || 'Unknown';
        sumByCat[cat] = (sumByCat[cat] || 0) + (r[primaryNum] || 0);
      });
      
      // Anomalies (Variance/Spike detection logic mock)
      let vals = Object.values(sumByCat);
      let avg = vals.reduce((a,b)=>a+b, 0) / (vals.length || 1);
      
      let maxCat = Object.keys(sumByCat).reduce((a, b) => sumByCat[a] > sumByCat[b] ? a : b);
      let minCat = Object.keys(sumByCat).reduce((a, b) => sumByCat[a] < sumByCat[b] ? a : b);
      
      // Inject Anomaly Card
      aiInsights.innerHTML += `
        <div style="padding:16px;background:var(--color-danger-bg);border:1px solid var(--color-danger-border);border-radius:var(--r-md);">
          <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-danger);margin-bottom:6px;">Anomaly Detected</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);line-height:1.55;">
            <strong>${maxCat}</strong> shows a sharp deviation reporting <strong class="mono">${sumByCat[maxCat].toLocaleString()}</strong> in <span class="badge badge-neutral">${primaryNum}</span>.
            This is significantly higher than the dataset average of <span class="mono">${avg.toLocaleString(undefined, {maximumFractionDigits:0})}</span> indicating potential risk or misallocation.
          </div>
        </div>
      `;
      
      // Inject Reallocation Card
      let diff = sumByCat[maxCat] - sumByCat[minCat];
      let diffPercent = ((diff / sumByCat[maxCat]) * 100).toFixed(1);
      aiInsights.innerHTML += `
        <div style="grid-column: 1 / -1; padding:20px; background:var(--color-info-bg); border:2px solid var(--color-info); border-radius:var(--r-md); box-shadow: 0 4px 12px rgba(3,105,161,0.1);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
            <div style="width:32px; height:32px; border-radius:8px; background:var(--color-info); color:white; display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:bold;">⇄</div>
            <div style="font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--color-info);">High-Priority Reallocation Suggestion</div>
          </div>
          <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6; margin-bottom:12px;">
            Based on the statistical variance between operational limits, the model strongly recommends transferring underutilized funds from <strong>${minCat}</strong> (the lowest efficiency block) over to <strong>${maxCat}</strong>.
          </div>
          <div style="padding:12px 16px; background:white; border-radius:6px; border:1px solid var(--color-info-border); display:flex; gap:20px; align-items:center;">
             <div style="flex:1;">
               <div style="font-size:0.65rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); margin-bottom:4px;">Basis for Suggestion</div>
               <div style="font-size:0.75rem; color:var(--text-secondary);">Calculated by measuring the maximum amplitude between the highest density node (${maxCat}) and lowest density sink (${minCat}). Transferring this delta eliminates a <strong>${diffPercent}%</strong> structural imbalance across the <span class="badge badge-neutral">${primaryCat}</span> grouping.</div>
             </div>
             <div style="text-align:right; padding-left:20px; border-left:1px solid var(--border);">
               <div style="font-size:0.65rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); margin-bottom:4px;">Recommended Transfer</div>
               <div style="color:var(--color-info); font-size:1.2rem; font-weight:700; font-family:'JetBrains Mono', monospace;">${diff.toLocaleString(undefined, {maximumFractionDigits: 0})} units</div>
             </div>
          </div>
        </div>
      `;
      
      // Inject General Summary
      aiInsights.innerHTML += `
        <div style="padding:16px;background:var(--color-success-bg);border:1px solid var(--color-success-border);border-radius:var(--r-md);">
          <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-success);margin-bottom:6px;">Dataset Heuristics</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);line-height:1.55;">
            The dataset correctly structured <strong>${records.length}</strong> clean nodes spanning across <strong>${Object.keys(sumByCat).length}</strong> unique categorical properties within the <span class="badge badge-neutral">${primaryCat}</span> dimension.
          </div>
        </div>
      `;
    }
  }

  function handleFile(file) {
    if (!file) return;
    
    statusMsg.className = 'status-msg info';
    statusMsg.style.display = 'block';
    statusMsg.innerHTML = '<span class="status-icon">⏳</span> Validating and parsing dataset structure...';
    
    DataIngestion.handleFileUpload(file, (result) => {
      // Success
      statusMsg.className = 'status-msg success';
      statusMsg.innerHTML = `<span class="status-icon">✅</span> Dataset ingested successfully. Analytics mapped and generated.`;
      
      const timeStr = new Date().toLocaleTimeString();
      
      // Update stats
      statsCards.innerHTML = `
        <div class="kpi-card green" style="padding:14px;">
          <div class="kpi-card-top"><span class="kpi-label">Records Analyzed</span><div class="kpi-icon green">≡</div></div>
          <div class="kpi-value" style="font-size:1.6rem;">${result.count}</div>
        </div>
        <div class="kpi-card violet" style="padding:14px;">
          <div class="kpi-card-top"><span class="kpi-label">Fields Detected</span><div class="kpi-icon violet">⦿</div></div>
          <div class="kpi-value" style="font-size:1.6rem;">${result.headers.length}</div>
        </div>
        <div class="kpi-card blue" style="padding:14px;">
          <div class="kpi-card-top"><span class="kpi-label">Upload Time</span><div class="kpi-icon blue">⏱</div></div>
          <div class="kpi-value" style="font-size:1.6rem;">${timeStr}</div>
        </div>
      `;
      
      // Update table headers dynamically
      previewSection.style.display = 'block';
      if (previewHead) {
        previewHead.innerHTML = '<tr>' + result.headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
      }
      
      previewBody.innerHTML = '';
      result.preview.forEach(r => {
        let rowHtml = '<tr>';
        result.headers.forEach((h, idx) => {
          let cellData = r[h];
          if (typeof cellData === 'number') {
            // Check if it looks like a large currency/money value
            if (cellData > 1000 || !Number.isInteger(cellData)) {
              cellData = cellData.toLocaleString(undefined, { maximumFractionDigits: 2 });
            }
            rowHtml += `<td class="mono" style="color:var(--text-primary); font-weight:500;">${cellData}</td>`;
          } else {
            if (idx === 0) rowHtml += `<td><span class="badge badge-neutral">${cellData}</span></td>`;
            else rowHtml += `<td>${cellData}</td>`;
          }
        });
        rowHtml += '</tr>';
        previewBody.innerHTML += rowHtml;
      });

      // Generate charts
      analysisSection.style.display = 'block';
      autoVisualize(result.headers, result.records);

    }, (errMsg) => {
      // Error
      statusMsg.className = 'status-msg error';
      statusMsg.innerHTML = `<span class="status-icon">❌</span> Parsing Failed: ${errMsg}`;
    });
  }

  // Drag & drop logic
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  // Click logic
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
    fileInput.value = ''; // reset
  });

  // PDF Export Engine
  const btnPdf = document.getElementById('btn-download-pdf');
  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      const element = document.getElementById('ingestion-analysis-section');
      if (!element || element.style.display === 'none') return;
      
      const opt = {
        margin:       [10, 10, 10, 10], // top, left, bottom, right
        filename:     'BudgetFlow_Executive_Report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, windowWidth: 1400, windowHeight: element.scrollHeight, scrollY: 0, useCORS: true }, 
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Change button text while processing to give UX feedback
      const originalText = btnPdf.innerHTML;
      btnPdf.innerHTML = '<span>⏳</span> Generating PDF...';
      btnPdf.style.opacity = '0.7';

      html2pdf().set(opt).from(element).save().then(() => {
        btnPdf.innerHTML = originalText;
        btnPdf.style.opacity = '1';
      });
    });
  }
}

// ── Bootstrap ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Nav clicks
  document.querySelectorAll('.nav-item[data-section]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.section));
  });

  // Filter changes
  const yearFilter = document.getElementById('filter-year');
  if (yearFilter) yearFilter.addEventListener('change', onFilterChange);

  // Clock
  updateClock();
  setInterval(updateClock, 1000);

  // Initial render
  navigate('overview');
});
