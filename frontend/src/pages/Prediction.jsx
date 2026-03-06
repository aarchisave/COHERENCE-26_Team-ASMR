import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { getPredictions } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function fmtCr(n) { return Math.abs(n) >= 1000 ? '₹'+(n/1000).toFixed(2)+'K Cr' : '₹'+n.toFixed(1)+' Cr'; }
const DEPT_COLORS = ['#3b82f6','#0d9488','#7c3aed','#d97706','#e11d48'];
function getRiskColor(u) { if (u < 55) return '#e11d48'; if (u < 70) return '#d97706'; if (u < 85) return '#0891b2'; return '#16a34a'; }

export default function Prediction({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPredictions(year).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="empty-state"><p>Generating forecasts…</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load data.</p></div>;

  const { forecasts, heatmap, totalAtRisk, totalLapseRisk, months, departments, districts } = data;

  const datasets = [];
  forecasts.forEach((f, i) => {
    const color = DEPT_COLORS[i % DEPT_COLORS.length];
    datasets.push({ label: f.department + ' (Historical)', data: f.historical.map(h => ({ x: h.month, y: h.actual })), borderColor: color, backgroundColor:'transparent', tension:0.4, pointRadius:3, fill:false });
    datasets.push({ label: f.department + ' (Projected)', data: f.projections.map(p => ({ x: p.month, y: p.projected })), borderColor: color, borderDash:[6,4], backgroundColor: color+'22', tension:0.4, pointRadius:5, fill:false });
  });

  const forecastChartData = { labels: months, datasets };

  return (
    <section className="page-section active" style={{ display:'flex', flexDirection:'column', gap:'20px', padding:'24px' }}>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Predictive Risk Modeling</h2>
          <p>Linear regression-based forecasting identifies departments at risk of fund lapsing before year-end, with 3-month utilization projections.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card danger"><div className="kpi-card-top"><span className="kpi-label">Departments at Risk</span><div className="kpi-icon danger">▲</div></div><div className="kpi-value">{totalAtRisk}</div><div className="kpi-sub">Critical or High lapse risk this FY</div></div>
        <div className="kpi-card warning"><div className="kpi-card-top"><span className="kpi-label">Total Lapse Risk</span><div className="kpi-icon warning">₹</div></div><div className="kpi-value">{fmtCr(totalLapseRisk)}</div><div className="kpi-sub">Estimated funds at risk of lapse</div></div>
        <div className="kpi-card green"><div className="kpi-card-top"><span className="kpi-label">Depts Modeled</span><div className="kpi-icon green">≡</div></div><div className="kpi-value">{forecasts.length}</div><div className="kpi-sub">Forecast generated for each</div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Utilization Rate Forecasts — All Departments</span><span className="card-subtitle">Solid lines = historical · Dashed = projected 3-month outlook</span></div>
        <div className="card-body">
          <div className="chart-container" style={{ height:'320px' }}>
            <Line data={forecastChartData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: c => ` ${c.dataset.label}: ${c.raw?.y?.toFixed(1) ?? c.raw}%` } } }, scales:{ x:{ grid:{ color:'rgba(99,137,255,0.07)' } }, y:{ ticks:{ callback: v => v+'%' }, min:0, max:130 } } }} />
          </div>
          <div style={{ marginTop:'14px', padding:'10px 14px', background:'var(--color-danger-bg)', border:'1px solid var(--color-danger-border)', borderRadius:'var(--r-md)', fontSize:'0.75rem', color:'var(--text-secondary)' }}>
            <strong style={{ color:'var(--color-danger)' }}>Fund Lapse Risk Zone:</strong> Utilization below <strong>70%</strong> at year-end = high lapse risk. Below <strong>55%</strong> = critical — immediate intervention required.
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'14px' }}>
        {[...forecasts].sort((a,b) => a.estimatedUtilization - b.estimatedUtilization).map(f => {
          const badgeClass = { Critical:'badge-critical', High:'badge-high', Medium:'badge-medium', Low:'badge-low' }[f.riskLevel] || 'badge-blue';
          return (
            <div key={f.department} className="card" style={{ borderColor: f.riskColor+'33' }}>
              <div className="card-header">
                <div className="card-title">{f.riskIcon} {f.department}</div>
                <span className={`badge ${badgeClass}`}>{f.riskLevel} Risk</span>
              </div>
              <div className="card-body">
                <div style={{ display:'flex', gap:'20px', flexWrap:'wrap', marginBottom:'12px' }}>
                  <div><div className="text-muted" style={{ fontSize:'0.68rem', marginBottom:'3px' }}>PROJECTED YEAR-END UTIL</div><div className="mono" style={{ fontSize:'1.4rem', fontWeight:800, color:f.riskColor }}>{f.estimatedUtilization}%</div></div>
                  <div><div className="text-muted" style={{ fontSize:'0.68rem', marginBottom:'3px' }}>LAPSE RISK AMOUNT</div><div className="mono" style={{ fontSize:'1rem', fontWeight:700, color:'var(--color-warning)' }}>{fmtCr(f.lapsedAmount)}</div></div>
                  <div><div className="text-muted" style={{ fontSize:'0.68rem', marginBottom:'3px' }}>TREND</div><div style={{ fontSize:'0.85rem', fontWeight:600, color: f.trend === 'Improving' ? 'var(--color-success)' : f.trend === 'Declining' ? 'var(--color-danger)' : 'var(--color-warning)' }}>{f.trend === 'Improving' ? '↑' : f.trend === 'Declining' ? '↓' : '→'} {f.trend}</div></div>
                </div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', background:'rgba(255,255,255,0.03)', padding:'8px 12px', borderRadius:'6px', borderLeft:`3px solid ${f.riskColor}` }}>
                  💡 {f.recommendation}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Projected Utilization Heatmap — Dept × District</span><span className="card-subtitle">Based on 3-month forward projection</span></div>
        <div className="card-body" style={{ overflowX:'auto' }}>
          <div style={{ minWidth:'700px' }}>
            <div style={{ display:'grid', gridTemplateColumns:`100px repeat(${districts.length},1fr)`, gap:'4px', marginBottom:'4px' }}>
              <div></div>
              {districts.map(d => <div key={d} style={{ fontSize:'0.58rem', color:'var(--text-muted)', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={d}>{d.substring(0,6)}</div>)}
            </div>
            {departments.map(dept => (
              <div key={dept} style={{ display:'grid', gridTemplateColumns:`100px repeat(${districts.length},1fr)`, gap:'4px', marginBottom:'4px' }}>
                <div style={{ fontSize:'0.68rem', color:'var(--text-secondary)', display:'flex', alignItems:'center', fontWeight:600 }}>{dept.split(' ')[0]}</div>
                {districts.map(district => {
                  const cell = heatmap.find(h => h.dept === dept && h.district === district);
                  const u = cell ? cell.projectedUtil : 0;
                  const bg = getRiskColor(u);
                  return <div key={district} className="heatmap-cell" data-tooltip={`${dept}·${district}: ${u}%`} style={{ background:bg+'22', border:`1px solid ${bg}44`, color:bg }}>{u.toFixed(0)}</div>;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
