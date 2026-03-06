import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Anomalies from './pages/Anomalies';
import Predictions from './pages/Predictions';
import Reallocation from './pages/Reallocation';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        <Sidebar />

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto p-8 relative">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/anomalies" element={<Anomalies />} />
                <Route path="/predictions" element={<Predictions />} />
                <Route path="/reallocation" element={<Reallocation />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </div>

            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-3xl pointer-events-none"></div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
