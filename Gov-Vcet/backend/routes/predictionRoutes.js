const express = require('express');
const router = express.Router();
const { getFundLapseRisk } = require('../controllers/predictionController');

router.get('/fund-lapse', getFundLapseRisk);

module.exports = router;
