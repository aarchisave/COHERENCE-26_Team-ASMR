import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { getOverview } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function fmtCr(n) { return Math.abs(n) >= 1000 ? '₹'+(n/1000).toFixed(2)+'K Cr' : '₹'+n.toFixed(1)+' Cr'; }
function getRiskColor(u) { if (u < 55) return '#e11d48'; if (u < 70) return '#d97706'; if (u < 85) return '#0891b2'; return '#16a34a'; }

export default function FlowTracker({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getOverview(year).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="empty-state"><p>Loading…</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load data.</p></div>;

  const { byDept, byDistrict, departments, districts } = data;

  const sortedDist = [...districts].sort((a,b) => (byDistrict[b]?.utilizationRate||0) - (byDistrict[a]?.utilizationRate||0));

  const distBarData = {
    labels: sortedDist,
    datasets: [{ label: 'Utilization Rate (%)', data: sortedDist.map(d => byDistrict[d]?.utilizationRate||0), backgroundColor: sortedDist.map(d => getRiskColor(byDistrict[d]?.utilizationRate||0)+'aa'), borderColor: sortedDist.map(d => getRiskColor(byDistrict[d]?.utilizationRate||0)), borderWidth: 2, borderRadius: 6 }]
  };

  const stackData = {
    labels: departments,
    datasets: [
      { label: 'Spent', data: departments.map(d => byDept[d]?.spent||0), backgroundColor: 'rgba(0,212,255,0.5)', borderColor: '#00d4ff', borderWidth: 1, borderRadius: 0 },
      { label: 'Balance (Unspent)', data: departments.map(d => byDept[d]?.balance||0), backgroundColor: 'rgba(255,59,92,0.3)', borderColor: '#ff3b5c', borderWidth: 1 },
    ]
  };

  const rows = [];
  departments.forEach(dept => {
    districts.forEach(district => {
      const deptUtil = byDept[dept]?.utilizationRate || 0;
      const distUtil = byDistrict[district]?.utilizationRate || 0;
      const alloc = (byDept[dept]?.allocated || 0) / districts.length;
      const util = Math.round((deptUtil + distUtil) / 2);
      rows.push({ dept, district, alloc: Math.round(alloc*10)/10, spent: Math.round(alloc*util/100*10)/10, balance: Math.round(alloc*(100-util)/100*10)/10, util });
    });
  });
  rows.sort((a,b) => a.util - b.util);

  return (
    <section className="page-section active" style={{ display:'flex', flexDirection:'column', gap:'20px', padding:'24px' }}>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Budget Flow Tracker</h2>
          <p>Drill down into fund allocation, release, and expenditure across all administrative levels.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Utilization by District</span><span className="card-subtitle">Sorted highest → lowest</span></div>
          <div className="card-body"><div className="chart-container" style={{ height:'320px' }}>
            <Bar data={distBarData} options={{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: c => ` ${c.raw}% utilization` } } }, scales:{ x:{ max:120, ticks:{ callback: v => v+'%' } }, y:{ grid:{ display:false } } } }} />
          </div></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Spent vs Unspent by Department</span></div>
          <div className="card-body"><div className="chart-container" style={{ height:'320px' }}>
            <Bar data={stackData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top' } }, scales:{ x:{ stacked:true, grid:{ display:false } }, y:{ stacked:true, ticks:{ callback: v => '₹'+Math.round(v/1000)+'K' } } } }} />
          </div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Department × District Drilldown</span><span className="card-subtitle">20 lowest utilization entries</span></div>
        <div className="card-body" style={{ padding:0 }}>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Department</th><th>District</th><th>Allocated (Cr)</th><th>Spent (Cr)</th><th>Balance (Cr)</th><th>Utilization</th></tr></thead>
              <tbody>
                {rows.slice(0,20).map((r,i) => {
                  const col = getRiskColor(r.util);
                  return (
                    <tr key={i}>
                      <td><span className="badge badge-neutral">{r.dept}</span></td>
                      <td style={{ color:'var(--text-primary)', fontWeight:600 }}>{r.district}</td>
                      <td className="mono">{fmtCr(r.alloc)}</td>
                      <td className="mono">{fmtCr(r.spent)}</td>
                      <td className="mono" style={{ color:'var(--color-danger)' }}>{fmtCr(r.balance)}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <div className="progress-bar" style={{ minWidth:'80px' }}><div className="progress-fill" style={{ width:Math.min(r.util,100)+'%', background:col }}></div></div>
                          <span className="mono" style={{ color:col, fontWeight:600, fontSize:'0.75rem' }}>{r.util}%</span>
                        </div>
                      </td>
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
