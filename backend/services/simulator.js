const cron  = require('node-cron');
const BudgetRecord = require('../models/BudgetRecord');
const { processPFMSData } = require('./pfmsAdapter');

/**
 * simulator.js — Mock PFMS External System
 * This service simulates an external treasury system (e.g., PFMS)
 * It generates "transaction packets" and pushes them to our internal Adapter.
 */

let io;
let tickCount = 0;

function setIO(socketIO) { io = socketIO; }
function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

async function simulatePFMSPush() {
  tickCount++;
  try {
    // 1. Pick 3-5 random schemes that have an allocation for 2023-24
    const sampleSize = Math.floor(rand(3, 6));
    const total = await BudgetRecord.countDocuments({ isTotal: false, be2324Total: { $gt: 0 } });
    if (!total) return;

    const pfmsPackets = [];

    for (let i = 0; i < sampleSize; i++) {
        const skip = Math.floor(Math.random() * total);
        const record = await BudgetRecord.findOne({ isTotal: false, be2324Total: { $gt: 0 } }).skip(skip).lean();
        if (!record) continue;

        // 2. Generate a realistic transaction amount (not as a percentage, but as a "spend event")
        // Typically a single payment for a scheme might be 0.1 to 2 Cr
        const allocated = record.be2324Total;
        const amount = rand(50, 250); // ₹ 50 Cr to 250 Cr per transaction (Treasury Batch)

        pfmsPackets.push({
            transactionId: `PFMS-${Date.now()}-${i}-${Math.floor(Math.random() * 100000)}`,
            ministry: record.ministry,
            scheme:   record.scheme,
            amount,
            timestamp: new Date().toISOString()
        });
    }

    // 3. Push to our Internal Treasury Adapter
    if (pfmsPackets.length > 0) {
        console.log(`📡 [PFMS External] Pushing ${pfmsPackets.length} transaction packets...`);
        await processPFMSData(pfmsPackets, io);
    }

  } catch (err) {
    console.error('❌ [PFMS External] Push Error:', err.message);
  }
}

function start() {
  cron.schedule('*/5 * * * * *', simulatePFMSPush);
  console.log('🏛️  Mock PFMS External Feed Started — Pushing packets every 5s');
}

module.exports = { start, setIO };
