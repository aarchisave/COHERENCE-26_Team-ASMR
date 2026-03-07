const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  ministry:      { type: String, required: true, index: true },
  scheme:        { type: String, required: true },
  amount:        { type: Number, required: true },
  timestamp:     { type: Date, default: Date.now },
  status:        { type: String, enum: ['COMPLETED', 'PENDING', 'FAILED'], default: 'COMPLETED' }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
