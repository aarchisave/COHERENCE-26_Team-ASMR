import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
  const { logout, user } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const title = TITLES[location.pathname] || 'Executive Dashboard';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title" id="topbar-title">{title}</div>
        <div className="topbar-subtitle">India Union Budget Intelligence Platform</div>
      </div>
      <div className="topbar-controls">
        <label htmlFor="filter-year" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Fiscal Year</label>
        <select className="filter-select" id="filter-year" value={year} onChange={e => onYearChange(parseInt(e.target.value))}>
          <option value={2022}>FY 2022</option>
          <option value={2023}>FY 2023</option>
          <option value={2024}>FY 2024</option>
        </select>

        <button className="theme-toggle" id="theme-toggle" onClick={onThemeToggle}>
          <span className="theme-toggle-icon">{theme === 'dark' ? '○' : '☾'}</span>
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        <div className="live-indicator">
          <div className="status-dot"></div>
          <span className="topbar-time">{time.toLocaleTimeString()}</span>
        </div>

        <button id="btn-logout" onClick={logout} style={{ background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '5px 12px', borderRadius: 'var(--r-md)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', marginLeft: '8px', fontFamily: "'Inter', sans-serif", transition: 'all 0.15s ease' }}>
          Logout
        </button>
      </div>
    </header>
  );
}
