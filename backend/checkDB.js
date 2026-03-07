require('dotenv').config();
const mongoose = require('mongoose');
const BudgetRecord = require('./models/BudgetRecord');

async function checkDB() {
  await mongoose.connect(process.env.MONGO_URI);
  const count = await BudgetRecord.countDocuments();
  console.log(`BudgetRecord count: ${count}`);
  const totalRows = await BudgetRecord.find({ isTotal: true }).limit(5).lean();
  console.log("Sample Total Rows:", totalRows.length);
  process.exit(0);
}

checkDB();
