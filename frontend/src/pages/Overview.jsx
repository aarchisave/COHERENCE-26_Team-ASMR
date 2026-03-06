import React, { useState, useEffect, useRef } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { getOverview } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

const DEPT_COLORS = ['#3b82f6','#0d9488','#7c3aed','#d97706','#e11d48'];
function fmtCr(n) { if (!n && n !== 0) return '—'; return Math.abs(n) >= 1000 ? '₹'+(n/1000).toFixed(2)+'K Cr' : '₹'+n.toFixed(1)+' Cr'; }
function getRiskColor(u) { if (u < 55) return '#e11d48'; if (u < 70) return '#d97706'; if (u < 85) return '#0891b2'; return '#16a34a'; }
function getBadgeClass(s) { return { Critical:'badge-critical', High:'badge-high', Medium:'badge-medium', Low:'badge-low' }[s] || 'badge-blue'; }

export default function Overview({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getOverview(year).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="empty-state"><p>Loading overview data…</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load data.</p></div>;

  const { kpi, byDept, byDistrict, byMonth, departments, districts, months, anomSummary, recentAnomalies } = data;

  const barData = {
    labels: departments,
    datasets: [
      { label: 'Allocated', data: departments.map(d => byDept[d]?.allocated || 0), backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6', borderWidth: 1.5, borderRadius: 4 },
      { label: 'Spent',     data: departments.map(d => byDept[d]?.spent || 0),     backgroundColor: 'rgba(13,148,136,0.15)', borderColor: '#0d9488', borderWidth: 1.5, borderRadius: 4 },
    ]
  };

  const donutData = {
    labels: departments,
    datasets: [{ data: departments.map(d => byDept[d]?.spent || 0), backgroundColor: DEPT_COLORS.map(c => c+'aa'), borderColor: DEPT_COLORS, borderWidth: 2, hoverOffset: 8 }]
  };

  const trendData = {
    labels: months,
    datasets: [
      { label: 'Allocated', data: byMonth.map(m => m.allocated), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.06)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
      { label: 'Released',  data: byMonth.map(m => m.released),  borderColor: '#94a3b8', backgroundColor: 'transparent', fill: false, tension: 0.4, borderDash: [4,3], pointRadius: 2, borderWidth: 1.5 },
      { label: 'Spent',     data: byMonth.map(m => m.spent),     borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.06)', fill: true, tension: 0.45, pointRadius: 4, pointBackgroundColor: '#00d4ff' },
    ]
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } };

  return (
    <section className="page-section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Executive Overview</h2>
          <p>High-level summary of public fund allocation, utilization, and anomalies across all departments and districts.</p>
        </div>
      </div>

      <div className="kpi-grid">
        {[
          { label: 'Total Budget Allocated', value: fmtCr(kpi.totalAllocated), icon: '₹', color: 'blue', sub: 'Annual budget across all departments', trend: 'up', trendLabel: '↑ 8% YoY growth' },
          { label: 'Total Funds Spent',       value: fmtCr(kpi.totalSpent),    icon: '↓', color: 'green', sub: 'Actual expenditure reported', trend: 'up', trendLabel: '↑ Improving' },
          { label: 'Utilization Rate',        value: kpi.utilizationRate + '%', icon: '%', color: 'violet', sub: 'Spend as % of allocation', trend: 'warn', trendLabel: 'Target: >85%' },
          { label: 'Anomalies Detected',      value: anomSummary.total,        icon: '!', color: 'warning', sub: 'Statistical outliers flagged', trend: 'down', trendLabel: `${anomSummary.criticalCount} Critical` },
          { label: 'Unspent Balance',         value: fmtCr(kpi.totalBalance),  icon: '▲', color: 'danger', sub: 'Funds at risk of lapsing', trend: 'down', trendLabel: 'Needs intervention' },
        ].map(card => (
          <div key={card.label} className={`kpi-card ${card.color}`}>
            <div className="kpi-card-top">
              <span className="kpi-label">{card.label}</span>
              <div className={`kpi-icon ${card.color}`}>{card.icon}</div>
            </div>
            <div className="kpi-value">{card.value}</div>
            <div className="kpi-sub">{card.sub}</div>
            <div className={`kpi-trend ${card.trend}`}>{card.trendLabel}</div>
          </div>
        ))}
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-header"><span className="card-title">Allocation vs Expenditure by Department</span><span className="card-subtitle">FY {year}</span></div>
          <div className="card-body"><div className="chart-container" style={{ height: '280px' }}><Bar data={barData} options={{ ...chartOptions, scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => '₹'+Math.round(v/1000)+'K' } } } }} /></div></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Spending Distribution</span></div>
          <div className="card-body"><div className="chart-container" style={{ height: '280px' }}><Doughnut data={donutData} options={{ ...chartOptions, cutout: '70%', plugins: { legend: { position: 'bottom' } } }} /></div></div>
        </div>
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-header"><span className="card-title">Monthly Fund Flow Trend</span><span className="card-subtitle">Allocated vs Released vs Spent</span></div>
          <div className="card-body"><div className="chart-container" style={{ height: '260px' }}><Line data={trendData} options={{ ...chartOptions, scales: { x: { grid: { color: 'rgba(99,137,255,0.07)' } }, y: { ticks: { callback: v => '₹'+Math.round(v/1000)+'K' } } } }} /></div></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">District Utilization</span></div>
          <div className="card-body" style={{ maxHeight: '310px', overflowY: 'auto' }}>
            {districts.slice().sort((a,b) => (byDistrict[b]?.utilizationRate||0) - (byDistrict[a]?.utilizationRate||0)).map(d => {
              const u = byDistrict[d]?.utilizationRate || 0;
              const col = getRiskColor(u);
              return (
                <div key={d} style={{ marginBottom: '10px' }}>
                  <div className="flex-between mb-4">
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{d}</span>
                    <span className="mono" style={{ fontSize: '0.75rem', color: col, fontWeight: 700 }}>{u}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: Math.min(u,100)+'%', background: col }}></div></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Recent Anomaly Alerts</span><span className="card-subtitle">Top flagged entries by severity</span></div>
        <div className="card-body">
          <div className="alert-feed">
            {recentAnomalies.map((a, i) => (
              <div key={i} className={`alert-item ${a.severity.level.toLowerCase()}`}>
                <span className="alert-icon">{a.severity.icon}</span>
                <div className="alert-content">
                  <div className="alert-title">{a.department} · {a.district}</div>
                  <div className="alert-meta">{a.monthName} {a.year} &nbsp;·&nbsp; Utilization: {a.utilizationRate}% &nbsp;·&nbsp; Impact: {fmtCr(a.financialImpact)}</div>
                </div>
                <span className={`alert-badge badge ${getBadgeClass(a.severity.level)}`}>{a.severity.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
