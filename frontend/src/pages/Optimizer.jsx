import React, { useState, useEffect } from 'react';
import { Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { getOptimizer } from '../services/api';
import { useLive } from '../context/LiveContext';
import { fmtCr, shortName } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const IMPACT_COLORS = { High:'var(--color-danger)', Medium:'var(--color-warning)', Low:'var(--color-success)' };

export default function Optimizer({ year }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const { updateCount }     = useLive();

  function fetchData() { getOptimizer(year).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false)); }
  useEffect(() => { setLoading(true); fetchData(); }, [year]);
  useEffect(() => { if (updateCount) fetchData(); }, [updateCount]);

  if (loading) return <div className="empty-state"><p>Running reallocation optimizer…</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load data.</p></div>;

  const { transfers, originalForecasts, optimizedForecasts, beforeEfficiency, afterEfficiency, efficiencyGain, totalAmountMoved, totalLapseReduction, departments } = data;

  const compareData = {
    labels: departments.map(shortName),
    datasets: [
      { label:'Before Reallocation', data:originalForecasts.map(f => f.estimatedUtilization), backgroundColor:'rgba(255,59,92,0.35)', borderColor:'#ff3b5c', borderWidth:2, borderRadius:5 },
      { label:'After Reallocation',  data:optimizedForecasts.map(f => f.estimatedUtilization), backgroundColor:'rgba(16,216,129,0.35)', borderColor:'#10d881', borderWidth:2, borderRadius:5 },
    ]
  };

  return (
    <section className="page-section active" style={{ display:'flex', flexDirection:'column', gap:'20px', padding:'24px' }}>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Reallocation Optimizer</h2>
          <p>Simulates fund transfer strategies from surplus ministries to deficit ones.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card blue"><div className="kpi-card-top"><span className="kpi-label">Transfer Recommendations</span><div className="kpi-icon blue">⇄</div></div><div className="kpi-value">{transfers.length}</div><div className="kpi-sub">Optimized fund movements</div></div>
        <div className="kpi-card green"><div className="kpi-card-top"><span className="kpi-label">Total Amount to Move</span><div className="kpi-icon green">₹</div></div><div className="kpi-value">{fmtCr(totalAmountMoved)}</div><div className="kpi-sub">Reallocation pool</div></div>
        <div className="kpi-card violet"><div className="kpi-card-top"><span className="kpi-label">Efficiency Gain</span><div className="kpi-icon violet">↗</div></div><div className="kpi-value">{efficiencyGain >= 0 ? '+':''}{efficiencyGain}%</div><div className="kpi-sub">Avg utilization improvement</div></div>
        <div className="kpi-card warning"><div className="kpi-card-top"><span className="kpi-label">Lapse Prevention</span><div className="kpi-icon warning">▲</div></div><div className="kpi-value">{fmtCr(Math.abs(totalLapseReduction))}</div><div className="kpi-sub">Funds saved from lapsing</div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Before vs After Reallocation</span><span className="card-subtitle">Utilization rate by ministry (top 10)</span></div>
        <div className="card-body"><div className="chart-container" style={{ height:'300px' }}>
          <Bar data={compareData} options={{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{ position:'top' } }, scales:{ x:{ max:120, ticks:{ callback:v => v+'%' } } } }} />
        </div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Transfer Recommendations</span><span className="card-subtitle">Surplus → deficit ministry pairs</span></div>
        <div className="card-body">
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {transfers.map((t, i) => (
              <div key={i} className="transfer-card">
                <span className="transfer-arrow">⇄</span>
                <div className="transfer-info">
                  <div className="transfer-route">
                    <span style={{ color:'var(--color-success)' }}>{shortName(t.from)}</span>
                    <span style={{ color:'var(--text-muted)', margin:'0 8px' }}>→</span>
                    <span style={{ color:'var(--accent)' }}>{shortName(t.to)}</span>
                  </div>
                  <div className="transfer-meta">{t.fromUtilBefore}% util → {t.toUtilBefore}% util ministry</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
                  <div className="transfer-amount">{fmtCr(t.amount)}</div>
                  <span className="badge" style={{ background:`${IMPACT_COLORS[t.impact]}22`, color:IMPACT_COLORS[t.impact], border:`1px solid ${IMPACT_COLORS[t.impact]}44`, fontSize:'0.6rem' }}>{t.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
