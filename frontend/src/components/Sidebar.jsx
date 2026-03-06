import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SECTIONS = [
  { id: 'overview',    icon: '◈', label: 'Executive Overview',    group: 'Dashboards' },
  { id: 'flowtracker', icon: '⇄', label: 'Budget Flow Tracker',   group: 'Dashboards' },
  { id: 'anomaly',     icon: '◎', label: 'Anomaly Detection',     group: 'Intelligence', badge: true },
  { id: 'prediction',  icon: '↗', label: 'Risk Forecasting',      group: 'Intelligence' },
  { id: 'optimizer',   icon: '⊕', label: 'Reallocation Optimizer',group: 'Intelligence' },
  { id: 'reports',     icon: '≡', label: 'Reports & Insights',    group: 'Governance' },
  { id: 'ingestion',   icon: '⇪', label: 'Data Ingestion',        group: 'Governance' },
];

export default function Sidebar({ anomalyCount = 10 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname.replace('/', '') || 'overview';

  const groups = [...new Set(SECTIONS.map(s => s.group))];

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <div className="brand-wordmark">
            <h1>BudgetFlow IQ</h1>
            <p>Public Finance Intelligence</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav" id="sidebar-nav">
        {groups.map((group, gi) => (
          <React.Fragment key={group}>
            <div className="nav-section-label" style={gi > 0 ? { marginTop: '8px' } : {}}>{group}</div>
            {SECTIONS.filter(s => s.group === group).map(s => (
              <a key={s.id} className={`nav-item${active === s.id ? ' active' : ''}`} onClick={() => navigate('/' + s.id)} style={{ cursor: 'pointer' }}>
                <span className="nav-icon">{s.icon}</span>
                {s.label}
                {s.badge && <span className="nav-badge" id="anomaly-nav-count">{anomalyCount}</span>}
              </a>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="data-coverage">
          <div className="data-coverage-label">Data Coverage</div>
          <div className="data-coverage-item">FY 2022 – 2024</div>
          <div className="data-coverage-item">5 Ministries · 10 Regions</div>
          <div className="data-coverage-item" style={{ marginTop: '6px' }}>
            <span className="status-indicator"></span>
            <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '0.67rem' }}>System Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
