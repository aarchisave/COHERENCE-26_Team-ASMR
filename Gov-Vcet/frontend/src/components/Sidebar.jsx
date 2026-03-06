import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, TrendingDown, ArrowLeftRight } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Anomaly Detection', path: '/anomalies', icon: <AlertTriangle size={20} /> },
        { name: 'Fund Lapse Prediction', path: '/predictions', icon: <TrendingDown size={20} /> },
        { name: 'Reallocation Suggestions', path: '/reallocation', icon: <ArrowLeftRight size={20} /> },
    ];

    return (
        <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col transition-all duration-300">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-indigo-400">
                    GovBudget Intelligence
                </h1>
                <p className="text-slate-400 text-xs mt-1">Leakage Detection System</p>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-blue-600/20 text-blue-400 font-medium'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`
                        }
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                &copy; {new Date().getFullYear()} GovTech Analytics
            </div>
        </div>
    );
};

export default Sidebar;
