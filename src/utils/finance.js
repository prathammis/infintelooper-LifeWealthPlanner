export function calculateProjection(scenario, startYear, endYear) {
  const { initialSavings, annualIncome, annualExpenses, returnRate, inflationRate, milestones } = scenario;
  const results = [];
  let netWorth = initialSavings;
  const rr = returnRate / 100;
  const ir = inflationRate / 100;

  for (let year = startYear; year <= endYear; year++) {
    const yearsElapsed = year - startYear;
    const inflatedExpenses = annualExpenses * Math.pow(1 + ir, yearsElapsed);
    // income events add to net worth; goal/event milestones subtract (drawdown)
    const milestoneImpact = milestones
      .filter(m => m.year === year)
      .reduce((sum, m) => sum + (m.type === 'income' ? m.cost : -m.cost), 0);

    const growth = netWorth * rr;
    netWorth = netWorth + growth + annualIncome - inflatedExpenses + milestoneImpact;

    results.push({
      year,
      netWorth,
      income: annualIncome,
      expenses: inflatedExpenses,
      milestoneImpact,
    });
  }
  return results;
}

export function formatCurrency(value) {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}
