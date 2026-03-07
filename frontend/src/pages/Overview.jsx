import React, { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { getOverview } from '../services/api';
import { useLive } from '../context/LiveContext';
import { fmtCr, shortName } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

const COLORS = ['#3b82f6','#0d9488','#7c3aed','#d97706','#e11d48','#06b6d4','#8b5cf6','#f43f5e','#14b8a6','#f59e0b'];
function getBadgeClass(s) { return { Critical:'badge-critical', High:'badge-high', Medium:'badge-medium', Low:'badge-low' }[s] || 'badge-blue'; }

export default function Overview({ year }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash]     = useState(false);
  const { updateCount, lastTreasuryUpdate } = useLive();
  const [transactions, setTransactions] = useState([]);
  const [lastDelta, setLastDelta] = useState(0);

  function fetchData() {
    getOverview(year).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }

  useEffect(() => { setLoading(true); fetchData(); }, [year]);
  
  useEffect(() => {
    if (!updateCount) return;
    fetchData();
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1500);
    return () => clearTimeout(t);
  }, [updateCount]);

  useEffect(() => {
    if (!lastTreasuryUpdate) return;
    const delta = lastTreasuryUpdate.updates.reduce((s, u) => s + u.amount, 0);
    setLastDelta(delta);
    
    setTransactions(prev => {
      // 1. Combine new updates with existing ones
      const combined = [...lastTreasuryUpdate.updates, ...prev];
      // 2. Filter out duplicates by transactionId
      const unique = combined.filter((tx, idx, self) => 
        idx === self.findIndex(t => t.transactionId === tx.transactionId)
      );
      // 3. Keep only the latest 5
      return unique.slice(0, 5);
    });
    
    const t = setTimeout(() => setLastDelta(0), 4000);
    return () => clearTimeout(t);
  }, [lastTreasuryUpdate]);

  if (loading) return <div className="empty-state"><p>Loading overview data…</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load data.</p></div>;

  const { kpi, byMinistry, topMinistries, yearComparison, anomSummary, recentAnomalies, fyLabel } = data;

  const barData = {
    labels: topMinistries.map(shortName),
    datasets: [
      { label: 'Allocated', data: topMinistries.map(m => Math.round(byMinistry[m]?.allocated || 0)), backgroundColor: 'rgba(59,130,246,0.2)', borderColor: '#3b82f6', borderWidth: 1.5, borderRadius: 4 },
      { label: 'Spent',     data: topMinistries.map(m => Math.round(byMinistry[m]?.spent || 0)),     backgroundColor: 'rgba(13,148,136,0.2)', borderColor: '#0d9488', borderWidth: 1.5, borderRadius: 4 },
    ]
  };

  const donutData = {
    labels: topMinistries.map(shortName),
    datasets: [{ data: topMinistries.map(m => Math.round(byMinistry[m]?.allocated || 0)), backgroundColor: COLORS.map(c => c+'aa'), borderColor: COLORS, borderWidth: 2, hoverOffset: 8 }]
  };

  const yoyData = {
    labels: ['FY 2023-24', 'FY 2024-25 (Prev)', 'FY 2024-25 (Rev)', 'FY 2025-26 (Live)'],
    datasets: [
      { label: 'Budget (₹ Cr)', data: [yearComparison.actuals2122, yearComparison.be2223, yearComparison.re2223, yearComparison.be2324], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#3b82f6', borderWidth: 2 },
    ]
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } };

  return (
    <section className="page-section active" style={{ display:'flex', flexDirection:'column', gap:'20px', padding:'24px' }}>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Executive Overview — {fyLabel}</h2>
          <p>Real Union Budget data across {data.allMinistries?.length || 0} ministries and departments.</p>
        </div>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
            {flash && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 14px', background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:'var(--r-md)', fontSize:'0.72rem', fontWeight:600, color:'#4ade80' }}>
                <span style={{ fontSize:'0.7rem' }}>●</span> Processing Treasury Sync
            </div>
            )}
            <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)', background:'rgba(255,255,255,0.05)', padding:'4px 8px', borderRadius:'4px', border:'1px solid rgba(255,255,255,0.1)' }}>
                SOURCE: PFMS GATEWAY
            </div>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="card" style={{ padding:'12px', background:'rgba(59,130,246,0.03)', border:'1px dashed rgba(59,130,246,0.2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'0.65rem', fontWeight:800, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px' }}>
            <span style={{ display:'inline-block', width:'6px', height:'6px', borderRadius:'50%', background:'#3b82f6', animation:'pulse 1s infinite' }}></span>
            Live Treasury Feed (PFMS Transactions)
          </div>
          <div style={{ display:'flex', gap:'10px', overflow:'hidden' }}>
            {transactions.map(tx => (
              <div key={tx.transactionId} style={{ 
                flex:'0 0 auto', 
                padding:'8px 12px', 
                background:'var(--bg-card)', 
                border:'1px solid var(--border-color)', 
                borderRadius:'6px',
                minWidth:'180px',
                animation:'slideIn 0.3s ease-out'
              }}>
                <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'2px' }}>{shortName(tx.ministry)}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'0.75rem', fontWeight:700 }}>{fmtCr(tx.amount)}</span>
                  <span style={{ fontSize:'0.6rem', color:'#10b981', fontWeight:700 }}>SYNCED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="kpi-grid">
        {[
          { label:'Total Budget Allocated', value: fmtCr(kpi.totalAllocated), icon:'₹', color:'blue', sub: fyLabel + ' — all ministries' },
          { 
            label:'Total Funds Spent',      
            value: (
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                {fmtCr(kpi.totalSpent)}
                {lastDelta > 0 && (
                  <span style={{ fontSize:'0.75rem', color:'#10b981', fontWeight:800, animation:'fadeInUp 0.5s' }}>
                    + {fmtCr(lastDelta, true)}
                  </span>
                )}
              </div>
            ),    
            icon:'↓', color:'green', sub:'Actual expenditure / current spending' 
          },
          { label:'Utilization Rate',       value: kpi.utilizationRate + '%', icon:'%', color:'violet', sub:'Spend as % of allocation' },
          { label:'Anomalies Detected',     value: anomSummary.total,        icon:'!', color:'warning', sub:`${anomSummary.criticalCount} Critical flagged` },
          { label:'Unspent Balance',        value: fmtCr(kpi.totalBalance),  icon:'▲', color:'danger', sub:'Funds at risk of lapsing' },
        ].map(card => (
          <div key={card.label} className={`kpi-card ${card.color}`}>
            <div className="kpi-card-top">
              <span className="kpi-label">{card.label}</span>
              <div className={`kpi-icon ${card.color}`}>{card.icon}</div>
            </div>
            <div className="kpi-value">{card.value}</div>
            <div className="kpi-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-header"><span className="card-title">Top 10 Ministries — Allocation vs Expenditure</span><span className="card-subtitle">{fyLabel}</span></div>
          <div className="card-body"><div className="chart-container" style={{ height:'300px' }}>
            <Bar data={barData} options={{ ...chartOptions, indexAxis: 'y', scales: { x: { ticks: { callback: v => '₹'+v.toLocaleString('en-IN') } } } }} />
          </div></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Budget Distribution</span></div>
          <div className="card-body"><div className="chart-container" style={{ height:'300px' }}>
            <Doughnut data={donutData} options={{ ...chartOptions, cutout:'65%', plugins:{ legend:{ position:'bottom', labels:{ font:{ size:10 } } } } }} />
          </div></div>
        </div>
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-header"><span className="card-title">Year-over-Year Budget Trend</span><span className="card-subtitle">Actuals → BE → RE → BE</span></div>
          <div className="card-body"><div className="chart-container" style={{ height:'260px' }}>
            <Line data={yoyData} options={{ ...chartOptions, scales: { y: { ticks: { callback: v => '₹'+Math.round(v).toLocaleString('en-IN') } } } }} />
          </div></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Ministry Utilization</span></div>
          <div className="card-body" style={{ maxHeight:'310px', overflowY:'auto' }}>
            {topMinistries.map((m, i) => {
              const u = byMinistry[m]?.allocated > 0 ? Math.round((byMinistry[m].spent / byMinistry[m].allocated) * 100) : 0;
              const col = u < 55 ? '#e11d48' : u < 70 ? '#d97706' : u < 85 ? '#0891b2' : '#16a34a';
              return (
                <div key={m} style={{ marginBottom:'10px' }}>
                  <div className="flex-between mb-4">
                    <span style={{ fontSize:'0.72rem', fontWeight:600 }}>{shortName(m)}</span>
                    <span className="mono" style={{ fontSize:'0.72rem', color:col, fontWeight:700 }}>{u}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width:Math.min(u,100)+'%', background:col }}></div></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Recent Anomaly Alerts</span><span className="card-subtitle">Top flagged schemes by severity</span></div>
        <div className="card-body">
          <div className="alert-feed">
            {recentAnomalies.map((a, i) => (
              <div key={i} className={`alert-item ${a.severity.level.toLowerCase()}`}>
                <span className="alert-icon">{a.severity.icon}</span>
                <div className="alert-content">
                  <div className="alert-title">{a.scheme}</div>
                  <div className="alert-meta">{shortName(a.ministry)} &nbsp;·&nbsp; Util: {a.utilizationRate}% &nbsp;·&nbsp; Impact: {fmtCr(a.financialImpact)}</div>
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
