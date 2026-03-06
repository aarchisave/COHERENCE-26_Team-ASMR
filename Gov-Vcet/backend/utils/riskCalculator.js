const calculateRisk = (utilizationPercentage) => {
    if (utilizationPercentage < 30) {
        return 'High Risk';
    } else if (utilizationPercentage >= 30 && utilizationPercentage < 60) {
        return 'Medium Risk';
    } else {
        return 'Low Risk';
    }
};

module.exports = {
    calculateRisk
};
