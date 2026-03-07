import React, { useState, useRef } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler } from 'chart.js';
import { uploadFile, generateReport } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

export default function Ingestion() {
  const [status, setStatus] = useState(null); // { type: 'info'|'success'|'error', msg }
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [downloading, setDownloading] = useState(false);
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
    } catch (e) {
      setStatus({ type: 'error', msg: `❌ ${e.response?.data?.error || 'Upload failed'}` });
    }
  }

  function onDrop(e) { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }
  function onDragOver(e) { e.preventDefault(); setDragging(true); }
  function onDragLeave() { setDragging(false); }

  async function handleDownloadPDF() {
    if (!result) return;
    setDownloading(true);
    try {
      const res = await generateReport({ year: 'Custom', data: result.advanced.deptStats });
      const aiText = res.data.report;

      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(59, 130, 246);
      doc.text("BudgetFlow IQ - Intelligence Report", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Source Dataset: ${result.filename}`, 14, 35);

      doc.setDrawColor(200);
      doc.line(14, 40, 196, 40);

      // AI Summary Section
      doc.setFontSize(16);
      doc.setTextColor(30);
      doc.text("Executive Summary & AI Insights", 14, 50);

      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(aiText.replace(/[#*]/g, ''), 180);
      doc.text(splitText, 14, 60);

      let currentY = 60 + (splitText.length * 5) + 10;

      // Data Table
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(16);
      doc.text("Departmental Allocation Breakdown", 14, currentY);
      currentY += 10;

      autoTable(doc, {
        startY: currentY,
        head: [['Department', 'Allocated (Cr)', 'Spent (Cr)', 'Util %']],
        body: result.advanced.deptStats.map(d => [d.name, d.allocated.toLocaleString(), d.spent.toLocaleString(), d.utilization + '%']),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });

      doc.save(`Budget_Intelligence_Report_${result.filename.split('.')[0]}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to generate PDF report. " + (err.response?.data?.error || err.message));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="page-section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
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
            style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease', background: 'var(--bg-alt, var(--bg-subtle))' }}
            onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '12px' }}>📁</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Drag and drop file here</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Or click to browse from your computer</p>
            <input type="file" ref={fileRef} id="ingestion-file-input" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <button className="btn" style={{ padding: '8px 16px', fontWeight: 600, borderRadius: '4px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>Upload File</button>
          </div>

          {status && (
            <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '6px', fontSize: '0.9rem', background: status.type === 'success' ? 'var(--color-success-bg)' : status.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-info-bg)', color: status.type === 'success' ? 'var(--color-success)' : status.type === 'error' ? 'var(--color-danger)' : 'var(--color-info)', border: `1px solid ${status.type === 'success' ? 'var(--color-success-border)' : status.type === 'error' ? 'var(--color-danger-border)' : 'var(--color-info-border)'}` }}>
              {status.msg}
            </div>
          )}
        </div>
      </div>

      {result && (
        <>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '14px' }}>
            {[
              { label: 'Total Rows', value: result.totalRows.toLocaleString(), color: 'blue', icon: '≡' },
              { label: 'Columns Detected', value: result.headers.length, color: 'green', icon: '≣' },
              { label: 'Numeric Columns', value: result.numericCols.length, color: 'violet', icon: '#' },
            ].map(card => (
              <div key={card.label} className={`kpi-card ${card.color}`}>
                <div className="kpi-card-top"><span className="kpi-label">{card.label}</span><div className={`kpi-icon ${card.color}`}>{card.icon}</div></div>
                <div className="kpi-value">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Data Preview</span><span className="card-subtitle">Showing first 5 rows</span></div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="data-table-wrap" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: 'max-content', whiteSpace: 'nowrap' }}>
                  <thead><tr>{result.headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>{result.preview.map((row, i) => <tr key={i}>{result.headers.map(h => <td key={h}>{row[h]}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Advanced Insight Section ── */}
          {result.advanced && (
            <div className="card" style={{ border: '1px solid var(--accent)', background: 'rgba(59,130,246,0.03)' }}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--accent-light)' }}>
                <span className="card-title" style={{ color: 'var(--accent)' }}>✨ Advanced AI Analysis & Data Insights</span>
                <span className="card-subtitle">AI-powered interpretation of your uploaded dataset</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

                  {/* Allocation Pie Chart */}
                  <div className="analytics-box" style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '0.9rem' }}>Departmental Budget Allocation</h4>
                    <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
                      <Pie
                        data={{
                          labels: result.advanced.deptStats.slice(0, 8).map(d => d.name),
                          datasets: [{
                            data: result.advanced.deptStats.slice(0, 8).map(d => d.allocated),
                            backgroundColor: [
                              '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#4b5563'
                            ],
                            borderWidth: 0
                          }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } } } }}
                      />
                    </div>
                  </div>

                  {/* Spending Spike/Anomalies Line Chart */}
                  <div className="analytics-box" style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '0.9rem' }}>Spending Pattern & Anomaly Detection</h4>
                    <div style={{ height: '250px' }}>
                      <Line
                        data={{
                          labels: result.advanced.spikes.map(s => s.label),
                          datasets: [{
                            label: 'Utilization %',
                            data: result.advanced.spikes.map(s => s.value),
                            borderColor: 'var(--accent)',
                            backgroundColor: 'rgba(59,130,246,0.1)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: result.advanced.spikes.map(s => s.isAnomaly ? '#ef4444' : 'var(--accent)'),
                            pointRadius: result.advanced.spikes.map(s => s.isAnomaly ? 6 : 3)
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: { y: { beginAtZero: true, ticks: { callback: v => v + '%' } }, x: { display: false } }
                        }}
                      />
                    </div>
                  </div>

                  {/* AI Prediction & Recommendations */}
                  <div className="analytics-box" style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0 }}>Policy Recommendations & Future Spend Prediction</h4>
                    </div>
                    <div className="ai-insight-content" style={{ fontSize: '0.92rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                      <ReactMarkdown>{result.advanced.aiInsights}</ReactMarkdown>
                    </div>
                    <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn"
                        disabled={downloading}
                        onClick={handleDownloadPDF}
                        style={{ background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                      >
                        {downloading ? ' Generating Report...' : ' Download Detailed PDF Report'}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Removed Auto-Generated Column Analysis */}
        </>
      )}
    </section>
  );
}
