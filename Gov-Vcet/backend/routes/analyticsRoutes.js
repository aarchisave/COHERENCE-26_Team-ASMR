const express = require('express');
const router = express.Router();
const { getUtilization, getAnomalies } = require('../controllers/analyticsController');

router.get('/utilization', getUtilization);
router.get('/anomalies', getAnomalies);

module.exports = router;
