import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLive } from '../context/LiveContext';

const TITLES = {
  '/':            'Executive Dashboard',
  '/overview':    'Executive Dashboard',
  '/flowtracker': 'Budget Flow Tracker',
  '/anomaly':     'Anomaly Detection',
  '/prediction':  'Predictive Risk Modeling',
  '/optimizer':   'Reallocation Optimizer',
  '/reports':     'Reports & Insights',
  '/ingestion':   'Data Ingestion',
};

export default function Topbar({ year, onYearChange, theme, onThemeToggle }) {
  const location = useLocation();
  const { logout } = useAuth();
  const { lastUpdate, updateCount } = useLive();
  const [time, setTime]     = useState(new Date());
  const [pulse, setPulse]   = useState(false);
  const [secAgo, setSecAgo] = useState(null);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date());
      if (lastUpdate) {
        const diff = Math.round((Date.now() - new Date(lastUpdate).getTime()) / 1000);
        setSecAgo(diff);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [lastUpdate]);

  // Blink effect on each new update
  useEffect(() => {
    if (!updateCount) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 1200);
    return () => clearTimeout(t);
  }, [updateCount]);

  const title = TITLES[location.pathname] || 'Executive Dashboard';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title" id="topbar-title">{title}</div>
        <div className="topbar-subtitle">India Union Budget Intelligence Platform</div>
      </div>
      <div className="topbar-controls">
        <label htmlFor="filter-year" style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:500 }}>Fiscal Year</label>
        <select className="filter-select" id="filter-year" value={year} onChange={e => onYearChange(e.target.value)}>
          <option value="2023">FY 2023-24</option>
          <option value="2024">FY 2024-25</option>
          <option value="2025">FY 2025-26 (Live)</option>
        </select>

        <button className="theme-toggle" id="theme-toggle" onClick={onThemeToggle}>
          <span className="theme-toggle-icon">{theme === 'dark' ? '○' : '☾'}</span>
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {/* Live indicator */}
        <div className="live-indicator" style={{ gap:'6px' }}>
          <div className="status-dot" style={{
            background: pulse ? '#00ff88' : '#4ade80',
            boxShadow:  pulse ? '0 0 8px #00ff88, 0 0 16px #00ff8866' : '0 0 4px #4ade8066',
            transition: 'all 0.3s ease',
            width: '8px', height: '8px',
          }}></div>
          <span style={{ fontSize:'0.68rem', fontWeight:700, color: pulse ? '#4ade80' : 'var(--text-muted)', letterSpacing:'0.05em', transition:'color 0.3s' }}>
            LIVE
          </span>
          {secAgo !== null && (
            <span style={{ fontSize:'0.64rem', color:'var(--text-muted)', fontWeight:400 }}>
              · {secAgo < 10 ? 'just now' : `${secAgo}s ago`}
            </span>
          )}
        </div>

        <span className="topbar-time">{time.toLocaleTimeString()}</span>

        <button id="btn-logout" onClick={logout} style={{ background:'transparent', border:'1px solid var(--color-danger)', color:'var(--color-danger)', padding:'5px 12px', borderRadius:'var(--r-md)', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', marginLeft:'8px', fontFamily:"'Inter', sans-serif", transition:'all 0.15s ease' }}>
          Logout
        </button>
      </div>
    </header>
  );
}

