const { getUtilizationAnalysis } = require('./utilizationService');

const getReallocationRecommendations = () => {
    const analysis = getUtilizationAnalysis();

    // Rule: Low utilization (potential donors) are < 40%, high utilization (potential receivers) are > 80%
    const lowUtilization = analysis.filter(record => record.utilizationPercentage < 40);
    const highUtilization = analysis.filter(record => record.utilizationPercentage > 80);

    const recommendations = [];

    lowUtilization.forEach(donor => {
        const unusedFunds = donor.unspentFunds;
        // Suggest transferring 50% of the currently idle unspent funds
        const transferableAmount = unusedFunds * 0.5;

        // Find a receiver with high utilization in the same district if possible to minimize logistical friction
        let receiver = highUtilization.find(rec => rec.district === donor.district);

        // If no local receiver is found, look across the state globally
        if (!receiver) {
            receiver = highUtilization[0];
        }

        if (receiver && transferableAmount > 0) {
            recommendations.push({
                fromDepartment: `${donor.department} - ${donor.district}`,
                toDepartment: `${receiver.department} - ${receiver.district}`,
                recommendedTransferAmount: transferableAmount,
                recommendedTransferFormatted: `₹${(transferableAmount / 10000000).toFixed(2)} Cr`,
                reason: `${donor.department} has critical underutilization (${donor.utilizationPercentage}%). ${receiver.department} has severe high demand (${receiver.utilizationPercentage}%). Reallocating idle funds.`
            });
        }
    });

    return recommendations;
};

module.exports = {
    getReallocationRecommendations
};
