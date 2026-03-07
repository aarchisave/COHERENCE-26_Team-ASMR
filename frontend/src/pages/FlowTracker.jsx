import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { getOverview } from '../services/api';
import { useLive } from '../context/LiveContext';
import { fmtCr, shortName } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function getRiskColor(u) { if (u < 55) return '#e11d48'; if (u < 70) return '#d97706'; if (u < 85) return '#0891b2'; return '#16a34a'; }

export default function FlowTracker({ year }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const { updateCount }     = useLive();

  function fetchData() { getOverview(year).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false)); }
  useEffect(() => { setLoading(true); fetchData(); }, [year]);
  useEffect(() => { if (updateCount) fetchData(); }, [updateCount]);

  if (loading) return <div className="empty-state"><p>Loading…</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load data.</p></div>;

  const { byMinistry, topMinistries, allMinistries, fyLabel } = data;

  // Revenue vs Capital breakdown for top ministries
  const rvCapData = {
    labels: topMinistries.map(shortName),
    datasets: [
      { label:'Revenue', data:topMinistries.map(m => Math.round(byMinistry[m]?.revenue || 0)), backgroundColor:'rgba(59,130,246,0.4)', borderColor:'#3b82f6', borderWidth:1.5, borderRadius:4 },
      { label:'Capital',  data:topMinistries.map(m => Math.round(byMinistry[m]?.capital || 0)), backgroundColor:'rgba(124,58,237,0.4)', borderColor:'#7c3aed', borderWidth:1.5, borderRadius:4 },
    ]
  };

  // Full ministry utilization table
  const tableData = allMinistries.map(m => {
    const d = byMinistry[m];
    const util = d.allocated > 0 ? Math.round((d.spent / d.allocated) * 100) : 0;
    return { ministry: m, allocated: d.allocated, spent: d.spent, util };
  }).sort((a, b) => b.allocated - a.allocated);

  return (
    <section className="page-section active" style={{ display:'flex', flexDirection:'column', gap:'20px', padding:'24px' }}>
      <div className="section-header"><div className="section-header-left">
        <h2>Budget Flow Tracker — {fyLabel}</h2>
        <p>Revenue vs Capital split & ministry-level utilization analysis.</p>
      </div></div>

      <div className="card">
        <div className="card-header"><span className="card-title">Revenue vs Capital — Top 10 Ministries</span></div>
        <div className="card-body"><div className="chart-container" style={{ height:'320px' }}>
          <Bar data={rvCapData} options={{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{ position:'top' } }, scales:{ x:{ stacked:true, ticks:{ callback:v => '₹'+Math.round(v).toLocaleString('en-IN') } }, y:{ stacked:true } } }} />
        </div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Ministry Utilization Rankings</span></div>
          <div className="card-body" style={{ maxHeight:'500px', overflowY:'auto' }}>
            {tableData.slice(0, 20).map(r => {
              const col = getRiskColor(r.util);
              return (
                <div key={r.ministry} style={{ marginBottom:'10px' }}>
                  <div className="flex-between mb-4">
                    <span style={{ fontSize:'0.72rem', fontWeight:600 }}>{shortName(r.ministry)}</span>
                    <span className="mono" style={{ fontSize:'0.72rem', color:col, fontWeight:700 }}>{r.util}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width:Math.min(r.util,100)+'%', background:col }}></div></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Detailed Breakdown</span></div>
          <div className="card-body" style={{ padding:0 }}>
            <div className="data-table-wrap" style={{ maxHeight:'500px', overflowY:'auto' }}>
              <table className="data-table">
                <thead><tr><th>Ministry</th><th>Allocated</th><th>Spent</th><th>Utilization</th></tr></thead>
                <tbody>{tableData.slice(0, 25).map(r => (
                  <tr key={r.ministry}>
                    <td style={{ fontSize:'0.7rem', maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={r.ministry}>{shortName(r.ministry)}</td>
                    <td className="mono">{fmtCr(r.allocated)}</td>
                    <td className="mono">{fmtCr(r.spent)}</td>
                    <td className="mono" style={{ color:getRiskColor(r.util), fontWeight:700 }}>{r.util}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
