import React, { useState, useEffect } from 'react';
import { Scatter, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { getAnomalies } from '../services/api';

ChartJS.register(LinearScale, PointElement, ArcElement, Tooltip, Legend);

function fmtCr(n) { return Math.abs(n) >= 1000 ? '₹'+(n/1000).toFixed(2)+'K Cr' : '₹'+n.toFixed(1)+' Cr'; }
function getBadgeClass(s) { return { Critical:'badge-critical', High:'badge-high', Medium:'badge-medium', Low:'badge-low' }[s] || 'badge-blue'; }
const TYPE_COLORS = { SPIKE:'#ff3b5c', UNDERUTILIZATION:'#f7c948', DELAY:'#60a5fa', LEAKAGE_RISK:'#f97316' };
const TYPE_LABELS = { SPIKE:'Expenditure Spike', UNDERUTILIZATION:'Underutilization', DELAY:'Disbursement Delay', LEAKAGE_RISK:'Leakage Risk' };

export default function AnomalyDetection({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAnomalies(year).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="empty-state"><p>Running anomaly detection engine…</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load data.</p></div>;

  const { anomalies, summary } = data;

  const normalPts  = anomalies.filter(a => a.severity.level === 'Low').map(a => ({ x: a.utilizationRate, y: a.spent }));
  const anomPts    = anomalies.filter(a => a.severity.level !== 'Low').map(a => ({ x: a.utilizationRate, y: a.spent, dept: a.department, district: a.district, type: a.type, sev: a.severity.level }));

  const scatterData = {
    datasets: [
      { label: 'Normal', data: normalPts.slice(0,300), backgroundColor: 'rgba(79,124,255,0.3)', pointRadius:3, pointHoverRadius:6 },
      { label: 'Anomaly', data: anomPts, backgroundColor: 'rgba(255,59,92,0.7)', borderColor:'#ff3b5c', borderWidth:1, pointRadius:6, pointHoverRadius:10, pointStyle:'triangle' },
    ]
  };

  const types = ['SPIKE','UNDERUTILIZATION','DELAY','LEAKAGE_RISK'];
  const donutData = {
    labels: types.map(t => TYPE_LABELS[t]),
    datasets: [{ data: types.map(t => summary.byType[t]||0), backgroundColor: types.map(t => TYPE_COLORS[t]+'aa'), borderColor: types.map(t => TYPE_COLORS[t]), borderWidth: 2, hoverOffset: 6 }]
  };

  return (
    <section className="page-section active" style={{ display:'flex', flexDirection:'column', gap:'20px', padding:'24px' }}>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Anomaly Detection</h2>
          <p>Statistical outlier detection using Z-score analysis. Flags expenditure spikes, underutilization patterns, disbursement delays, and leakage risks.</p>
        </div>
      </div>

      <div className="kpi-grid">
        {[
          { label:'Total Anomalies', value:summary.total, icon:'!', color:'warning', sub:'Across all departments & districts' },
          { label:'Critical Severity', value:summary.bySev.Critical, icon:'▲', color:'danger', sub:'Require immediate action' },
          { label:'High Severity', value:summary.bySev.High, icon:'◈', color:'violet', sub:'Need prompt review' },
          { label:'Financial Impact', value:fmtCr(summary.totalImpact), icon:'₹', color:'blue', sub:'Cumulative deviation from expected spend' },
        ].map(card => (
          <div key={card.label} className={`kpi-card ${card.color}`}>
            <div className="kpi-card-top"><span className="kpi-label">{card.label}</span><div className={`kpi-icon ${card.color}`}>{card.icon}</div></div>
            <div className="kpi-value">{card.value}</div>
            <div className="kpi-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-header"><span className="card-title">Expected vs Actual Spending</span><span className="card-subtitle">Triangles = detected anomalies</span></div>
          <div className="card-body"><div className="chart-container" style={{ height:'300px' }}>
            <Scatter data={scatterData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top' }, tooltip:{ callbacks:{ label: ctx => { const d=ctx.raw; if(d.dept) return [`${d.dept}·${d.district}`,`Util:${d.x}%, Spent:${fmtCr(d.y)}`,`Type:${d.type}|Sev:${d.sev}`]; return `Util:${d.x}%, Spent:${fmtCr(d.y)}`; } } } }, scales:{ x:{ title:{ display:true, text:'Utilization Rate (%)' } }, y:{ title:{ display:true, text:'Spent (Cr ₹)' }, ticks:{ callback: v => '₹'+Math.round(v/1000)+'K' } } } }} />
          </div></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Anomaly Type Distribution</span></div>
          <div className="card-body"><div className="chart-container" style={{ height:'300px' }}>
            <Doughnut data={donutData} options={{ responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{ legend:{ position:'bottom', labels:{ padding:12 } } } }} />
          </div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Anomaly Log</span><span className="card-subtitle">Sorted by severity & financial impact · Top 25</span></div>
        <div className="card-body" style={{ padding:0 }}>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Department</th><th>District</th><th>Period</th><th>Type</th><th>Actual Util</th><th>Expected Util</th><th>Deviation</th><th>Financial Impact</th><th>Severity</th></tr></thead>
              <tbody>
                {anomalies.slice(0,25).map((a,i) => {
                  const tc = TYPE_COLORS[a.type]||'#94a3b8';
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{a.department}</td>
                      <td>{a.district}</td>
                      <td>{a.monthName} {a.year}</td>
                      <td><span style={{ color:tc, fontWeight:600 }}>{TYPE_LABELS[a.type]||a.type}</span></td>
                      <td className="mono">{a.utilizationRate}%</td>
                      <td className="mono" style={{ color:'var(--text-muted)' }}>{a.expected}%</td>
                      <td className="mono" style={{ color: a.deviation > 0 ? 'var(--color-danger)' : 'var(--color-warning)' }}>{a.deviation > 0 ? '+' : ''}{a.deviation}%</td>
                      <td className="mono">{fmtCr(a.financialImpact)}</td>
                      <td><span className={`badge ${getBadgeClass(a.severity.level)}`}>{a.severity.icon} {a.severity.level}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
