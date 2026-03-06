const express = require('express');
const router = express.Router();
const { getReallocation } = require('../controllers/recommendationController');

router.get('/reallocate', getReallocation);

module.exports = router;
