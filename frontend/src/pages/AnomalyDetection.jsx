import React, { useState, useEffect } from 'react';
import { Scatter, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { getAnomalies } from '../services/api';
import { useLive } from '../context/LiveContext';

ChartJS.register(LinearScale, PointElement, ArcElement, Tooltip, Legend);

function fmtCr(n) { if (!n && n !== 0) return '—'; return '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN') + ' Cr'; }
function getBadgeClass(s) { return { Critical:'badge-critical', High:'badge-high', Medium:'badge-medium', Low:'badge-low' }[s] || 'badge-blue'; }
const TYPE_COLORS = { SPIKE:'#ff3b5c', UNDERUTILIZATION:'#f7c948', DELAY:'#60a5fa', LEAKAGE_RISK:'#f97316' };
const TYPE_LABELS = { SPIKE:'Expenditure Spike', UNDERUTILIZATION:'Underutilization', DELAY:'Disbursement Delay', LEAKAGE_RISK:'Leakage Risk' };
function shortName(m) { return m.replace(/^(Department of |Ministry of |Department for )/, ''); }

export default function AnomalyDetection({ year }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const { updateCount }     = useLive();

  function fetchData() {
    getAnomalies(year).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }

  useEffect(() => { setLoading(true); fetchData(); }, [year]);
  useEffect(() => { if (updateCount) fetchData(); }, [updateCount]);

  if (loading) return <div className="empty-state"><p>Running anomaly detection engine…</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load data.</p></div>;

  const { anomalies, summary } = data;

  const scatterData = {
    datasets: Object.keys(TYPE_COLORS).map(type => ({
      label: TYPE_LABELS[type],
      data: anomalies.filter(a => a.type === type).map(a => ({ x: a.allocated, y: a.spent, r: Math.min(12, Math.abs(a.zScore) * 3), label: a.scheme })),
      backgroundColor: TYPE_COLORS[type]+'88',
      borderColor: TYPE_COLORS[type],
      pointRadius: 5,
    }))
  };

  const typeDistData = {
    labels: Object.keys(summary.byType).map(t => TYPE_LABELS[t] || t),
    datasets: [{ data: Object.values(summary.byType), backgroundColor: Object.keys(summary.byType).map(t => TYPE_COLORS[t] || '#999'), borderWidth:2, hoverOffset:6 }]
  };

  return (
    <section className="page-section active" style={{ display:'flex', flexDirection:'column', gap:'20px', padding:'24px' }}>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Anomaly Detection — Scheme Level</h2>
          <p>Z-score statistical outlier detection across {anomalies.length} flagged government schemes.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card danger"><div className="kpi-card-top"><span className="kpi-label">Total Anomalies</span><div className="kpi-icon danger">!</div></div><div className="kpi-value">{summary.total}</div><div className="kpi-sub">schemes flagged</div></div>
        <div className="kpi-card warning"><div className="kpi-card-top"><span className="kpi-label">Critical</span><div className="kpi-icon warning">🔴</div></div><div className="kpi-value">{summary.bySev.Critical}</div><div className="kpi-sub">Immediate action needed</div></div>
        <div className="kpi-card blue"><div className="kpi-card-top"><span className="kpi-label">High Severity</span><div className="kpi-icon blue">🟠</div></div><div className="kpi-value">{summary.bySev.High}</div><div className="kpi-sub">Significant deviations</div></div>
        <div className="kpi-card green"><div className="kpi-card-top"><span className="kpi-label">Types Detected</span><div className="kpi-icon green">≡</div></div><div className="kpi-value">{Object.keys(summary.byType).length}</div><div className="kpi-sub">Anomaly classifications</div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Allocated vs Spent — Outlier Map</span><span className="card-subtitle">Bubble size = Z-score severity</span></div>
          <div className="card-body"><div className="chart-container" style={{ height:'300px' }}>
            <Scatter data={scatterData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top' } }, scales: { x:{ title:{ display:true, text:'Allocated (₹ Cr)' } }, y:{ title:{ display:true, text:'Spent (₹ Cr)' } } } }} />
          </div></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Anomaly Type Distribution</span></div>
          <div className="card-body"><div className="chart-container" style={{ height:'300px' }}>
            <Doughnut data={typeDistData} options={{ responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{ legend:{ position:'bottom' } } }} />
          </div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Anomaly Log</span><span className="card-subtitle">All flagged schemes sorted by Z-score severity</span></div>
        <div className="card-body" style={{ padding:0 }}>
          <div className="data-table-wrap" style={{ maxHeight:'400px', overflowY:'auto' }}>
            <table className="data-table">
              <thead><tr><th>Severity</th><th>Ministry</th><th>Scheme</th><th>Type</th><th>Allocated</th><th>Spent</th><th>Utilization</th><th>Z-Score</th><th>Impact</th></tr></thead>
              <tbody>
                {anomalies.slice(0, 30).map((a, i) => (
                  <tr key={i}>
                    <td><span className={`badge ${getBadgeClass(a.severity.level)}`}>{a.severity.icon} {a.severity.level}</span></td>
                    <td style={{ fontSize:'0.72rem', maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={a.ministry}>{shortName(a.ministry)}</td>
                    <td style={{ fontSize:'0.72rem', fontWeight:600, maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={a.scheme}>{a.scheme}</td>
                    <td><span className="badge badge-blue" style={{ fontSize:'0.6rem' }}>{TYPE_LABELS[a.type] || a.type}</span></td>
                    <td className="mono">{fmtCr(a.allocated)}</td>
                    <td className="mono">{fmtCr(a.spent)}</td>
                    <td className="mono" style={{ color: a.utilizationRate > 120 ? 'var(--color-danger)' : a.utilizationRate < 50 ? 'var(--color-warning)' : 'var(--text-primary)' }}>{a.utilizationRate}%</td>
                    <td className="mono">{a.zScore}</td>
                    <td className="mono" style={{ color:'var(--color-danger)' }}>{fmtCr(a.financialImpact)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
