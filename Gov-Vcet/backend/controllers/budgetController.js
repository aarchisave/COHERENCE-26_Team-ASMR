const { getBudgetData, saveBudgetData } = require('../models/budgetModel');

// @desc    Get all budget records
// @route   GET /api/budget
const getBudget = (req, res) => {
    const data = getBudgetData();
    res.status(200).json({ success: true, count: data.length, data });
};

// @desc    Get budget records by district
// @route   GET /api/budget/:district
const getBudgetByDistrict = (req, res) => {
    const { district } = req.params;
    const data = getBudgetData();

    const filteredData = data.filter(record =>
        record.district.toLowerCase() === district.toLowerCase()
    );

    if (!filteredData.length) {
        return res.status(404).json({ success: false, message: `No budget data found for district: ${district}` });
    }

    res.status(200).json({ success: true, count: filteredData.length, data: filteredData });
};

// @desc    Create a new budget record
// @route   POST /api/budget
const createBudgetRecord = (req, res) => {
    const { year, state, district, department, allocated_budget, spent_budget } = req.body;

    if (!year || !state || !district || !department || allocated_budget === undefined || spent_budget === undefined) {
        res.status(400);
        throw new Error('Please include all fields');
    }

    const data = getBudgetData();

    const newRecord = {
        year,
        state,
        district,
        department,
        allocated_budget,
        spent_budget
    };

    data.push(newRecord);
    saveBudgetData(data);

    res.status(201).json({ success: true, data: newRecord });
};

module.exports = {
    getBudget,
    getBudgetByDistrict,
    createBudgetRecord
};
