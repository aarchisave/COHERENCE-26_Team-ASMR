import React, { useEffect, useState } from 'react';
import { fetchPrediction } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

const Predictions = () => {
    const [predictions, setPredictions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetchPrediction();
                setPredictions(res.data.data);
            } catch (error) {
                console.error("Error fetching predictions:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Calculate Risk Distribution
    const riskCounts = predictions.reduce(
        (acc, curr) => {
            acc[curr.risk_category] = (acc[curr.risk_category] || 0) + 1;
            return acc;
        },
        { 'High Risk': 0, 'Medium Risk': 0, 'Low Risk': 0 }
    );

    const pieData = [
        { name: 'High Risk', value: riskCounts['High Risk'], color: '#ef4444' }, // Red
        { name: 'Medium Risk', value: riskCounts['Medium Risk'], color: '#f59e0b' }, // Yellow
        { name: 'Low Risk', value: riskCounts['Low Risk'], color: '#10b981' } // Green
    ].filter(d => d.value > 0);

    const formatCurrency = (val) => `₹${(val / 10000000).toFixed(2)} Cr`;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Fund Lapse Predictions</h2>
                <p className="text-slate-500 mt-1">Predictive modeling identifying departments at risk of unspent funds before year-end.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Risk Distribution Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Risk Distribution</h3>
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Prediction Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-semibold text-slate-800">Lapse Risk Assessment</h3>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-medium">Department</th>
                                    <th className="px-6 py-4 font-medium">Utilization</th>
                                    <th className="px-6 py-4 font-medium">Risk Level</th>
                                    <th className="px-6 py-4 font-medium text-right">Projected Unused</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {predictions.map((pred, idx) => {
                                    let badgeClass = 'bg-risk-low text-risk-low border-risk-low';
                                    let Icon = ShieldCheck;

                                    if (pred.risk_category === 'High Risk') {
                                        badgeClass = 'bg-risk-high text-risk-high border-risk-high';
                                        Icon = ShieldAlert;
                                    } else if (pred.risk_category === 'Medium Risk') {
                                        badgeClass = 'bg-risk-medium text-risk-medium border-risk-medium';
                                        Icon = Shield;
                                    }

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-800">{pred.department}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                                                        <div
                                                            className={`h-full ${pred.utilization_percentage < 30 ? 'bg-red-500' : pred.utilization_percentage < 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                            style={{ width: `${Math.min(pred.utilization_percentage, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-600">{pred.utilization_percentage}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeClass}`}>
                                                    <Icon size={12} className="mr-1.5" />
                                                    {pred.risk_category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-semibold text-slate-700">
                                                    {formatCurrency(pred.projected_unused_funds)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Predictions;
