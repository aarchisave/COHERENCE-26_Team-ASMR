const { getUtilizationAnalysis } = require('./utilizationService');
const { calculateRisk } = require('../utils/riskCalculator');

const getFundLapsePredictions = () => {
    const analysis = getUtilizationAnalysis();

    const predictions = analysis.map(record => {
        const riskLevel = calculateRisk(record.utilization_percentage);

        return {
            department: `${record.department} - ${record.district}`,
            allocated_budget: record.allocated_budget,
            spent_budget: record.spent_budget,
            utilization_percentage: record.utilization_percentage,
            risk_category: riskLevel,
            projected_unused_funds: record.allocated_budget - record.spent_budget
        };
    });

    // Sort by risk (High Risk first)
    return predictions.sort((a, b) => {
        const riskOrder = { 'High Risk': 3, 'Medium Risk': 2, 'Low Risk': 1 };
        return riskOrder[b.risk_category] - riskOrder[a.risk_category];
    });
};

module.exports = {
    getFundLapsePredictions
};
