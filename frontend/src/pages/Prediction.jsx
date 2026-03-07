import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { getPredictions } from '../services/api';
import { useLive } from '../context/LiveContext';
import { fmtCr, shortName } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Prediction({ year }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const { updateCount }     = useLive();

  function fetchData() { getPredictions(year).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false)); }
  useEffect(() => { setLoading(true); fetchData(); }, [year]);
  useEffect(() => { if (updateCount) fetchData(); }, [updateCount]);

  if (loading) return <div className="empty-state"><p>Generating forecasts…</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load data.</p></div>;

  const { forecasts, totalAtRisk, totalLapseRisk, totalMinistries, periods } = data;

  const barData = {
    labels: periods,
    datasets: forecasts.slice(0, 8).map((f, i) => ({
      label: shortName(f.ministry),
      data: f.historical.map(h => h.actual),
      backgroundColor: ['#3b82f6','#0d9488','#7c3aed','#d97706','#e11d48','#06b6d4','#8b5cf6','#f43f5e'][i] + '55',
      borderColor: ['#3b82f6','#0d9488','#7c3aed','#d97706','#e11d48','#06b6d4','#8b5cf6','#f43f5e'][i],
      borderWidth: 1.5, borderRadius: 4,
    }))
  };

  return (
    <section className="page-section active" style={{ display:'flex', flexDirection:'column', gap:'20px', padding:'24px' }}>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Predictive Risk Modeling</h2>
          <p>Budget trend analysis and lapse risk identification across {totalMinistries} ministries.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card danger"><div className="kpi-card-top"><span className="kpi-label">Ministries at Risk</span><div className="kpi-icon danger">▲</div></div><div className="kpi-value">{totalAtRisk}</div><div className="kpi-sub">Critical or High lapse risk</div></div>
        <div className="kpi-card warning"><div className="kpi-card-top"><span className="kpi-label">Total Lapse Risk</span><div className="kpi-icon warning">₹</div></div><div className="kpi-value">{fmtCr(totalLapseRisk)}</div><div className="kpi-sub">Estimated unspent funds</div></div>
        <div className="kpi-card green"><div className="kpi-card-top"><span className="kpi-label">Ministries Modeled</span><div className="kpi-icon green">≡</div></div><div className="kpi-value">{totalMinistries}</div><div className="kpi-sub">Trend analysis generated</div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Budget Trend — Top 8 Ministries</span><span className="card-subtitle">Actuals → Budget Estimates → Revised Estimates</span></div>
        <div className="card-body"><div className="chart-container" style={{ height:'320px' }}>
          <Bar data={barData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top', labels:{ font:{ size:10 } } } }, scales:{ y:{ ticks:{ callback:v => '₹'+Math.round(v).toLocaleString('en-IN') } } } }} />
        </div></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'14px' }}>
        {forecasts.slice(0, 12).map(f => {
          const badgeClass = { Critical:'badge-critical', High:'badge-high', Medium:'badge-medium', Low:'badge-low' }[f.riskLevel] || 'badge-blue';
          return (
            <div key={f.ministry} className="card" style={{ borderColor: f.riskColor+'33' }}>
              <div className="card-header">
                <div className="card-title" style={{ fontSize:'0.78rem' }}>{f.riskIcon} {shortName(f.ministry)}</div>
                <span className={`badge ${badgeClass}`}>{f.riskLevel} Risk</span>
              </div>
              <div className="card-body">
                <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'12px' }}>
                  <div><div className="text-muted" style={{ fontSize:'0.64rem', marginBottom:'3px' }}>UTILIZATION</div><div className="mono" style={{ fontSize:'1.2rem', fontWeight:800, color:f.riskColor }}>{f.estimatedUtilization}%</div></div>
                  <div><div className="text-muted" style={{ fontSize:'0.64rem', marginBottom:'3px' }}>UNSPENT</div><div className="mono" style={{ fontSize:'0.9rem', fontWeight:700, color:'var(--color-warning)' }}>{fmtCr(f.lapsedAmount)}</div></div>
                  <div><div className="text-muted" style={{ fontSize:'0.64rem', marginBottom:'3px' }}>TREND</div><div style={{ fontSize:'0.8rem', fontWeight:600, color: f.trend === 'Improving' ? 'var(--color-success)' : f.trend === 'Declining' ? 'var(--color-danger)' : 'var(--color-warning)' }}>{f.trend === 'Improving' ? '↑' : f.trend === 'Declining' ? '↓' : '→'} {f.trend}</div></div>
                </div>
                <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', background:'rgba(255,255,255,0.03)', padding:'8px 10px', borderRadius:'6px', borderLeft:`3px solid ${f.riskColor}` }}>
                  💡 {f.recommendation}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
