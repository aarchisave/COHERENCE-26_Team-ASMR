import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { getReports } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

function fmtCr(n) { return Math.abs(n) >= 1000 ? '₹'+(n/1000).toFixed(2)+'K Cr' : '₹'+n.toFixed(1)+' Cr'; }

const INSIGHTS = [
  { level:'danger', title:'Chronic Underutilization', text:'Hill States and Northeast India consistently show utilization below 60%, indicating systemic capacity constraints. Immediate administrative intervention needed.' },
  { level:'warning', title:'March-End Spending Surge', text:'Multiple ministries show accelerated Q4 spending to avoid fund lapse — a classic indicator of poor fund planning. Quarterly utilization targets should be mandated.' },
  { level:'accent', title:'Reallocation Opportunity', text:'The optimizer identifies significant reallocation potential from low-efficiency regions to high-demand sectors such as Road Transport & Highways.' },
  { level:'success', title:'Top Performing Regions', text:'Coastal Regions and South India consistently achieve 90%+ utilization rates, serving as best-practice models for absorption capacity programs.' },
  { level:'neutral', title:'Leakage Risk Patterns', text:'Anomaly detection flags spending in Rural Development (Central India) at 1.9× expected levels — a significant deviation warranting a CAG audit.' },
  { level:'warning', title:'Disbursement Delays', text:'Agriculture & Farmers (Northeast India) and Agriculture & Farmers (Deccan Plateau) show recurring early-quarter disbursement delays suggesting approval bottlenecks.' },
];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getReports().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><p>Compiling multi-year reports…</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load data.</p></div>;

  const { summary, deptSummary, years, departments } = data;

  const yoyData = {
    labels: years.map(y => 'FY '+y),
    datasets: [
      { label: 'Total Allocated', data: summary.map(s => s.totalAllocated), backgroundColor:'rgba(59,130,246,0.25)', borderColor:'#3b82f6', borderWidth:2, borderRadius:4, type:'bar' },
      { label: 'Total Spent',     data: summary.map(s => s.totalSpent), backgroundColor:'rgba(13,148,136,0.25)', borderColor:'#0d9488', borderWidth:2, borderRadius:4, type:'bar' },
      { label: 'Utilization %',   data: summary.map(s => s.utilizationRate), borderColor:'#7c3aed', borderWidth:2, tension:0.4, type:'line', yAxisID:'y2' },
    ]
  };

  const statusBadge = (rate) => {
    if (rate >= 85) return <span className="badge badge-low">Excellent</span>;
    if (rate >= 75) return <span className="badge badge-medium">Good</span>;
    if (rate >= 65) return <span className="badge badge-high">At Risk</span>;
    return <span className="badge badge-critical">Critical</span>;
  };

  return (
    <section className="page-section active" style={{ display:'flex', flexDirection:'column', gap:'20px', padding:'24px' }}>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Reports & Insights</h2>
          <p>Year-over-year performance summaries, department rankings, and actionable governance insights.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Year-over-Year Budget Performance</span><span className="card-subtitle">Allocation, Spending, and Utilization Rate (FY 2022–2024)</span></div>
        <div className="card-body"><div className="chart-container" style={{ height:'300px' }}>
          <Bar data={yoyData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top' } }, scales:{ x:{ grid:{ display:false } }, y:{ ticks:{ callback:v => '₹'+Math.round(v/1000)+'K' } }, y2:{ position:'right', ticks:{ callback:v => v+'%' }, grid:{ display:false } } } }} />
        </div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Annual Summary Report</span></div>
        <div className="card-body" style={{ padding:0 }}>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Fiscal Year</th><th>Total Allocated</th><th>Total Spent</th><th>Unspent Balance</th><th>Utilization Rate</th><th>Status</th><th>Anomalies</th></tr></thead>
              <tbody>
                {summary.map(s => (
                  <tr key={s.year}>
                    <td style={{ fontWeight:600, color:'var(--text-primary)' }}>FY {s.year}</td>
                    <td className="mono">{fmtCr(s.totalAllocated)}</td>
                    <td className="mono">{fmtCr(s.totalSpent)}</td>
                    <td className="mono" style={{ color:'var(--color-danger)' }}>{fmtCr(s.unspentBalance)}</td>
                    <td className="mono">{s.utilizationRate}%</td>
                    <td>{statusBadge(s.utilizationRate)}</td>
                    <td className="mono">{s.anomalies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Department Performance (All Years)</span></div>
        <div className="card-body" style={{ padding:0 }}>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Department</th><th>Total Allocated</th><th>Total Spent</th><th>Avg Utilization</th><th>Anomalies</th><th>Assessment</th></tr></thead>
              <tbody>
                {deptSummary.sort((a,b) => b.avgUtilization - a.avgUtilization).map(d => (
                  <tr key={d.department}>
                    <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{d.department}</td>
                    <td className="mono">{fmtCr(d.totalAllocated)}</td>
                    <td className="mono">{fmtCr(d.totalSpent)}</td>
                    <td className="mono">{d.avgUtilization}%</td>
                    <td className="mono">{d.anomalies}</td>
                    <td>{statusBadge(d.avgUtilization)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Key Governance Insights</span></div>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'12px' }}>
            {INSIGHTS.map(ins => {
              const colorMap = {
                danger: { bg:'var(--color-danger-bg)', border:'var(--color-danger-border)', title:'var(--color-danger)' },
                warning: { bg:'var(--color-warning-bg)', border:'var(--color-warning-border)', title:'var(--color-warning)' },
                accent: { bg:'var(--accent-subtle)', border:'var(--accent-border)', title:'var(--accent)' },
                success: { bg:'var(--color-success-bg)', border:'var(--color-success-border)', title:'var(--color-success)' },
                neutral: { bg:'var(--color-neutral-bg)', border:'var(--color-neutral-border)', title:'var(--color-neutral)' },
              }[ins.level] || {};
              return (
                <div key={ins.title} style={{ padding:'16px', background:colorMap.bg, border:`1px solid ${colorMap.border}`, borderRadius:'var(--r-md)' }}>
                  <div style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:colorMap.title, marginBottom:'6px' }}>{ins.title}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', lineHeight:1.55 }}>{ins.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
