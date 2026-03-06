import React, { useEffect, useState } from 'react';
import { fetchReallocation } from '../services/api';
import { ArrowRight, ArrowRightLeft, Sparkles } from 'lucide-react';

const Reallocation = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetchReallocation();
                setRecommendations(res.data.data);
            } catch (error) {
                console.error("Error fetching reallocation recommendations:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Reallocation Suggestions</h2>
                    <p className="text-slate-500 mt-1">Smart transfer recommendations maximizing budget efficiency.</p>
                </div>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center">
                    <Sparkles size={18} className="mr-2" />
                    Apply Recommendations
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        {/* Background design */}
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ArrowRightLeft size={100} />
                        </div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex-1 pr-4">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Source (Donor)</span>
                                <p className="font-semibold text-lg text-slate-800">{rec.from_department.split(' - ')[0]}</p>
                                <p className="text-sm text-slate-500">{rec.from_department.split(' - ')[1]}</p>
                            </div>

                            <div className="flex flex-col items-center px-4">
                                <div className="bg-emerald-100 text-emerald-700 font-bold px-4 py-1.5 rounded-full mb-2">
                                    {rec.recommended_transfer_formatted}
                                </div>
                                <div className="h-0.5 w-16 bg-slate-200 relative flex items-center justify-center">
                                    <ArrowRight size={16} className="text-slate-400 absolute bg-white px-0.5" />
                                </div>
                            </div>

                            <div className="flex-1 pl-4 text-right">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Destination (Receiver)</span>
                                <p className="font-semibold text-lg text-slate-800">{rec.to_department.split(' - ')[0]}</p>
                                <p className="text-sm text-slate-500">{rec.to_department.split(' - ')[1]}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 border border-slate-100 relative z-10 flex items-start">
                            <Sparkles size={16} className="text-emerald-500 mr-2 mt-0.5 shrink-0" />
                            <p><strong>Reasoning:</strong> {rec.reason}</p>
                        </div>
                    </div>
                ))}

                {recommendations.length === 0 && (
                    <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                        <div className="mx-auto w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                            <Sparkles size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Optimal Efficiency</h3>
                        <p className="text-slate-500 max-w-md mx-auto">No reallocations are currently recommended based on the active budget data. Departments appear optimally funded.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Reallocation;
