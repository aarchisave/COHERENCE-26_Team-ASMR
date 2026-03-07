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
  
  // Filter state
  const [search, setSearch]     = useState('');
  const [minFilter, setMinFilter] = useState('All');
  const [sevFilter, setSevFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  function fetchData() {
    getAnomalies(year).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }

  useEffect(() => { setLoading(true); fetchData(); }, [year]);
  useEffect(() => { if (updateCount) fetchData(); }, [updateCount]);

  if (loading) return <div className="empty-state"><p>Running anomaly detection engine…</p></div>;
  if (!data) return <div className="empty-state"><p>Failed to load data.</p></div>;

  const { anomalies, summary } = data;

  // Apply Filters
  const filteredAnomalies = anomalies.filter(a => {
    const matchesSearch = a.scheme.toLowerCase().includes(search.toLowerCase());
    const matchesMin    = minFilter === 'All' || a.ministry === minFilter;
    const matchesSev    = sevFilter === 'All' || a.severity.level === sevFilter;
    const matchesType   = typeFilter === 'All' || a.type === typeFilter;
    return matchesSearch && matchesMin && matchesSev && matchesType;
  });

  const ministries = ['All', ...new Set(anomalies.map(a => a.ministry))];

  const scatterData = {
    datasets: Object.keys(TYPE_COLORS).map(type => ({
      label: TYPE_LABELS[type],
      data: filteredAnomalies.filter(a => a.type === type).map(a => ({ x: a.allocated, y: a.spent, r: Math.min(12, Math.abs(a.zScore) * 3), label: a.scheme })),
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
          <p>Statistical outlier detection across {filteredAnomalies.length} / {anomalies.length} flagged government schemes.</p>
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
        <div className="card-header" style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <span className="card-title">Anomaly Log</span>
              <span className="card-subtitle">{filteredAnomalies.length} flagged schemes sorted by Z-score severity</span>
            </div>
          </div>
          
          {/* Filter Bar Integrated into Log */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'12px', alignItems:'flex-end', paddingTop:'12px', borderTop:'1px solid var(--border-color)' }}>
            <div style={{ flex:'1', minWidth:'200px' }}>
              <label style={{ fontSize:'0.6rem', fontWeight:800, color:'var(--text-muted)', display:'block', marginBottom:'4px', textTransform:'uppercase' }}>Search Scheme</label>
              <input 
                type="text" 
                placeholder="Type to search..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-color)', borderRadius:'var(--r-md)', color:'var(--text-primary)', fontSize:'0.8rem' }} 
              />
            </div>
            <div>
              <label style={{ fontSize:'0.6rem', fontWeight:800, color:'var(--text-muted)', display:'block', marginBottom:'4px', textTransform:'uppercase' }}>Ministry</label>
              <select value={minFilter} onChange={e => setMinFilter(e.target.value)} style={{ padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-color)', borderRadius:'var(--r-md)', color:'var(--text-primary)', fontSize:'0.8rem', width:'160px' }}>
                {ministries.map(m => <option key={m} value={m}>{shortName(m)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'0.6rem', fontWeight:800, color:'var(--text-muted)', display:'block', marginBottom:'4px', textTransform:'uppercase' }}>Severity</label>
              <select value={sevFilter} onChange={e => setSevFilter(e.target.value)} style={{ padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-color)', borderRadius:'var(--r-md)', color:'var(--text-primary)', fontSize:'0.8rem', width:'120px' }}>
                <option value="All">All Severity</option>
                <option value="Critical">🔴 Critical</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🔵 Low</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:'0.6rem', fontWeight:800, color:'var(--text-muted)', display:'block', marginBottom:'4px', textTransform:'uppercase' }}>Type</label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding:'8px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-color)', borderRadius:'var(--r-md)', color:'var(--text-primary)', fontSize:'0.8rem', width:'160px' }}>
                <option value="All">All Types</option>
                {Object.keys(TYPE_LABELS).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <button onClick={() => { setSearch(''); setMinFilter('All'); setSevFilter('All'); setTypeFilter('All'); }} style={{ padding:'8px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-color)', borderRadius:'var(--r-md)', fontSize:'0.75rem', cursor:'pointer' }}>Reset</button>
          </div>
        </div>
        <div className="card-body" style={{ padding:0 }}>
          <div className="data-table-wrap" style={{ maxHeight:'400px', overflowY:'auto' }}>
            <table className="data-table">
              <thead><tr><th>Severity</th><th>Ministry</th><th>Scheme</th><th>Type</th><th>Allocated</th><th>Spent</th><th>Utilization</th><th>Z-Score</th><th>Impact</th></tr></thead>
              <tbody>
                {filteredAnomalies.slice(0, 50).map((a, i) => (
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
