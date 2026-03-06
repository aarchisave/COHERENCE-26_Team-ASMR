import React, { useState, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { uploadFile } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Ingestion() {
  const [status, setStatus] = useState(null); // { type: 'info'|'success'|'error', msg }
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  async function handleFile(file) {
    if (!file) return;
    setStatus({ type: 'info', msg: `Processing "${file.name}"…` });
    setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await uploadFile(fd);
      setResult(res.data);
      setStatus({ type: 'success', msg: `✅ Successfully ingested "${res.data.filename}" — ${res.data.totalRows.toLocaleString()} rows detected.` });
    } catch(e) {
      setStatus({ type: 'error', msg: `❌ ${e.response?.data?.error || 'Upload failed'}` });
    }
  }

  function onDrop(e) { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }
  function onDragOver(e) { e.preventDefault(); setDragging(true); }
  function onDragLeave() { setDragging(false); }

  return (
    <section className="page-section active" style={{ display:'flex', flexDirection:'column', gap:'20px', padding:'24px' }}>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Data Ingestion</h2>
          <p>Upload new financial datasets to securely ingest data and dynamically update budget analytics.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Upload Financial Dataset</span><span className="card-subtitle">Supported formats: CSV, XLSX (Max 5MB)</span></div>
        <div className="card-body">
          <div
            id="ingestion-upload-area"
            className={`upload-drop-area${dragging ? ' drag-over' : ''}`}
            style={{ border:'2px dashed var(--border)', borderRadius:'8px', padding:'40px 20px', textAlign:'center', cursor:'pointer', transition:'all 0.2s ease', background:'var(--bg-alt, var(--bg-subtle))' }}
            onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{ fontSize:'2.5rem', color:'var(--text-muted)', marginBottom:'12px' }}>📁</div>
            <div style={{ fontSize:'1.1rem', fontWeight:600, color:'var(--text-primary)', marginBottom:'4px' }}>Drag and drop file here</div>
            <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'16px' }}>Or click to browse from your computer</p>
            <input type="file" ref={fileRef} id="ingestion-file-input" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
            <button className="btn" style={{ padding:'8px 16px', fontWeight:600, borderRadius:'4px', background:'var(--accent)', color:'white', border:'none', cursor:'pointer' }} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>Upload File</button>
          </div>

          {status && (
            <div style={{ marginTop:'16px', padding:'12px 16px', borderRadius:'6px', fontSize:'0.9rem', background: status.type === 'success' ? 'var(--color-success-bg)' : status.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-info-bg)', color: status.type === 'success' ? 'var(--color-success)' : status.type === 'error' ? 'var(--color-danger)' : 'var(--color-info)', border: `1px solid ${status.type === 'success' ? 'var(--color-success-border)' : status.type === 'error' ? 'var(--color-danger-border)' : 'var(--color-info-border)'}` }}>
              {status.msg}
            </div>
          )}
        </div>
      </div>

      {result && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'14px' }}>
            {[
              { label:'Total Rows', value: result.totalRows.toLocaleString(), color:'blue', icon:'≡' },
              { label:'Columns Detected', value: result.headers.length, color:'green', icon:'≣' },
              { label:'Numeric Columns', value: result.numericCols.length, color:'violet', icon:'#' },
            ].map(card => (
              <div key={card.label} className={`kpi-card ${card.color}`}>
                <div className="kpi-card-top"><span className="kpi-label">{card.label}</span><div className={`kpi-icon ${card.color}`}>{card.icon}</div></div>
                <div className="kpi-value">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Data Preview</span><span className="card-subtitle">Showing first 5 rows</span></div>
            <div className="card-body" style={{ padding:0 }}>
              <div className="data-table-wrap" style={{ overflowX:'auto' }}>
                <table className="data-table" style={{ minWidth:'max-content', whiteSpace:'nowrap' }}>
                  <thead><tr>{result.headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>{result.preview.map((row, i) => <tr key={i}>{result.headers.map(h => <td key={h}>{row[h]}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>
          </div>

          {result.colStats.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Auto-Generated Column Analysis</span><span className="card-subtitle">Summary statistics for numeric columns</span></div>
              <div className="card-body">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'16px' }}>
                  {result.colStats.map(stat => {
                    const chartData = { labels: ['Min', 'Avg', 'Max'], datasets: [{ data: [stat.min, stat.avg, stat.max], backgroundColor: ['rgba(59,130,246,0.6)','rgba(13,148,136,0.6)','rgba(124,58,237,0.6)'], borderColor: ['#3b82f6','#0d9488','#7c3aed'], borderWidth: 1.5, borderRadius: 4 }] };
                    return (
                      <div key={stat.col} className="card" style={{ boxShadow:'none', border:'1px solid var(--border)' }}>
                        <div className="card-header" style={{ padding:'10px 14px' }}><span className="card-title" style={{ fontSize:'0.78rem' }}>{stat.col}</span><span className="card-subtitle">Sum: {stat.sum.toLocaleString()}</span></div>
                        <div className="card-body" style={{ padding:'12px' }}>
                          <div className="chart-container" style={{ height:'120px' }}><Bar data={chartData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ ticks:{ callback: v => v.toLocaleString() } } } }} /></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
