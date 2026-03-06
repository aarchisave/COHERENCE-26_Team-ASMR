const express = require('express');
const router = express.Router();
const { getBudget, getBudgetByDistrict, createBudgetRecord, triggerSimulation, modifyBudget } = require('../controllers/budgetController');

router.route('/')
    .get(getBudget)
    .post(createBudgetRecord);

router.post('/simulate-month', triggerSimulation);

// Admin explicit update mapping
router.put('/update', modifyBudget);

router.route('/:district')
    .get(getBudgetByDistrict);

module.exports = router;
