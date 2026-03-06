import React, { useEffect, useState } from 'react';
import { fetchBudget, fetchUtilization } from '../services/api';
import MetricCard from '../components/MetricCard';
import { Wallet, CreditCard, PiggyBank, PieChart as PieChartIcon } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const Dashboard = () => {
    const [budgetData, setBudgetData] = useState([]);
    const [utilizationData, setUtilizationData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [budgetRes, utilRes] = await Promise.all([
                    fetchBudget(),
                    fetchUtilization()
                ]);
                setBudgetData(budgetRes.data.data);
                setUtilizationData(utilRes.data.data.analysis_overview);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Calculate Aggregates
    const totalAllocated = budgetData.reduce((acc, curr) => acc + curr.allocated_budget, 0);
    const totalSpent = budgetData.reduce((acc, curr) => acc + curr.spent_budget, 0);
    const totalRemaining = totalAllocated - totalSpent;
    const overallUtilization = totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0;

    // Format currency
    const formatCurrency = (val) => `₹${(val / 10000000).toFixed(2)} Cr`;

    // Prepare Chart Data (Allocation vs Spending)
    const chartData = budgetData.map(d => ({
        name: `${d.department} (${d.district})`,
        Allocated: d.allocated_budget,
        Spent: d.spent_budget
    }));

    // Prepare Pie Chart Data (Dept Utilization)
    const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const pData = utilizationData.map(d => ({
        name: `${d.department} - ${d.district}`,
        value: d.utilization_percentage
    }));

    // Prepare District Spending Data
    const districtSpendingMap = budgetData.reduce((acc, curr) => {
        if (!acc[curr.district]) {
            acc[curr.district] = 0;
        }
        acc[curr.district] += curr.spent_budget;
        return acc;
    }, {});

    const districtChartData = Object.keys(districtSpendingMap).map(district => ({
        name: district,
        Spent: districtSpendingMap[district]
    }));

    // Custom Tooltip for Bar Chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl text-white text-sm">
                    <p className="font-medium mb-2 pb-2 border-b border-slate-700">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center space-x-2 my-1">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            <span className="text-slate-300">{entry.name}:</span>
                            <span className="font-semibold">{formatCurrency(entry.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Allocated"
                    value={formatCurrency(totalAllocated)}
                    icon={<Wallet size={24} />}
                    subtitle="FY 2024-2025"
                />
                <MetricCard
                    title="Total Spent"
                    value={formatCurrency(totalSpent)}
                    icon={<CreditCard size={24} />}
                    subtitle="Current Run Rate"
                />
                <MetricCard
                    title="Remaining Funds"
                    value={formatCurrency(totalRemaining)}
                    icon={<PiggyBank size={24} />}
                    trend={totalRemaining > 0 ? "up" : "down"}
                    trendValue="Surplus"
                />
                <MetricCard
                    title="Avg. Utilization"
                    value={`${overallUtilization}%`}
                    icon={<PieChartIcon size={24} />}
                    trend={overallUtilization < 50 ? "down" : "up"}
                    trendValue={overallUtilization < 50 ? "Needs Review" : "On Track"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Allocation vs. Spending by Department</h3>
                    <div className="flex-1 min-h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(value) => `₹${value / 10000000}Cr`}
                                />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="Allocated" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="Spent" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Utilization Pie Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Utilization Density</h3>
                    <p className="text-sm text-slate-500 mb-6">Percentage of active utilization across districts</p>
                    <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value) => [`${value}%`, 'Utilization']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-slate-800">{overallUtilization}%</span>
                            <span className="text-xs text-slate-400">Total Avg</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* District Spending Comparison Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col mt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-6">District Spending Comparison</h3>
                <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={districtChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(value) => `₹${value / 10000000}Cr`}
                            />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                            <Bar dataKey="Spent" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
