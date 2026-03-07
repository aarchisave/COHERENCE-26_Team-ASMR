const mongoose = require('mongoose');

const BudgetRecordSchema = new mongoose.Schema({
  // Identifiers
  demandNo:    { type: String, index: true },        // "Demand No. 1"
  ministry:    { type: String, required: true, index: true },  // "Department of Agriculture and Farmers Welfare"
  scheme:      { type: String, required: true },      // "PM-Kisan" or "Total"
  slNo:        { type: String },                      // "1", "2", … or "NA" for totals
  isTotal:     { type: Boolean, default: false },     // true for ministry-level total rows

  // FY 2021-22 Actuals (actual spending)
  actuals2122Revenue: { type: Number, default: 0 },
  actuals2122Capital: { type: Number, default: 0 },
  actuals2122Total:   { type: Number, default: 0 },

  // FY 2022-23 Budget Estimates (allocated)
  be2223Revenue: { type: Number, default: 0 },
  be2223Capital: { type: Number, default: 0 },
  be2223Total:   { type: Number, default: 0 },

  // FY 2022-23 Revised Estimates
  re2223Revenue: { type: Number, default: 0 },
  re2223Capital: { type: Number, default: 0 },
  re2223Total:   { type: Number, default: 0 },

  // FY 2023-24 Budget Estimates (allocated)
  be2324Revenue: { type: Number, default: 0 },
  be2324Capital: { type: Number, default: 0 },
  be2324Total:   { type: Number, default: 0 },

  // Derived / live-updated fields
  currentSpent:       { type: Number, default: 0 },   // live spending (simulator updates this for current FY)
  utilizationRate:    { type: Number, default: 0 },   // currentSpent / allocated * 100
  isAnomaly:          { type: Boolean, default: false },
  anomalyType:        { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('BudgetRecord', BudgetRecordSchema);
