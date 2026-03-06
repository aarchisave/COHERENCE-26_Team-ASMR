const { getUtilizationAnalysis } = require('./utilizationService');
const { calculateRisk } = require('../utils/riskCalculator');

const getFundLapsePredictions = () => {
    const analysis = getUtilizationAnalysis();

    const predictions = analysis.map(record => {
        // Risk score depends on utilization and time remaining
        // For simulation, we assume risk is purely derived from utilization performance metrics 
        // against the elapsed simulated month context.
        const riskLevel = calculateRisk(record.utilizationPercentage);

        return {
            department: `${record.department} - ${record.district}`,
            allocatedBudget: record.allocatedBudget,
            spentBudget: record.spentBudget,
            utilizationPercentage: record.utilizationPercentage,
            riskCategory: riskLevel,
            projectedUnusedFunds: record.unspentFunds,
            month: record.month
        };
    });

    // Sort by risk (High Risk first)
    return predictions.sort((a, b) => {
        const riskOrder = { 'High Risk': 3, 'Medium Risk': 2, 'Low Risk': 1 };
        return riskOrder[b.riskCategory] - riskOrder[a.riskCategory];
    });
};

module.exports = {
    getFundLapsePredictions
};
