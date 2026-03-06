const express = require('express');
const router = express.Router();
const { getBudget, getBudgetByDistrict, createBudgetRecord } = require('../controllers/budgetController');

router.route('/')
    .get(getBudget)
    .post(createBudgetRecord);

router.route('/:district')
    .get(getBudgetByDistrict);

module.exports = router;
