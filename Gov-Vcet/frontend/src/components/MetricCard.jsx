import React from 'react';

const MetricCard = ({ title, value, subtitle, icon, trend, trendValue }) => {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>

                    {subtitle && (
                        <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
                    )}

                    {trendValue && (
                        <div className={`flex items-center mt-3 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            <span className={`flex items-center justify-center w-5 h-5 rounded-full mr-1.5 ${trend === 'up' ? 'bg-green-100' : 'bg-red-100'}`}>
                                {trend === 'up' ? '↑' : '↓'}
                            </span>
                            {trendValue}
                        </div>
                    )}
                </div>

                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    {icon}
                </div>
            </div>

            {/* Decorative gradient blur at bottom right */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors duration-500 pointer-events-none"></div>
        </div>
    );
};

export default MetricCard;
