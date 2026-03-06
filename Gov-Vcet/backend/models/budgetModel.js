const { generateBudgetData } = require('../utils/dataGenerator');

// Store data in memory for the simulated session
let currentBudgetData = generateBudgetData(1);
let currentMonthCounter = 1;

// Read budget data
const getBudgetData = () => {
    return currentBudgetData;
};

// Simulate next month
const simulateNextMonth = () => {
    currentMonthCounter++;

    // Create a new set of data reflecting the new month
    // In a real application, budgets might carry over or accumulate.
    // For the simulation, we'll generate fresh random values for the new month to show dynamic changes in the dashboard.
    const newMonthData = generateBudgetData(1).map(record => ({
        ...record,
        month: `Month ${currentMonthCounter}`
    }));

    // Append new month data to history
    currentBudgetData = [...currentBudgetData, ...newMonthData];

    return currentBudgetData;
};

// Override existing save pattern since we now use memory simulation
const saveBudgetData = (data) => {
    currentBudgetData = data;
};

// Admin explicitly updates the targeted block in the highest timeframe map
const updateBudgetData = (district, department, payload) => {
    const targetIndex = currentBudgetData.findIndex(record =>
        record.district.toLowerCase() === district.toLowerCase() &&
        record.department.toLowerCase() === department.toLowerCase() &&
        record.month === `Month ${currentMonthCounter}`
    );

    if (targetIndex !== -1) {
        currentBudgetData[targetIndex] = {
            ...currentBudgetData[targetIndex],
            allocatedBudget: payload.allocatedBudget !== undefined ? Number(payload.allocatedBudget) : currentBudgetData[targetIndex].allocatedBudget,
            releasedBudget: payload.releasedBudget !== undefined ? Number(payload.releasedBudget) : currentBudgetData[targetIndex].releasedBudget,
            spentBudget: payload.spentBudget !== undefined ? Number(payload.spentBudget) : currentBudgetData[targetIndex].spentBudget,
        };
        return currentBudgetData[targetIndex];
    }
    return null;
};

module.exports = {
    getBudgetData,
    simulateNextMonth,
    saveBudgetData,
    updateBudgetData
};
