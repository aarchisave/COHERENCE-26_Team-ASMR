const { getBudgetData } = require('../models/budgetModel');

// Calculate utilization percentage
const calculateUtilization = (spentBudget, allocatedBudget) => {
  if (allocatedBudget === 0) return 0;
  return (spentBudget / allocatedBudget) * 100;
};

// Get utilization for all departments (incorporating dynamic requirements)
const getUtilizationAnalysis = () => {
  const data = getBudgetData();

  const analysis = data.map(record => {
    const utilization = calculateUtilization(record.spentBudget, record.allocatedBudget);
    const unspentFunds = record.allocatedBudget - record.spentBudget;
    const releaseEfficiency = record.allocatedBudget > 0 ? (record.releasedBudget / record.allocatedBudget) * 100 : 0;

    return {
      ...record,
      utilizationPercentage: parseFloat(utilization.toFixed(2)),
      unspentFunds,
      releaseEfficiency: parseFloat(releaseEfficiency.toFixed(2)),
      isLowUtilization: utilization < 50
    };
  });

  return analysis;
};

// Get departments with low utilization (<50%)
const getLowUtilizationDepartments = () => {
  const analysis = getUtilizationAnalysis();
  return analysis.filter(record => record.isLowUtilization);
};

module.exports = {
  getUtilizationAnalysis,
  getLowUtilizationDepartments,
  calculateUtilization
};
