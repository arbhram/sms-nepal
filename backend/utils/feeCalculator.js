function r2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Pure calculation engine — no DB calls, no side effects.
 *
 * Rules:
 *  1. Each component's effective amount = overrideAmount ?? baseAmount
 *  2. Component-scoped adjustments reduce/increase that component's amount only
 *  3. Total-scoped adjustments are applied proportionally across monthly and yearly buckets
 *  4. Surcharges ADD to the amount; everything else reduces
 *  5. No component or total can go below 0
 *
 * @param {Array} components  - documents from StudentFeeAssignment.components
 * @param {Array} adjustments - documents from StudentFeeAssignment.adjustments
 * @returns {{ summary, breakdown }}
 */
export function calculateStudentFee(components = [], adjustments = []) {
  // ── Step 1: resolve effective amount for each included component ────────────
  const active = components
    .filter((c) => c.isIncluded)
    .map((c) => ({
      name:            c.name,
      frequency:       c.frequency,
      category:        c.category,
      effectiveAmount: c.overrideAmount !== null && c.overrideAmount !== undefined
        ? c.overrideAmount
        : c.baseAmount,
      discountApplied: 0,
    }));

  // ── Step 2: component-scoped adjustments ────────────────────────────────────
  for (const comp of active) {
    const compAdjs = adjustments.filter(
      (a) => a.scope === 'component' && a.componentName === comp.name,
    );

    for (const adj of compAdjs) {
      if (adj.type === 'surcharge_fixed') {
        comp.effectiveAmount = r2(comp.effectiveAmount + adj.value);
      } else {
        const raw = adj.type.endsWith('_percent')
          ? r2((adj.value / 100) * comp.effectiveAmount)
          : adj.value;
        const applied = Math.min(raw, comp.effectiveAmount - comp.discountApplied);
        comp.discountApplied = r2(comp.discountApplied + Math.max(0, applied));
      }
    }

    comp.netAmount = r2(Math.max(0, comp.effectiveAmount - comp.discountApplied));
  }

  // ── Step 3: bucket by frequency ─────────────────────────────────────────────
  const monthly    = active.filter((c) => c.frequency === 'monthly');
  const nonMonthly = active.filter((c) => c.frequency !== 'monthly');

  let monthlyGross = r2(monthly.reduce((s, c) => s + c.effectiveAmount, 0));
  let monthlyNet   = r2(monthly.reduce((s, c) => s + c.netAmount, 0));
  let yearlyGross  = r2(nonMonthly.reduce((s, c) => s + c.effectiveAmount, 0));
  let yearlyNet    = r2(nonMonthly.reduce((s, c) => s + c.netAmount, 0));

  // ── Step 4: total-scoped adjustments ────────────────────────────────────────
  let totalLevelDiscount = 0;

  for (const adj of adjustments.filter((a) => a.scope === 'total')) {
    const combined = r2(monthlyNet + yearlyNet);
    if (combined === 0) continue;

    if (adj.type === 'surcharge_fixed') {
      // Distribute proportionally so monthly/yearly stay consistent
      const mRatio = monthlyNet / combined;
      monthlyNet = r2(monthlyNet + adj.value * mRatio);
      yearlyNet  = r2(yearlyNet  + adj.value * (1 - mRatio));
      continue;
    }

    const raw = adj.type.endsWith('_percent')
      ? r2((adj.value / 100) * combined)
      : adj.value;
    const discount = Math.min(raw, combined);

    const mRatio  = monthlyNet / combined;
    monthlyNet    = r2(Math.max(0, monthlyNet - r2(discount * mRatio)));
    yearlyNet     = r2(Math.max(0, yearlyNet  - r2(discount * (1 - mRatio))));
    totalLevelDiscount = r2(totalLevelDiscount + discount);
  }

  const totalDiscounts   = r2(active.reduce((s, c) => s + c.discountApplied, 0) + totalLevelDiscount);
  const totalAnnualGross = r2(monthlyGross * 12 + yearlyGross);
  const totalAnnualNet   = r2(monthlyNet   * 12 + yearlyNet);

  return {
    summary: {
      monthlyGross,
      monthlyNet,
      yearlyGross,
      yearlyNet,
      totalAnnualGross,
      totalAnnualNet,
      totalDiscounts,
    },
    breakdown: active,
  };
}
