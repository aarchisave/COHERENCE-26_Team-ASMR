const { getFundLapsePredictions } = require('../services/predictionService');

// @desc    Predict fund lapse risks
// @route   GET /api/prediction/fund-lapse
const getFundLapseRisk = (req, res) => {
    const predictions = getFundLapsePredictions();

    res.status(200).json({
        success: true,
        count: predictions.length,
        data: predictions
    });
};

module.exports = {
    getFundLapseRisk
};
