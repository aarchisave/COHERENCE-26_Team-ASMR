const { getUtilizationAnalysis, getLowUtilizationDepartments } = require('../services/utilizationService');
const { detectAnomalies } = require('../services/anomalyService');

// @desc    Get budget utilization analysis
// @route   GET /api/analytics/utilization
const getUtilization = (req, res) => {
    const analysis = getUtilizationAnalysis();
    const lowUtilization = getLowUtilizationDepartments();

    res.status(200).json({
        success: true,
        data: {
            analysis_overview: analysis,
            low_utilization_departments: lowUtilization,
            total_departments: analysis.length,
            low_utilization_count: lowUtilization.length
        }
    });
};

// @desc    Get spending anomalies
// @route   GET /api/analytics/anomalies
const getAnomalies = (req, res) => {
    const anomalies = detectAnomalies();

    res.status(200).json({
        success: true,
        count: anomalies.length,
        data: anomalies
    });
};

module.exports = {
    getUtilization,
    getAnomalies
};
