import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/': return 'Financial Dashboard';
            case '/anomalies': return 'Anomaly Detection';
            case '/predictions': return 'Fund Lapse Prediction';
            case '/reallocation': return 'Reallocation Suggestions';
            case '/admin': return 'Admin Capabilities';
            default: return 'Overview';
        }
    };

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 transition-all duration-300">
            <div className="flex items-center">
                <h2 className="text-2xl font-semibold text-slate-800">{getPageTitle()}</h2>
            </div>

            <div className="flex items-center space-x-6">
                <div className="relative relative-group hidden md:block">
                    <input
                        type="text"
                        placeholder="Search departments..."
                        className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 w-64"
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                </div>

                <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
                    <div className="w-9 h-9 bg-linear-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                        <User size={18} />
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-medium text-slate-700">Financial Officer</p>
                        <p className="text-xs text-slate-500">Administrator</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
