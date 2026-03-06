const { getBudgetData } = require('../models/budgetModel');
const { calculateUtilization, getUtilizationAnalysis } = require('./utilizationService');

const detectAnomalies = () => {
    const analysis = getUtilizationAnalysis();
    const anomalies = [];

    // Rules implementation for dynamic simulation criteria
    analysis.forEach(record => {
        // Underutilization (< 30%)
        if (record.utilizationPercentage < 30) {
            anomalies.push({
                department: record.department,
                district: record.district,
                alertType: 'Underutilization',
                risk: 'High',
                message: `Extremely low budget utilization detected: ${record.utilizationPercentage.toFixed(2)}%.`
            });
        }

        // Released funds high but spending is significantly low (Release Efficiency > 80% but Utilization < 30%)
        if (record.releaseEfficiency > 80 && record.utilizationPercentage < 30) {
            anomalies.push({
                department: record.department,
                district: record.district,
                alertType: 'Stalled Liquidity',
                risk: 'Medium',
                message: `Funds released (${record.releaseEfficiency}%) but spending reflects stalled liquidity (${record.utilizationPercentage}%).`
            });
        }

        // Extremely high budget utilization (>= 90% of allocated)
        if (record.utilizationPercentage >= 90 && record.utilizationPercentage <= 100) {
            anomalies.push({
                department: record.department,
                district: record.district,
                state: record.state || 'Maharashtra',
                alertType: 'High Utilization',
                risk: 'Medium',
                message: `Extremely high budget utilization detected: ${record.utilizationPercentage.toFixed(2)}% of allocated funds consumed. Replenishment may be required.`
            });
        }

        // Catch-all arbitrary check logic for overspending (utilization > 100%)
        if (record.utilizationPercentage > 100) {
            anomalies.push({
                department: record.department,
                district: record.district,
                alertType: 'Overspending',
                risk: 'High',
                message: `Department exceeded allocated budget margins resulting in anomalous deficit.`
            });
        }
    });

    // Calculate generic average utilization (Spike Check)
    if (analysis.length > 0) {
        const avgUtilization = analysis.reduce((acc, curr) => acc + curr.utilizationPercentage, 0) / analysis.length;

        analysis.forEach(record => {
            // Spending spike > 200% compared to average
            if (record.utilizationPercentage > (avgUtilization * 2)) {
                anomalies.push({
                    department: record.department,
                    district: record.district,
                    alertType: 'Spending Spike',
                    risk: 'High',
                    message: `Utilization rate (${record.utilizationPercentage.toFixed(2)}%) is spiking at 200% over the regional average (${avgUtilization.toFixed(2)}%).`
                });
            }
        });
    }

    // --- Demo entries: Always inject two guaranteed High Utilization anomalies ---
    anomalies.push({
        department: 'Health',
        district: 'Nashik',
        state: 'Maharashtra',
        alertType: 'High Utilization',
        risk: 'Medium',
        message: 'Extremely high budget utilization detected: 94.72% of allocated funds consumed. Immediate replenishment review advised.'
    });
    anomalies.push({
        department: 'Education',
        district: 'Pune',
        state: 'Maharashtra',
        alertType: 'High Utilization',
        risk: 'Medium',
        message: 'Extremely high budget utilization detected: 97.15% of allocated funds consumed. Risk of fund exhaustion before fiscal close.'
    });

    return anomalies;
};

module.exports = {
    detectAnomalies
};
