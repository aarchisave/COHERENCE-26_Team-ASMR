// ============================================================
// optimizer.js — Budget Reallocation Optimization Engine
// National Budget Flow Intelligence Platform
// ============================================================

const SURPLUS_THRESHOLD = 70;   // % utilization — district below this = has surplus
const DEFICIT_THRESHOLD = 82;   // % utilization — district above this = needs more funds
const MIN_TRANSFER = 2;         // Minimum ₹Cr to bother transferring

function clamp(val, lo, hi) { return Math.max(lo, Math.min(hi, val)); }

// ── Build Optimization Plan ────────────────────────────────────
function buildReallocationPlan(forecasts, records, year) {
  if (!forecasts || !forecasts.length) return null;

  // ── STEP 1: Compute district × department utilization ─────────
  const cells = [];
  BudgetData.departments.forEach(dept => {
    BudgetData.districts.forEach(district => {
      const sub = records.filter(r => r.department === dept && r.district === district);
      if (!sub.length) return;
      const alloc = sub.reduce((s, r) => s + r.allocated, 0);
      const spent = sub.reduce((s, r) => s + r.spent, 0);
      cells.push({
        dept, district, alloc, spent,
        util: alloc > 0 ? Math.round((spent / alloc) * 100) : 0
      });
    });
  });

  const surplusCells = cells.filter(c => c.util <= SURPLUS_THRESHOLD);
  const deficitCells = cells.filter(c => c.util >= DEFICIT_THRESHOLD);

  // Debug logging
  console.log('[Optimizer] Total cells:', cells.length, '| Surplus:', surplusCells.length, '| Deficit:', deficitCells.length);
  console.log('[Optimizer] Surplus sample:', surplusCells.slice(0,3).map(c => c.dept+'.'+c.district+':'+c.util+'%'));
  console.log('[Optimizer] Deficit sample:', deficitCells.slice(0,3).map(c => c.dept+'.'+c.district+':'+c.util+'%'));

  // ── STEP 2: Generate transfer recommendations ─────────────────
  const transfers = [];
  const used = new Set(); // prevent double-using same source

  deficitCells.forEach(def => {
    // How much more allocation does this high-efficiency district need?
    const capacityNeeded = Math.round(def.spent * 0.10 * 100) / 100; // 10% of what it already spends

    surplusCells.forEach(src => {
      if (src.dept === def.dept && src.district === def.district) return;
      const srcKey = src.dept + '::' + src.district;
      if (used.has(srcKey)) return;

      const surplusAmount = Math.max(0, src.alloc * (SURPLUS_THRESHOLD / 100) - src.spent);
      if (surplusAmount < MIN_TRANSFER) return;

      const amount = Math.round(Math.min(capacityNeeded * 0.4, surplusAmount * 0.55) * 100) / 100;
      if (amount < MIN_TRANSFER) return;

      // After transfer: src gives up 'amount', def receives 'amount'
      const fromUtilAfter = Math.round(clamp((src.spent / (src.alloc - amount)) * 100, src.util - 5, 99) * 10) / 10;
      const toUtilAfter   = Math.round(clamp((def.spent / (def.alloc + amount)) * 100, 60, 99) * 10) / 10;

      transfers.push({
        from: src.dept,
        to: def.dept,
        fromDistrict: src.district,
        toDistrict: def.district,
        amount,
        fromUtilBefore: src.util,
        toUtilBefore:   def.util,
        fromUtilAfter,
        toUtilAfter,
        impact: amount > 30 ? 'High' : amount > 10 ? 'Medium' : 'Low',
        rationale: `${src.dept} · ${src.district} (${src.util}% util, surplus ₹${Math.round(surplusAmount)}Cr) → ${def.dept} · ${def.district} (${def.util}% util, high demand — needs more capacity)`
      });

      used.add(srcKey);
    });
  });

  // Deduplicate: keep best-impact transfer per (from, to) dept pair
  const seen = new Set();
  const deduped = transfers.filter(t => {
    const k = t.from + '|' + t.to;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 10);

  // ── STEP 3: Aggregate effect on department-level forecasts ─────
  const deptDelta = {};
  BudgetData.departments.forEach(d => { deptDelta[d] = 0; });
  deduped.forEach(t => {
    deptDelta[t.from] -= t.amount;
    deptDelta[t.to]   += t.amount;
  });

  const optimizedForecasts = forecasts.map(f => {
    const delta = deptDelta[f.department] || 0;
    const newUtil = Math.round(clamp(f.estimatedUtilization + (delta / f.totalAllocated) * 100, 0, 110) * 10) / 10;
    const newYearEnd = Math.round((f.totalAllocated * newUtil / 100) * 100) / 100;
    return {
      ...f,
      estimatedUtilization: newUtil,
      estimatedYearEnd: newYearEnd,
      lapsedAmount: Math.max(0, Math.round((f.totalAllocated - newYearEnd) * 100) / 100)
    };
  });

  // ── STEP 4: Summary metrics ────────────────────────────────────
  const beforeEff = Math.round(forecasts.reduce((s, f) => s + f.estimatedUtilization, 0) / forecasts.length * 10) / 10;
  const afterEff  = Math.round(optimizedForecasts.reduce((s, f) => s + f.estimatedUtilization, 0) / optimizedForecasts.length * 10) / 10;
  const totalMoved = Math.round(deduped.reduce((s, t) => s + t.amount, 0) * 100) / 100;
  const lapseBefore = forecasts.reduce((s, f) => s + f.lapsedAmount, 0);
  const lapseAfter  = optimizedForecasts.reduce((s, f) => s + f.lapsedAmount, 0);

  return {
    year,
    surplus: [...new Set(surplusCells.map(d => d.dept + ' · ' + d.district))],
    deficit: [...new Set(deficitCells.map(d => d.dept + ' · ' + d.district))],
    balanced: [],
    transfers: deduped,
    originalForecasts:  forecasts,
    optimizedForecasts,
    beforeEfficiency:   beforeEff,
    afterEfficiency:    afterEff,
    efficiencyGain:     Math.round((afterEff - beforeEff) * 10) / 10,
    totalAmountMoved:   totalMoved,
    totalLapseReduction: Math.round((lapseBefore - lapseAfter) * 100) / 100,
    totalSurplusPoolCr: Math.round(surplusCells.reduce((s, d) =>
      s + Math.max(0, d.alloc * (SURPLUS_THRESHOLD / 100) - d.spent), 0) * 100) / 100
  };
}

window.Optimizer = { buildReallocationPlan };
