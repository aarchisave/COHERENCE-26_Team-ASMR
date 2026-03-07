import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { getReports } from '../services/api';
import { fmtCr, shortName } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getReports().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><p>Compiling reports…</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load data.</p></div>;

  const { summary, deptSummary, years } = data;

  const yoyData = {
    labels: years.map(y => 'FY ' + y),
    datasets: [
      { label: 'Total Allocated', data: summary.map(s => s.totalAllocated), backgroundColor:'rgba(59,130,246,0.25)', borderColor:'#3b82f6', borderWidth:2, borderRadius:4 },
      { label: 'Total Spent',     data: summary.map(s => s.totalSpent), backgroundColor:'rgba(13,148,136,0.25)', borderColor:'#0d9488', borderWidth:2, borderRadius:4 },
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
      <div className="section-header"><div className="section-header-left">
        <h2>Reports & Insights</h2>
        <p>Year-over-year performance and ministry-level rankings from real Union Budget data.</p>
      </div></div>

      <div className="card">
        <div className="card-header"><span className="card-title">Year-over-Year Budget Performance</span></div>
        <div className="card-body"><div className="chart-container" style={{ height:'280px' }}>
          <Bar data={yoyData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top' } }, scales:{ y:{ ticks:{ callback:v => '₹'+Math.round(v).toLocaleString('en-IN') } } } }} />
        </div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Annual Summary</span></div>
        <div className="card-body" style={{ padding:0 }}>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Fiscal Year</th><th>Total Allocated</th><th>Total Spent</th><th>Unspent</th><th>Utilization</th><th>Status</th></tr></thead>
              <tbody>{summary.map(s => (
                <tr key={s.year}>
                  <td style={{ fontWeight:600 }}>FY {s.year}</td>
                  <td className="mono">{fmtCr(s.totalAllocated)}</td>
                  <td className="mono">{fmtCr(s.totalSpent)}</td>
                  <td className="mono" style={{ color:'var(--color-danger)' }}>{fmtCr(s.unspentBalance)}</td>
                  <td className="mono">{s.utilizationRate}%</td>
                  <td>{statusBadge(s.utilizationRate)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Ministry Performance (BE 2025-26)</span></div>
        <div className="card-body" style={{ padding:0 }}>
          <div className="data-table-wrap" style={{ maxHeight:'500px', overflowY:'auto' }}>
            <table className="data-table">
              <thead><tr><th>Ministry</th><th>Allocated</th><th>Spent</th><th>Utilization</th><th>Assessment</th></tr></thead>
              <tbody>{deptSummary.slice(0, 30).map(d => (
                <tr key={d.ministry}>
                  <td style={{ fontWeight:600, fontSize:'0.72rem', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={d.ministry}>{shortName(d.ministry)}</td>
                  <td className="mono">{fmtCr(d.totalAllocated)}</td>
                  <td className="mono">{fmtCr(d.totalSpent)}</td>
                  <td className="mono">{d.avgUtilization}%</td>
                  <td>{statusBadge(d.avgUtilization)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
