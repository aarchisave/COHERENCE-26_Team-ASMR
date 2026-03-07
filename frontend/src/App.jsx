import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LiveProvider } from './context/LiveContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ChatbotWidget from './components/ChatbotWidget';
import Login from './pages/Login';
import Overview from './pages/Overview';
import FlowTracker from './pages/FlowTracker';
import AnomalyDetection from './pages/AnomalyDetection';
import Prediction from './pages/Prediction';
import Optimizer from './pages/Optimizer';
import Reports from './pages/Reports';
import Ingestion from './pages/Ingestion';
import './styles/main.css';

function ProtectedLayout() {
  const { isAuth } = useAuth();
  const [year, setYear] = useState('2025');
  const [theme, setTheme] = useState(() => localStorage.getItem('bfiq-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bfiq-theme', theme);
  }, [theme]);

  console.log('🛡️ ProtectedLayout: isAuth =', isAuth);
  if (!isAuth) return <Navigate to="/login" replace />;

  return (
    <LiveProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <Topbar year={year} onYearChange={setYear} theme={theme} onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
          <Routes>
            <Route path="/"           element={<Overview year={year} />} />
            <Route path="/overview"   element={<Overview year={year} />} />
            <Route path="/flowtracker" element={<FlowTracker year={year} />} />
            <Route path="/anomaly"    element={<AnomalyDetection year={year} />} />
            <Route path="/prediction" element={<Prediction year={year} />} />
            <Route path="/optimizer"  element={<Optimizer year={year} />} />
            <Route path="/reports"    element={<Reports />} />
            <Route path="/ingestion"  element={<Ingestion />} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <ChatbotWidget year={year} />
      </div>
    </LiveProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />
          <Route path="/*"     element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function LoginGuard() {
  const { isAuth } = useAuth();
  return isAuth ? <Navigate to="/" replace /> : <Login />;
}
