const { getBudgetData } = require('../models/budgetModel');
const { calculateUtilization } = require('./utilizationService');

const detectAnomalies = () => {
    const data = getBudgetData();
    const anomalies = [];

    data.forEach(record => {
        const utilization = calculateUtilization(record.spent_budget, record.allocated_budget);

        // Rule 1: Spending greater than allocated budget
        if (record.spent_budget > record.allocated_budget) {
            anomalies.push({
                ...record,
                anomaly_type: 'OVERSPENDING',
                message: `Spent budget (₹${record.spent_budget}) exceeds allocated budget (₹${record.allocated_budget}).`
            });
        }

        // Rule 2: Extremely low utilization (<30%)
        if (utilization < 30) {
            anomalies.push({
                ...record,
                anomaly_type: 'LOW_UTILIZATION',
                utilization_percentage: parseFloat(utilization.toFixed(2)),
                message: `Extremely low budget utilization detected: ${utilization.toFixed(2)}%.`
            });
        }

        // Rule 3: Sudden spikes in spending (Mocked for single-year data, but we can compare to average)
        // For a real implementation, we would compare current month vs previous month spending.
        // For this simulation, we will calculate average spending per department and flag deviations.
    });

    // Calculate average utilization to find relative spikes
    if (data.length > 0) {
        const avgUtilization = data.reduce((acc, curr) => acc + calculateUtilization(curr.spent_budget, curr.allocated_budget), 0) / data.length;
        data.forEach(record => {
            const util = calculateUtilization(record.spent_budget, record.allocated_budget);
            // If a department is spending way more than the average rate (> 50% more than avg) and hasn't overspent yet
            if (util > avgUtilization + 50 && record.spent_budget <= record.allocated_budget) {
                anomalies.push({
                    ...record,
                    anomaly_type: 'SUDDEN_SPIKE',
                    utilization_percentage: parseFloat(util.toFixed(2)),
                    message: `Utilization rate (${util.toFixed(2)}%) is significantly higher than average (${avgUtilization.toFixed(2)}%).`
                });
            }
        });
    }

    return anomalies;
};

module.exports = {
    detectAnomalies
};
