const { getReallocationRecommendations } = require('../services/reallocationService');

// @desc    Get fund reallocation recommendations
// @route   GET /api/recommendation/reallocate
const getReallocation = (req, res) => {
    const recommendations = getReallocationRecommendations();

    res.status(200).json({
        success: true,
        count: recommendations.length,
        data: recommendations
    });
};

module.exports = {
    getReallocation
};
