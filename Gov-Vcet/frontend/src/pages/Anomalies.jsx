import React, { useEffect, useState } from 'react';
import { fetchAnomalies } from '../services/api';
import { AlertCircle, FileWarning, TrendingUp } from 'lucide-react';

const Anomalies = () => {
    const [anomalies, setAnomalies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetchAnomalies();
                setAnomalies(res.data.data);
            } catch (error) {
                console.error("Error fetching anomalies:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const getAnomalyIcon = (type) => {
        switch (type) {
            case 'OVERSPENDING': return <AlertCircle className="text-red-500" />;
            case 'LOW_UTILIZATION': return <FileWarning className="text-yellow-500" />;
            case 'SUDDEN_SPIKE': return <TrendingUp className="text-orange-500" />;
            default: return <AlertCircle className="text-slate-500" />;
        }
    };

    const getAnomalyStyle = (type) => {
        switch (type) {
            case 'OVERSPENDING': return 'bg-red-50 border-red-200';
            case 'LOW_UTILIZATION': return 'bg-yellow-50 border-yellow-200';
            case 'SUDDEN_SPIKE': return 'bg-orange-50 border-orange-200';
            default: return 'bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Detected Anomalies</h2>
                    <p className="text-slate-500 mt-1">AI-flagged irregular spending behaviors and deviations.</p>
                </div>
                <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-medium text-sm flex items-center">
                    <AlertCircle size={16} className="mr-2" />
                    {anomalies.length} Issues Detected
                </div>
            </div>

            {/* Alert Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {anomalies.slice(0, 3).map((anomaly, idx) => (
                    <div key={idx} className={`rounded-xl border p-5 ${getAnomalyStyle(anomaly.anomaly_type)} shadow-sm transition-all hover:shadow-md`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                {getAnomalyIcon(anomaly.anomaly_type)}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white/50 px-2 py-1 rounded">
                                {anomaly.anomaly_type.replace('_', ' ')}
                            </span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{anomaly.department}</h3>
                        <p className="text-sm text-slate-600 mb-4">{anomaly.district}</p>
                        <p className="text-sm font-medium text-slate-800">{anomaly.message}</p>
                    </div>
                ))}
            </div>

            {/* Anomalies Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800">Complete Exception Log</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Department & District</th>
                                <th className="px-6 py-4 font-medium">Anomaly Type</th>
                                <th className="px-6 py-4 font-medium">Description</th>
                                <th className="px-6 py-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {anomalies.map((anomaly, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-800">{anomaly.department}</p>
                                        <p className="text-xs text-slate-400">{anomaly.state}, {anomaly.district}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-white text-slate-700">
                                            {anomaly.anomaly_type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 max-w-md truncate" title={anomaly.message}>
                                        {anomaly.message}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            Investigate
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {anomalies.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        No anomalies detected matching current criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Anomalies;
