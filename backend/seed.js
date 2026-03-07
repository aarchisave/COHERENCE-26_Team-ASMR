// ============================================================
// seed.js — Import real Union Budget CSV into MongoDB
// Run: node seed.js
// ============================================================

require('dotenv').config();
const mongoose     = require('mongoose');
const bcrypt       = require('bcryptjs');
const fs           = require('fs');
const path         = require('path');
const { parse }    = require('csv-parse/sync');
const BudgetRecord = require('./models/BudgetRecord');
const User         = require('./models/User');

function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

function num(v) {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/,/g, '').trim());
  return isNaN(n) ? 0 : n;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await BudgetRecord.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Read and parse the CSV
    const csvPath = path.join(__dirname, '..', 'MRF_4B_Union_Budget.csv');
    const raw = fs.readFileSync(csvPath, 'utf-8');
    const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true });
    console.log(`📄 Parsed ${rows.length} rows from CSV`);

    const records = [];
    let skipped = 0;

    for (const row of rows) {
      const ministry = (row['Ministry/Department'] || '').trim();
      const scheme   = (row['Scheme'] || '').trim();
      const slNo     = (row['Sl.No.'] || '').trim();
      const category = (row['Category'] || '').trim();

      if (!ministry || ministry === 'Grand Total') { skipped++; continue; }

      const isTotal = slNo === 'NA' && scheme === 'Total';

      // Parse all financial columns — values are already in ₹ Crore
      const actuals2122Revenue = num(row['Actuals 2021-2022 Revenue\n'] || row['Actuals 2021-2022 Revenue']);
      const actuals2122Capital = num(row['Actuals 2021-2022 Capital']);
      const actuals2122Total   = num(row['Actuals 2021-2022 Total']);

      const be2223Revenue = num(row['Budget Estimates 2022-2023 Revenue']);
      const be2223Capital = num(row['Budget Estimates 2022-2023 Capital']);
      const be2223Total   = num(row['Budget Estimates 2022-2023 Total']);

      const re2223Revenue = num(row['Revised Estimates2022-2023 Revenue'] || row['Revised Estimates 2022-2023 Revenue']);
      const re2223Capital = num(row['Revised Estimates 2022-2023 Revenue']); // second revenue col is actually capital in the CSV
      const re2223Total   = num(row['Revised Estimates2022-2023 Total']);

      const be2324Revenue = num(row['Budget Estimates2023-2024 Revenue']);
      const be2324Capital = num(row['Budget Estimates2023-2024 Capital']);
      const be2324Total   = num(row['Budget Estimates2023-2024 Total']);

      // For live simulation: start at a realistic mid-year expenditure (75-85%)
      const allocated = be2324Total || be2223Total || actuals2122Total;
      const currentSpent = allocated > 0 ? (allocated * rand(0.75, 0.85)) : 0;
      const utilizationRate = allocated > 0 ? Math.round((currentSpent / allocated) * 10000) / 100 : 0;

      records.push({
        demandNo: category,
        ministry,
        scheme:   isTotal ? 'Total' : scheme,
        slNo,
        isTotal,
        actuals2122Revenue, actuals2122Capital, actuals2122Total,
        be2223Revenue, be2223Capital, be2223Total,
        re2223Revenue, re2223Capital, re2223Total,
        be2324Revenue, be2324Capital, be2324Total,
        currentSpent,
        utilizationRate,
        isAnomaly: false,
        anomalyType: null,
      });
    }

    await BudgetRecord.insertMany(records);
    console.log(`📊 Imported ${records.length} budget records (skipped ${skipped} non-data rows)`);

    // Print summary
    const totals = records.filter(r => r.isTotal);
    const grandAllocated = totals.reduce((s, r) => s + r.be2324Total, 0);
    const grandActuals   = totals.reduce((s, r) => s + r.actuals2122Total, 0);
    console.log(`   Ministries: ${totals.length}`);
    console.log(`   Schemes:    ${records.length - totals.length}`);
    console.log(`   BE 2023-24 Total: ₹${Math.round(grandAllocated).toLocaleString('en-IN')} Cr`);
    console.log(`   Actuals 2021-22:  ₹${Math.round(grandActuals).toLocaleString('en-IN')} Cr`);

    // Create default admin user
    const passwordHash = await bcrypt.hash('password', 10);
    await User.create({ email: 'admin@gov.in', passwordHash, name: 'System Administrator', role: 'admin' });
    console.log('👤 Created default user: admin@gov.in / password');

    console.log('\n✨ Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
