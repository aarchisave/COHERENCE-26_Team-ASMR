const BudgetRecord = require('../models/BudgetRecord');
const Transaction  = require('../models/Transaction');

/**
 * pfmsAdapter.js — The Integration Layer
 * This service handles incoming "treasury packets", processes them into the database,
 * and maintains the relationship between individual transactions and budget totals.
 */

async function processPFMSData(packets, io) {
  const processedUpdates = [];

  for (const packet of packets) {
    try {
      const { transactionId, ministry, scheme, amount, timestamp } = packet;

      // 1. Log the transaction (Atomic record)
      const newTx = await Transaction.create({
        transactionId,
        ministry,
        scheme,
        amount,
        timestamp: new Date(timestamp)
      });

      // 2. Update the specific Scheme BudgetRecord
      const record = await BudgetRecord.findOne({
        ministry,
        scheme,
        isTotal: false
      });

      if (record) {
        const newSpent = Math.round((record.currentSpent + amount) * 100) / 100;
        const allocatedRaw = record.be2324Total || record.be2223Total || 1;
        const allocated = Math.max(allocatedRaw, 1); // Floor at 1 Cr for stability
        const newUtil = Math.round((newSpent / allocated) * 10000) / 100;

        await BudgetRecord.updateOne(
          { _id: record._id },
          { $set: { currentSpent: newSpent, utilizationRate: newUtil } }
        );

        // 3. Update the Ministry Total Row
        const ministryTotal = await BudgetRecord.findOne({ ministry, isTotal: true });
        if (ministryTotal) {
          const mNewSpent = Math.round((ministryTotal.currentSpent + amount) * 100) / 100;
          const mAllocatedRaw = ministryTotal.be2324Total || ministryTotal.be2223Total || 1;
          const mAllocated = Math.max(mAllocatedRaw, 1);
          const mNewUtil = Math.round((mNewSpent / mAllocated) * 10000) / 100;

          await BudgetRecord.updateOne(
            { _id: ministryTotal._id },
            { $set: { currentSpent: mNewSpent, utilizationRate: mNewUtil } }
          );
        }

        processedUpdates.push({
          transactionId: newTx.transactionId,
          ministry,
          scheme,
          amount,
          timestamp: newTx.timestamp,
          utilizationRate: newUtil
        });
      }
    } catch (err) {
      console.error(`❌ [PFMS Adapter] Error processing packet ${packet.transactionId}:`, err.message);
    }
  }

  // 4. Broadcast the Treasury Sync to the Frontend
  if (io && processedUpdates.length > 0) {
    io.emit('treasury:sync', {
      source: 'PFMS',
      count: processedUpdates.length,
      updates: processedUpdates,
      timestamp: new Date().toISOString()
    });
  }

  return processedUpdates;
}

module.exports = { processPFMSData };
