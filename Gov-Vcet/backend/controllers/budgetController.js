const { getBudgetData, simulateNextMonth, saveBudgetData, updateBudgetData } = require('../models/budgetModel');

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

// @desc    Create a new budget record manually
// @route   POST /api/budget
const createBudgetRecord = (req, res) => {
    const { department, district, allocatedBudget, releasedBudget, spentBudget, month } = req.body;

    if (!department || !district || allocatedBudget === undefined || spentBudget === undefined) {
        res.status(400);
        throw new Error('Please include all required fields');
    }

    const data = getBudgetData();

    const newRecord = {
        department,
        district,
        allocatedBudget,
        releasedBudget: releasedBudget || allocatedBudget,
        spentBudget,
        month: month || "Month 1"
    };

    data.push(newRecord);
    saveBudgetData(data);

    res.status(201).json({ success: true, data: newRecord });
};

// @desc    Simulate a new month and append fresh dynamic data
// @route   POST /api/simulate-month
const triggerSimulation = (req, res) => {
    const newHistoricalData = simulateNextMonth();
    res.status(200).json({
        success: true,
        message: "New month simulated successfully",
        count: newHistoricalData.length,
        data: newHistoricalData
    });
};

// @desc    Admin explicitly overwrite current month analytics per department
// @route   PUT /api/budget/update
const modifyBudget = (req, res) => {
    const { district, department, allocatedBudget, releasedBudget, spentBudget } = req.body;

    if (!district || !department) {
        res.status(400);
        throw new Error('Identification fields (district and department) are required to locate active metric block');
    }

    const updatedRecord = updateBudgetData(district, department, { allocatedBudget, releasedBudget, spentBudget });

    if (!updatedRecord) {
        return res.status(404).json({ success: false, message: `Could not target [${department}] operations located in [${district}] for current month tracking loop.` });
    }

    res.status(200).json({ success: true, data: updatedRecord });
};

module.exports = {
    getBudget,
    getBudgetByDistrict,
    createBudgetRecord,
    triggerSimulation,
    modifyBudget
};
