import React, { useState, useEffect } from 'react';
import { Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { getOptimizer } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function fmtCr(n) { if (!n && n!==0) return '—'; return Math.abs(n) >= 1000 ? '₹'+(n/1000).toFixed(2)+'K Cr' : '₹'+n.toFixed(1)+' Cr'; }
const IMPACT_COLORS = { High:'var(--color-danger)', Medium:'var(--color-warning)', Low:'var(--color-success)' };

export default function Optimizer({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getOptimizer(year).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="empty-state"><p>Running reallocation optimizer…</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load data.</p></div>;

  const { transfers, originalForecasts, optimizedForecasts, beforeEfficiency, afterEfficiency, efficiencyGain, totalAmountMoved, totalLapseReduction, departments } = data;

  const compareData = {
    labels: departments,
    datasets: [
      { label: 'Before Reallocation', data: originalForecasts.map(f => f.estimatedUtilization), backgroundColor:'rgba(255,59,92,0.35)', borderColor:'#ff3b5c', borderWidth:2, borderRadius:5 },
      { label: 'After Reallocation',  data: optimizedForecasts.map(f => f.estimatedUtilization), backgroundColor:'rgba(16,216,129,0.35)', borderColor:'#10d881', borderWidth:2, borderRadius:5 },
    ]
  };

  const radarData = {
    labels: departments,
    datasets: [
      { label: 'Before', data: originalForecasts.map(f => f.estimatedUtilization), borderColor:'#ff3b5c', backgroundColor:'rgba(255,59,92,0.1)', pointBackgroundColor:'#ff3b5c', borderWidth:2 },
      { label: 'After',  data: optimizedForecasts.map(f => f.estimatedUtilization), borderColor:'#10d881', backgroundColor:'rgba(16,216,129,0.1)', pointBackgroundColor:'#10d881', borderWidth:2 },
    ]
  };

  return (
    <section className="page-section active" style={{ display:'flex', flexDirection:'column', gap:'20px', padding:'24px' }}>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Reallocation Optimizer</h2>
          <p>Simulates optimal fund transfer strategies from surplus districts to deficit ones, maximizing overall utilization efficiency.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card blue"><div className="kpi-card-top"><span className="kpi-label">Transfer Recommendations</span><div className="kpi-icon blue">⇄</div></div><div className="kpi-value">{transfers.length}</div><div className="kpi-sub">Optimized fund movements</div></div>
        <div className="kpi-card green"><div className="kpi-card-top"><span className="kpi-label">Total Amount to Move</span><div className="kpi-icon green">₹</div></div><div className="kpi-value">{fmtCr(totalAmountMoved)}</div><div className="kpi-sub">Reallocation pool size</div></div>
        <div className="kpi-card violet"><div className="kpi-card-top"><span className="kpi-label">Efficiency Gain</span><div className="kpi-icon violet">↗</div></div><div className="kpi-value">{efficiencyGain >= 0 ? '+':''}{efficiencyGain}%</div><div className="kpi-sub">After-reallocation avg utilization gain</div></div>
        <div className="kpi-card warning"><div className="kpi-card-top"><span className="kpi-label">Lapse Prevention</span><div className="kpi-icon warning">▲</div></div><div className="kpi-value">{fmtCr(Math.abs(totalLapseReduction))}</div><div className="kpi-sub">Funds saved from lapsing</div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Before vs After Reallocation</span><span className="card-subtitle">Utilization rate by department</span></div>
          <div className="card-body"><div className="chart-container" style={{ height:'300px' }}>
            <Bar data={compareData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top' } }, scales:{ x:{ grid:{ display:false } }, y:{ max:110, ticks:{ callback:v => v+'%' } } } }} />
          </div></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Efficiency Radar</span><span className="card-subtitle">All departments before vs after</span></div>
          <div className="card-body"><div className="chart-container" style={{ height:'300px' }}>
            <Radar data={radarData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top' } }, scales:{ r:{ suggestedMin:0, suggestedMax:110, ticks:{ stepSize:20, backdropColor:'transparent' } } } }} />
          </div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Transfer Recommendations</span><span className="card-subtitle">Surplus → deficit district-department pairs</span></div>
        <div className="card-body">
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {transfers.map((t, i) => (
              <div key={i} className="transfer-card">
                <span className="transfer-arrow">⇄</span>
                <div className="transfer-info">
                  <div className="transfer-route">
                    <span style={{ color:'var(--color-success)' }}>{t.from} · {t.fromDistrict}</span>
                    <span style={{ color:'var(--text-muted)', margin:'0 8px' }}>→</span>
                    <span style={{ color:'var(--accent)' }}>{t.to} · {t.toDistrict}</span>
                  </div>
                  <div className="transfer-meta">{t.fromUtilBefore}% → {t.toDistrict} ({t.toUtilBefore}% util, high demand capacity needed)</div>
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

      <div className="card">
        <div className="card-header"><span className="card-title">Department Utilization Comparison</span></div>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:'10px', fontSize:'0.68rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', paddingBottom:'8px', borderBottom:'1px solid var(--border)', marginBottom:'4px' }}>
            <span>Department</span><span style={{ color:'var(--color-danger)' }}>Before</span><span></span><span style={{ color:'var(--color-success)' }}>After</span><span>Change</span>
          </div>
          {departments.map((dept, i) => {
            const before = originalForecasts[i]?.estimatedUtilization || 0;
            const after  = optimizedForecasts[i]?.estimatedUtilization || 0;
            const diff   = Math.round((after - before) * 10) / 10;
            return (
              <div key={dept} className="comparison-row">
                <span className="comparison-dept">{dept}</span>
                <span className="comparison-before">{before}%</span>
                <span className="comparison-arrow">→</span>
                <span className="comparison-after">{after}%</span>
                <span style={{ color: diff >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight:600, fontSize:'0.78rem' }}>{diff >= 0 ? '+' : ''}{diff}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
