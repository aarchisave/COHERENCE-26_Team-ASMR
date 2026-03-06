// ============================================================
// seed.js — Populate MongoDB with budget data + default user
// Run: node seed.js
// ============================================================

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const BudgetRecord = require('./models/BudgetRecord');
const User         = require('./models/User');

// ── Constants (exact same as original data.js) ──────────────
const DEPARTMENTS = ['Health & Family Welfare', 'Education', 'Road Transport & Highways', 'Agriculture & Farmers', 'Rural Development'];
const DISTRICTS   = ['North India', 'South India', 'East India', 'West India', 'Central India', 'Northeast India', 'Northwest India', 'Coastal Regions', 'Deccan Plateau', 'Hill States'];
const YEARS       = [2022, 2023, 2024];
const MONTHS      = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

const BASE_ALLOCATIONS = {
  'Health & Family Welfare':  89155,
  'Education':                112899,
  'Road Transport & Highways':278000,
  'Agriculture & Farmers':    125036,
  'Rural Development':        177894,
};

const DISTRICT_EFFICIENCY = {
  'North India': 0.88, 'South India': 0.92, 'East India': 0.75,
  'West India':  0.85, 'Central India': 0.70, 'Northeast India': 0.55,
  'Northwest India': 0.78, 'Coastal Regions': 0.95, 'Deccan Plateau': 0.80,
  'Hill States': 0.48,
};

const YEAR_GROWTH = { 2022: 1.0, 2023: 1.08, 2024: 1.15 };

const ANOMALY_SEEDS = [
  { year: 2022, month: 5,  dept: 'Road Transport & Highways', district: 'Central India',   type: 'SPIKE',           multiplier: 2.4  },
  { year: 2022, month: 9,  dept: 'Health & Family Welfare',   district: 'Hill States',     type: 'UNDERUTILIZATION',multiplier: 0.12 },
  { year: 2023, month: 2,  dept: 'Agriculture & Farmers',     district: 'Northeast India', type: 'DELAY',           multiplier: 0.08 },
  { year: 2023, month: 7,  dept: 'Education',                 district: 'East India',      type: 'SPIKE',           multiplier: 2.1  },
  { year: 2023, month: 10, dept: 'Rural Development',         district: 'Central India',   type: 'LEAKAGE_RISK',    multiplier: 1.9  },
  { year: 2024, month: 1,  dept: 'Road Transport & Highways', district: 'Hill States',     type: 'UNDERUTILIZATION',multiplier: 0.15 },
  { year: 2024, month: 4,  dept: 'Health & Family Welfare',   district: 'Northeast India', type: 'SPIKE',           multiplier: 2.6  },
  { year: 2024, month: 6,  dept: 'Agriculture & Farmers',     district: 'Deccan Plateau',  type: 'DELAY',           multiplier: 0.09 },
  { year: 2024, month: 8,  dept: 'Education',                 district: 'Central India',   type: 'LEAKAGE_RISK',    multiplier: 1.85 },
  { year: 2024, month: 11, dept: 'Rural Development',         district: 'East India',      type: 'UNDERUTILIZATION',multiplier: 0.18 },
];

function pseudoRandom(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function generateRawDataset() {
  const records = [];
  let id = 1;

  YEARS.forEach(year => {
    MONTHS.forEach((monthName, monthIdx) => {
      DEPARTMENTS.forEach(dept => {
        DISTRICTS.forEach(district => {
          const annualBase  = BASE_ALLOCATIONS[dept] * YEAR_GROWTH[year];
          const distShare   = annualBase / DISTRICTS.length;
          const monthWeights = [0.06,0.06,0.07,0.08,0.10,0.10,0.10,0.10,0.09,0.09,0.08,0.07];
          const base = distShare * monthWeights[monthIdx];
          const noise = 1 + (pseudoRandom(dept.length + district.length + year + monthIdx) - 0.5) * 0.12;
          const allocated = Math.round(base * noise * 100) / 100;

          const efficiency = DISTRICT_EFFICIENCY[district];
          const spendNoise = 0.85 + pseudoRandom(id) * 0.28;
          let spendingRatio = efficiency * spendNoise;

          const anomaly = ANOMALY_SEEDS.find(a =>
            a.year === year && a.month === monthIdx && a.dept === dept && a.district === district
          );
          let anomalyType = null;
          if (anomaly) { spendingRatio = anomaly.multiplier; anomalyType = anomaly.type; }

          const released = Math.round(allocated * (0.88 + pseudoRandom(id + 1) * 0.15) * 100) / 100;
          const spent    = Math.round(Math.min(allocated * 1.05, Math.max(0, allocated * spendingRatio)) * 100) / 100;
          const balance  = Math.round((allocated - spent) * 100) / 100;
          const utilizationRate = Math.round((spent / allocated) * 10000) / 100;

          records.push({ year, month: monthIdx, monthName, department: dept, district, allocated, released, spent, balance, utilizationRate, anomalyType, isAnomaly: !!anomaly });
          id++;
        });
      });
    });
  });

  return records;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await BudgetRecord.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Seed budget records
    const records = generateRawDataset();
    await BudgetRecord.insertMany(records);
    console.log(`📊 Seeded ${records.length} budget records`);

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
