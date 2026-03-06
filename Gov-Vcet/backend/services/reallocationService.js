const { getUtilizationAnalysis } = require('./utilizationService');

const getReallocationRecommendations = () => {
    const analysis = getUtilizationAnalysis();

    // Separate into low utilization (potential donors) and high utilization (potential receivers)
    const lowUtilization = analysis.filter(record => record.utilization_percentage < 50);
    const highUtilization = analysis.filter(record => record.utilization_percentage > 80);

    const recommendations = [];

    lowUtilization.forEach(donor => {
        // Determine surplus funds (e.g., funds over 50% of the allocated remaining)
        // simplistic logic: transfer 50% of unused funds to make it more realistic
        const unusedFunds = donor.allocated_budget - donor.spent_budget;
        const transferableAmount = unusedFunds * 0.5;

        // Find a receiver with high utilization in the same state if possible
        const receiver = highUtilization.find(rec => rec.state === donor.state) || highUtilization[0];

        if (receiver && transferableAmount > 0) {
            recommendations.push({
                from_department: `${donor.department} - ${donor.district}`,
                to_department: `${receiver.department} - ${receiver.district}`,
                recommended_transfer_amount: transferableAmount,
                recommended_transfer_formatted: `₹${(transferableAmount / 10000000).toFixed(2)} Cr`,
                reason: `${donor.department} has low utilization (${donor.utilization_percentage}%). ${receiver.department} has high demand (${receiver.utilization_percentage}%).`
            });
        }
    });

    return recommendations;
};

module.exports = {
    getReallocationRecommendations
};
