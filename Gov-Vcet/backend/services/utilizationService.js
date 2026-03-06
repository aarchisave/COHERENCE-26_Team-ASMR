const { getBudgetData } = require('../models/budgetModel');

// Calculate utilization percentage
const calculateUtilization = (spent, allocated) => {
  if (allocated === 0) return 0;
  return (spent / allocated) * 100;
};

// Get utilization for all departments
const getUtilizationAnalysis = () => {
  const data = getBudgetData();
  
  const analysis = data.map(record => {
    const utilization = calculateUtilization(record.spent_budget, record.allocated_budget);
    return {
      ...record,
      utilization_percentage: parseFloat(utilization.toFixed(2)),
      is_low_utilization: utilization < 50
    };
  });

  return analysis;
};

// Get departments with low utilization (<50%)
const getLowUtilizationDepartments = () => {
  const analysis = getUtilizationAnalysis();
  return analysis.filter(record => record.is_low_utilization);
};

module.exports = {
  getUtilizationAnalysis,
  getLowUtilizationDepartments,
  calculateUtilization
};
