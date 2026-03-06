import React, { useState, useEffect } from 'react';
import { fetchBudget, updateBudget } from '../services/api';
import { Settings, Save, Search, CheckCircle2, AlertTriangle } from 'lucide-react';

const Admin = () => {
    const [budgetData, setBudgetData] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [activeMonth, setActiveMonth] = useState('');

    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');

    const [formData, setFormData] = useState({
        allocatedBudget: '',
        releasedBudget: '',
        spentBudget: ''
    });

    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const res = await fetchBudget();
                const data = res.data.data;
                setBudgetData(data);

                // Extract unique fields
                const uniqueDistricts = [...new Set(data.map(item => item.district))];
                const uniqueDepartments = [...new Set(data.map(item => item.department))];

                setDistricts(uniqueDistricts);
                setDepartments(uniqueDepartments);

                if (data.length > 0) {
                    setActiveMonth(data[data.length - 1].month);
                }
            } catch (err) {
                console.error("Failed to fetch admin data:", err);
            }
        };
        loadInitialData();
    }, []);

    // When dropdowns change, find targeting data row and autofill the form block
    useEffect(() => {
        if (selectedDistrict && selectedDepartment) {
            const targetRecord = budgetData.find(record =>
                record.district === selectedDistrict &&
                record.department === selectedDepartment &&
                record.month === activeMonth
            );

            if (targetRecord) {
                setFormData({
                    allocatedBudget: targetRecord.allocatedBudget,
                    releasedBudget: targetRecord.releasedBudget,
                    spentBudget: targetRecord.spentBudget
                });
                setStatusMessage({ type: '', text: '' });
            } else {
                setFormData({ allocatedBudget: '', releasedBudget: '', spentBudget: '' });
                setStatusMessage({ type: 'error', text: 'No active record found for these parameters.' });
            }
        }
    }, [selectedDistrict, selectedDepartment, budgetData, activeMonth]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMessage({ type: '', text: '' });

        try {
            await updateBudget({
                district: selectedDistrict,
                department: selectedDepartment,
                allocatedBudget: Number(formData.allocatedBudget),
                releasedBudget: Number(formData.releasedBudget),
                spentBudget: Number(formData.spentBudget)
            });

            setStatusMessage({ type: 'success', text: `Successfully updated ${selectedDepartment} metrics in ${selectedDistrict}.` });

            // Refresh local state without a full reload block
            const res = await fetchBudget();
            setBudgetData(res.data.data);

            setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
        } catch (err) {
            console.error(err);
            setStatusMessage({ type: 'error', text: 'Failed to update record. Ensure backend is running.' });
        } finally {
            setIsSaving(false);
        }
    };

    const formatRupees = (val) => {
        if (!val) return '₹ 0';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Settings className="mr-3 text-indigo-600" />
                        Administrator Panel
                    </h2>
                    <p className="text-slate-500 mt-1">Directly modify active metric tracking tables for <strong>{activeMonth || 'Dynamic Month'}</strong>.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center">
                    <Search className="text-slate-400 mr-3" size={20} />
                    <h3 className="font-semibold text-slate-700">Select Target Node</h3>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Target District</label>
                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
                        >
                            <option value="">-- Dropdown Search --</option>
                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Target Department</label>
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
                        >
                            <option value="">-- Dropdown Search --</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {selectedDistrict && selectedDepartment && formData.allocatedBudget !== '' && (
                <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6 animate-in fade-in duration-300">
                    <div className="p-6 border-b border-slate-100 bg-indigo-50/50">
                        <h3 className="font-semibold text-indigo-900">Modify Real-Time Parameters</h3>
                        <p className="text-xs text-indigo-600 mt-1">Inputs should be standard INT formats. Formatter handles UI bridging.</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {statusMessage.text && (
                            <div className={`p-4 rounded-lg flex items-start ${statusMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                                {statusMessage.type === 'error' ? <AlertTriangle size={18} className="mr-2 mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mr-2 mt-0.5 shrink-0" />}
                                <p className="text-sm font-medium">{statusMessage.text}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Allocated Budget</label>
                                <input
                                    type="number"
                                    name="allocatedBudget"
                                    value={formData.allocatedBudget}
                                    onChange={handleInputChange}
                                    className="w-full border border-slate-300 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium font-mono text-sm"
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-2 ml-1">{formatRupees(formData.allocatedBudget)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Released Budget</label>
                                <input
                                    type="number"
                                    name="releasedBudget"
                                    value={formData.releasedBudget}
                                    onChange={handleInputChange}
                                    className="w-full border border-slate-300 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium font-mono text-sm"
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-2 ml-1">{formatRupees(formData.releasedBudget)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Spent Budget</label>
                                <input
                                    type="number"
                                    name="spentBudget"
                                    value={formData.spentBudget}
                                    onChange={handleInputChange}
                                    className="w-full border border-slate-300 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium font-mono text-sm"
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-2 ml-1">{formatRupees(formData.spentBudget)}</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center px-6 py-2.5 bg-linear-to-r from-indigo-600 to-blue-600 text-white rounded-lg shadow-sm hover:from-indigo-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50"
                            >
                                <Save size={18} className="mr-2" />
                                {isSaving ? 'Directing Override...' : 'Save Operations Data'}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Admin;
