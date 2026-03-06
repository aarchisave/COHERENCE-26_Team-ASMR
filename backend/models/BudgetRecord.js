const mongoose = require('mongoose');

const budgetRecordSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  month: { type: Number, required: true },
  monthName: { type: String, required: true },
  department: { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  allocated: { type: Number, required: true },
  released: { type: Number, required: true },
  spent: { type: Number, required: true },
  balance: { type: Number, required: true },
  utilizationRate: { type: Number, required: true },
  anomalyType: { type: String, default: null },
  isAnomaly: { type: Boolean, default: false },
}, { timestamps: false });

budgetRecordSchema.index({ year: 1, department: 1, district: 1 });

module.exports = mongoose.model('BudgetRecord', budgetRecordSchema);
