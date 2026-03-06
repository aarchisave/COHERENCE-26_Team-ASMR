// ============================================================
// data.js — Simulated Budget Data Engine
// India Union Budget Intelligence Platform
// ============================================================

// India's Union Budget major ministry/sector heads
const DEPARTMENTS = ['Health & Family Welfare', 'Education', 'Road Transport & Highways', 'Agriculture & Farmers', 'Rural Development'];
const DISTRICTS = ['North India', 'South India', 'East India', 'West India', 'Central India',
                   'Northeast India', 'Northwest India', 'Coastal Regions', 'Deccan Plateau', 'Hill States'];
const YEARS = [2022, 2023, 2024];
const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

// Base annual allocations (in Crores ₹) per ministry — reflecting realistic Union Budget scale
const BASE_ALLOCATIONS = {
  'Health & Family Welfare':  89155,
  'Education':                112899,
  'Road Transport & Highways':278000,
  'Agriculture & Farmers':    125036,
  'Rural Development':        177894
};

// Regional efficiency multipliers (how well each region utilizes funds)
const DISTRICT_EFFICIENCY = {
  'North India':     0.88, 'South India':    0.92, 'East India':     0.75,
  'West India':      0.85, 'Central India':  0.70, 'Northeast India':0.55,
  'Northwest India': 0.78, 'Coastal Regions':0.95, 'Deccan Plateau': 0.80,
  'Hill States':     0.48
};

// Year-over-year growth factors (aligned with Union Budget growth trends)
const YEAR_GROWTH = { 2022: 1.0, 2023: 1.08, 2024: 1.15 };

// Seeded anomalies: [year, month(0-indexed), department, district, type, multiplier]
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

// Noise generator (seeded pseudo-random for reproducibility)
function pseudoRandom(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function generateMonthlyAllocation(dept, district, year, month) {
  const annualBase = BASE_ALLOCATIONS[dept] * YEAR_GROWTH[year];
  const districtShare = annualBase / DISTRICTS.length;
  // Monthly distribution — weighted toward Q2 & Q3 (typical govt pattern)
  const monthWeights = [0.06, 0.06, 0.07, 0.08, 0.10, 0.10, 0.10, 0.10, 0.09, 0.09, 0.08, 0.07];
  const base = districtShare * monthWeights[month];
  const noise = 1 + (pseudoRandom(dept.length + district.length + year + month) - 0.5) * 0.12;
  return Math.round(base * noise * 100) / 100;
}

function generateRawDataset() {
  const records = [];
  let id = 1;

  YEARS.forEach(year => {
    MONTHS.forEach((monthName, monthIdx) => {
      DEPARTMENTS.forEach(dept => {
        DISTRICTS.forEach(district => {
          const allocated = generateMonthlyAllocation(dept, district, year, monthIdx);
          const efficiency = DISTRICT_EFFICIENCY[district];
          const noise = 0.85 + pseudoRandom(id) * 0.28;
          let spendingRatio = efficiency * noise;

          // Check for anomaly seed
          const anomaly = ANOMALY_SEEDS.find(a =>
            a.year === year && a.month === monthIdx &&
            a.dept === dept && a.district === district
          );

          let anomalyType = null;
          if (anomaly) {
            spendingRatio = anomaly.multiplier;
            anomalyType = anomaly.type;
          }

          const released = Math.round(allocated * (0.88 + pseudoRandom(id + 1) * 0.15) * 100) / 100;
          const spent    = Math.round(Math.min(allocated * 1.05, Math.max(0, allocated * spendingRatio)) * 100) / 100;
          const balance  = Math.round((allocated - spent) * 100) / 100;
          const utilizationRate = Math.round((spent / allocated) * 10000) / 100;

          records.push({
            id: id++,
            year, month: monthIdx, monthName,
            department: dept,
            district,
            allocated,
            released,
            spent,
            balance,
            utilizationRate,
            anomalyType,
            isAnomaly: !!anomaly
          });
        });
      });
    });
  });

  return records;
}

// ── Aggregation Helpers ──────────────────────────────────────

function filterData(records, { year, dept, district } = {}) {
  return records.filter(r =>
    (!year     || r.year === year) &&
    (!dept     || r.department === dept) &&
    (!district || r.district === district)
  );
}

function aggregateByDept(records) {
  const map = {};
  DEPARTMENTS.forEach(d => { map[d] = { allocated: 0, released: 0, spent: 0, balance: 0 }; });
  records.forEach(r => {
    map[r.department].allocated += r.allocated;
    map[r.department].released  += r.released;
    map[r.department].spent     += r.spent;
    map[r.department].balance   += r.balance;
  });
  DEPARTMENTS.forEach(d => {
    map[d].utilizationRate = Math.round((map[d].spent / map[d].allocated) * 10000) / 100;
    map[d].allocated = Math.round(map[d].allocated * 100) / 100;
    map[d].spent     = Math.round(map[d].spent * 100) / 100;
    map[d].balance   = Math.round(map[d].balance * 100) / 100;
  });
  return map;
}

function aggregateByDistrict(records) {
  const map = {};
  DISTRICTS.forEach(d => { map[d] = { allocated: 0, released: 0, spent: 0, balance: 0 }; });
  records.forEach(r => {
    map[r.district].allocated += r.allocated;
    map[r.district].released  += r.released;
    map[r.district].spent     += r.spent;
    map[r.district].balance   += r.balance;
  });
  DISTRICTS.forEach(d => {
    map[d].utilizationRate = Math.round((map[d].spent / map[d].allocated) * 10000) / 100;
    map[d].allocated = Math.round(map[d].allocated * 100) / 100;
    map[d].spent     = Math.round(map[d].spent * 100) / 100;
    map[d].balance   = Math.round(map[d].balance * 100) / 100;
  });
  return map;
}

function aggregateByMonth(records) {
  const map = {};
  MONTHS.forEach((m, i) => { map[i] = { month: m, allocated: 0, released: 0, spent: 0 }; });
  records.forEach(r => {
    map[r.month].allocated += r.allocated;
    map[r.month].released  += r.released;
    map[r.month].spent     += r.spent;
  });
  return Object.values(map);
}

// Global dataset singleton
const RAW_DATA = generateRawDataset();

window.BudgetData = {
  raw: RAW_DATA,
  departments: DEPARTMENTS,
  districts: DISTRICTS,
  years: YEARS,
  months: MONTHS,
  filter: filterData,
  byDept: aggregateByDept,
  byDistrict: aggregateByDistrict,
  byMonth: aggregateByMonth,
  anomalies: RAW_DATA.filter(r => r.isAnomaly)
};
