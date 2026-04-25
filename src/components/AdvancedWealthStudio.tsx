import { ReactNode, useMemo, useState } from 'react';

type PlanTier = 'free' | 'premium';

interface AdvancedWealthStudioProps {
  currentAge: number;
  defaultMonthlySavings: number;
  defaultMonthlyIncome: number;
  tier: PlanTier;
  onUpgrade: () => void;
}

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const pct = new Intl.NumberFormat('en-IN', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function numberValue(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function FeatureCard({
  title,
  subtitle,
  premium,
  tier,
  onUpgrade,
  children,
}: {
  title: string;
  subtitle: string;
  premium?: boolean;
  tier: PlanTier;
  onUpgrade: () => void;
  children: ReactNode;
}) {
  const locked = premium && tier === 'free';

  return (
    <article className={locked ? 'studio-card locked' : 'studio-card'}>
      <div className="studio-head">
        <div>
          <h4>{title}</h4>
          <p>{subtitle}</p>
        </div>
        {premium ? <span className="tier-badge">Premium</span> : <span className="tier-badge free">Free</span>}
      </div>
      {locked ? (
        <div className="lock-panel">
          <p>Upgrade to Premium to unlock this wealth engine.</p>
          <button className="button primary small" onClick={onUpgrade}>Upgrade</button>
        </div>
      ) : (
        children
      )}
    </article>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="field mini">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        step={step ?? 1}
        onChange={(event) => onChange(numberValue(event.target.value, value))}
      />
    </label>
  );
}

export default function AdvancedWealthStudio({
  currentAge,
  defaultMonthlySavings,
  defaultMonthlyIncome,
  tier,
  onUpgrade,
}: AdvancedWealthStudioProps) {
  const [dividend, setDividend] = useState({
    stock: 'Bluechip Basket',
    investedAmount: 1000000,
    yieldPct: 3.5,
    frequency: 4,
    annualGrowthPct: 8,
  });

  const [sip, setSip] = useState({
    monthlySip: 25000,
    annualReturnPct: 12,
    years: 15,
    annualStepUpPct: 10,
  });

  const [swp, setSwp] = useState({
    corpus: 20000000,
    monthlyWithdrawal: 90000,
    returnPct: 8,
    inflationPct: 5,
  });

  const [fire, setFire] = useState({
    monthlyExpenses: 70000,
    inflationPct: 6,
    retirementAge: 45,
    savingsRatePct: 40,
    returnPct: 11,
  });

  const [emergency, setEmergency] = useState({
    monthlyExpenses: 60000,
    dependents: 2,
    jobStability: 6,
  });

  const [passive, setPassive] = useState({
    dividends: 18000,
    rent: 12000,
    freelance: 8000,
    sideBusiness: 6000,
    affiliate: 2500,
    trading: 3000,
    activeSalary: defaultMonthlyIncome,
  });

  const [retirement, setRetirement] = useState({
    currentAge,
    retirementAge: 60,
    monthlyInvestment: defaultMonthlySavings,
    epfPpfMonthly: 12000,
    pensionMonthly: 35000,
    returnPct: 10,
    inflationPct: 6,
  });

  const [netWorth, setNetWorth] = useState({
    savings: 500000,
    stocks: 900000,
    mutualFunds: 1200000,
    crypto: 100000,
    property: 3500000,
    gold: 250000,
    loans: 1700000,
    emiDebt: 250000,
    cardDebt: 80000,
  });

  const [goals, setGoals] = useState([
    { name: 'Car', target: 1400000, years: 4 },
    { name: 'House', target: 15000000, years: 9 },
    { name: 'Marriage', target: 2500000, years: 6 },
    { name: 'Education', target: 5000000, years: 10 },
    { name: 'Travel', target: 900000, years: 3 },
    { name: 'Business Fund', target: 2000000, years: 5 },
  ]);

  const [inflationSim, setInflationSim] = useState({
    lifestyleCost: 85000,
    yearsAhead: 15,
    inflationPct: 6,
  });

  const [drip, setDrip] = useState({
    corpus: 1500000,
    yieldPct: 4,
    annualGrowthPct: 9,
    years: 12,
  });

  const dividendMetrics = useMemo(() => {
    const annualIncome = dividend.investedAmount * (dividend.yieldPct / 100);
    const monthlyIncome = annualIncome / 12;
    const targetMonthly = 50000;

    let corpus = dividend.investedAmount;
    let month = 0;

    while (month < 600) {
      const monthlyYield = (dividend.yieldPct / 100) / 12;
      const monthlyGrowth = (dividend.annualGrowthPct / 100) / 12;
      corpus = corpus * (1 + monthlyYield + monthlyGrowth);
      const projectedMonthly = (corpus * (dividend.yieldPct / 100)) / 12;
      month += 1;
      if (projectedMonthly >= targetMonthly) {
        break;
      }
    }

    return {
      monthlyIncome,
      annualIncome,
      yearsTo50k: month >= 600 ? null : month / 12,
      projectedDripCorpus: corpus,
    };
  }, [dividend]);

  const sipMetrics = useMemo(() => {
    let corpus = 0;
    let yearlyContribution = sip.monthlySip * 12;
    const yearly: Array<{ year: number; corpus: number; invested: number }> = [];
    let invested = 0;

    for (let year = 1; year <= sip.years; year += 1) {
      for (let month = 0; month < 12; month += 1) {
        corpus = (corpus + yearlyContribution / 12) * (1 + (sip.annualReturnPct / 100) / 12);
        invested += yearlyContribution / 12;
      }
      yearly.push({ year, corpus, invested });
      yearlyContribution *= 1 + sip.annualStepUpPct / 100;
    }

    return {
      finalCorpus: corpus,
      totalInvested: invested,
      wealthCreated: corpus - invested,
      yearly,
    };
  }, [sip]);

  const swpMetrics = useMemo(() => {
    let balance = swp.corpus;
    let withdrawal = swp.monthlyWithdrawal;
    let month = 0;

    while (month < 720 && balance > 0) {
      balance = balance * (1 + (swp.returnPct / 100) / 12) - withdrawal;
      month += 1;
      if (month % 12 === 0) {
        withdrawal *= 1 + swp.inflationPct / 100;
      }
    }

    const yearsLast = month / 12;
    const safeWithdrawal = (swp.corpus * 0.04) / 12;
    const score = clamp((yearsLast / 30) * 100, 0, 100);

    return { yearsLast, safeWithdrawal, score };
  }, [swp]);

  const fireMetrics = useMemo(() => {
    const yearsLeft = Math.max(0, fire.retirementAge - currentAge);
    const annualExpenseNow = fire.monthlyExpenses * 12;
    const annualExpenseAtRetirement = annualExpenseNow * Math.pow(1 + fire.inflationPct / 100, yearsLeft);
    const fireNumber = annualExpenseAtRetirement * 25;

    const months = Math.max(1, yearsLeft * 12);
    const monthlyRate = (fire.returnPct / 100) / 12;
    const monthlyNeeded = monthlyRate > 0
      ? (fireNumber * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1)
      : fireNumber / months;

    return { fireNumber, yearsLeft, monthlyNeeded };
  }, [currentAge, fire]);

  const emergencyMetrics = useMemo(() => {
    const monthsCover = clamp(6 + emergency.dependents + (10 - emergency.jobStability) * 0.5, 3, 18);
    const fund = emergency.monthlyExpenses * monthsCover;
    const monthsToBuild = fund / Math.max(1, defaultMonthlySavings);
    return { monthsCover, fund, monthsToBuild };
  }, [defaultMonthlySavings, emergency]);

  const passiveMetrics = useMemo(() => {
    const monthlyPassive = passive.dividends + passive.rent + passive.freelance + passive.sideBusiness + passive.affiliate + passive.trading;
    const totalIncome = monthlyPassive + passive.activeSalary;
    const passivePct = totalIncome > 0 ? monthlyPassive / totalIncome : 0;
    const dependencyScore = clamp((1 - passivePct) * 100, 0, 100);
    return { monthlyPassive, passivePct, dependencyScore };
  }, [passive]);

  const retirementMetrics = useMemo(() => {
    const years = Math.max(1, retirement.retirementAge - retirement.currentAge);
    let corpus = 0;

    for (let year = 0; year < years; year += 1) {
      for (let month = 0; month < 12; month += 1) {
        corpus = (corpus + retirement.monthlyInvestment + retirement.epfPpfMonthly) * (1 + (retirement.returnPct / 100) / 12);
      }
    }

    const inflationAdjusted = corpus / Math.pow(1 + retirement.inflationPct / 100, years);
    const requiredCorpus = retirement.pensionMonthly * 12 * 25;
    const readiness = clamp((inflationAdjusted / Math.max(1, requiredCorpus)) * 100, 0, 100);

    return { corpus, inflationAdjusted, readiness };
  }, [retirement]);

  const netWorthMetrics = useMemo(() => {
    const assets = netWorth.savings + netWorth.stocks + netWorth.mutualFunds + netWorth.crypto + netWorth.property + netWorth.gold;
    const liabilities = netWorth.loans + netWorth.emiDebt + netWorth.cardDebt;
    const net = assets - liabilities;
    const debtRatio = liabilities / Math.max(1, assets);
    return { assets, liabilities, net, debtRatio };
  }, [netWorth]);

  const inflationMetrics = useMemo(() => {
    const futureIncome = inflationSim.lifestyleCost * Math.pow(1 + inflationSim.inflationPct / 100, inflationSim.yearsAhead);
    const retirementNeed = futureIncome * 12 * 25;
    return { futureIncome, retirementNeed };
  }, [inflationSim]);

  const dripMetrics = useMemo(() => {
    let reinvestCorpus = drip.corpus;
    let withdrawCorpus = drip.corpus;

    for (let year = 0; year < drip.years; year += 1) {
      const reinvestIncome = reinvestCorpus * (drip.yieldPct / 100);
      reinvestCorpus = (reinvestCorpus + reinvestIncome) * (1 + drip.annualGrowthPct / 100);

      withdrawCorpus = withdrawCorpus * (1 + drip.annualGrowthPct / 100);
    }

    const annualPassiveReinvest = reinvestCorpus * (drip.yieldPct / 100);
    const annualPassiveWithdraw = withdrawCorpus * (drip.yieldPct / 100);

    return {
      reinvestCorpus,
      withdrawCorpus,
      acceleration: annualPassiveReinvest - annualPassiveWithdraw,
    };
  }, [drip]);

  const wealthScore = useMemo(() => {
    const savingsRate = defaultMonthlyIncome > 0 ? defaultMonthlySavings / defaultMonthlyIncome : 0;
    const emergencyScore = clamp((emergencyMetrics.monthsCover / 12) * 100, 0, 100);
    const debtScore = clamp((1 - netWorthMetrics.debtRatio) * 100, 0, 100);
    const passiveScore = clamp(passiveMetrics.passivePct * 100, 0, 100);
    const disciplineScore = clamp((sipMetrics.totalInvested / Math.max(1, sipMetrics.finalCorpus)) * 100, 0, 100);

    const total =
      savingsRate * 25 +
      (emergencyScore / 100) * 20 +
      (debtScore / 100) * 20 +
      (passiveScore / 100) * 20 +
      (disciplineScore / 100) * 15;

    return clamp(total, 0, 100);
  }, [defaultMonthlyIncome, defaultMonthlySavings, emergencyMetrics.monthsCover, netWorthMetrics.debtRatio, passiveMetrics.passivePct, sipMetrics.finalCorpus, sipMetrics.totalInvested]);

  return (
    <section className="wealth-studio" id="wealth-suite">
      <div className="studio-title-row">
        <div>
          <p className="eyebrow">Advanced Wealth Suite</p>
          <h2>Premium fintech dashboard for independence planning</h2>
          <p className="studio-subtitle">
            The free plan gives useful calculators. Premium is worth paying for because it combines automation-style insights,
            scenario history, passive income tracking, and action steps that save planning time.
          </p>
        </div>
        <div className="plan-actions">
          <span className={tier === 'premium' ? 'plan-pill premium' : 'plan-pill free'}>
            {tier === 'premium' ? 'Premium Plan' : 'Free Plan'}
          </span>
          {tier === 'free' ? (
            <button className="button primary small" onClick={onUpgrade}>Preview Premium</button>
          ) : (
            <button className="button ghost small" onClick={onUpgrade}>Premium active</button>
          )}
        </div>
      </div>

      <div className="tier-grid">
        <article>
          <span>Free</span>
          <strong>Core timeline + safety basics</strong>
          <p>Timeline, SIP, FIRE, emergency fund, inflation simulator, and goal buckets.</p>
        </article>
        <article>
          <span>Pro</span>
          <strong>Wealth acceleration tools</strong>
          <p>Dividend planner, SWP, DRIP comparison, net worth tracker, wealth score, and saved scenarios.</p>
        </article>
        <article>
          <span>Elite</span>
          <strong>What makes it subscription-worthy</strong>
          <p>Auto-sync ready dashboards, alerts, family planning, AI-style coaching, exports, and dependency scoring.</p>
        </article>
      </div>

      <div className="studio-grid">
        <FeatureCard title="Dividend Income Planner" subtitle="Passive income roadmap + DRIP trajectory" premium tier={tier} onUpgrade={onUpgrade}>
          <div className="studio-fields">
            <label className="field mini"><span>Stock</span><input value={dividend.stock} onChange={(e) => setDividend((v) => ({ ...v, stock: e.target.value }))} /></label>
            <LabeledInput label="Invested Amount" value={dividend.investedAmount} onChange={(value) => setDividend((v) => ({ ...v, investedAmount: value }))} />
            <LabeledInput label="Yield %" value={dividend.yieldPct} onChange={(value) => setDividend((v) => ({ ...v, yieldPct: value }))} step={0.1} />
            <LabeledInput label="Frequency / year" value={dividend.frequency} onChange={(value) => setDividend((v) => ({ ...v, frequency: value }))} />
            <LabeledInput label="Growth %" value={dividend.annualGrowthPct} onChange={(value) => setDividend((v) => ({ ...v, annualGrowthPct: value }))} step={0.1} />
          </div>
          <div className="studio-metrics">
            <p>Monthly dividend: <strong>{money.format(dividendMetrics.monthlyIncome)}</strong></p>
            <p>Yearly passive income: <strong>{money.format(dividendMetrics.annualIncome)}</strong></p>
            <p>Time to 50K/month: <strong>{dividendMetrics.yearsTo50k ? `${dividendMetrics.yearsTo50k.toFixed(1)} years` : 'Beyond 50 years'}</strong></p>
            <p>Reinvestment projection: <strong>{money.format(dividendMetrics.projectedDripCorpus)}</strong></p>
          </div>
        </FeatureCard>

        <FeatureCard title="SIP Calculator + Forecast" subtitle="Step-up SIP with year-wise growth" premium tier={tier} onUpgrade={onUpgrade}>
          <div className="studio-fields">
            <LabeledInput label="Monthly SIP" value={sip.monthlySip} onChange={(value) => setSip((v) => ({ ...v, monthlySip: value }))} />
            <LabeledInput label="Expected Return %" value={sip.annualReturnPct} onChange={(value) => setSip((v) => ({ ...v, annualReturnPct: value }))} step={0.1} />
            <LabeledInput label="Duration (Years)" value={sip.years} onChange={(value) => setSip((v) => ({ ...v, years: value }))} />
            <LabeledInput label="Annual Step-Up %" value={sip.annualStepUpPct} onChange={(value) => setSip((v) => ({ ...v, annualStepUpPct: value }))} step={0.1} />
          </div>
          <div className="studio-metrics">
            <p>Final corpus: <strong>{money.format(sipMetrics.finalCorpus)}</strong></p>
            <p>Total invested: <strong>{money.format(sipMetrics.totalInvested)}</strong></p>
            <p>Total wealth created: <strong>{money.format(sipMetrics.wealthCreated)}</strong></p>
            <p>Year {sip.years} snapshot: <strong>{money.format(sipMetrics.yearly[sipMetrics.yearly.length - 1]?.corpus ?? 0)}</strong></p>
          </div>
        </FeatureCard>

        <FeatureCard title="SWP Planner" subtitle="Retirement withdrawal sustainability" premium tier={tier} onUpgrade={onUpgrade}>
          <div className="studio-fields">
            <LabeledInput label="Retirement Corpus" value={swp.corpus} onChange={(value) => setSwp((v) => ({ ...v, corpus: value }))} />
            <LabeledInput label="Monthly Withdrawal" value={swp.monthlyWithdrawal} onChange={(value) => setSwp((v) => ({ ...v, monthlyWithdrawal: value }))} />
            <LabeledInput label="Expected Return %" value={swp.returnPct} onChange={(value) => setSwp((v) => ({ ...v, returnPct: value }))} step={0.1} />
            <LabeledInput label="Inflation %" value={swp.inflationPct} onChange={(value) => setSwp((v) => ({ ...v, inflationPct: value }))} step={0.1} />
          </div>
          <div className="studio-metrics">
            <p>Money lasts: <strong>{swpMetrics.yearsLast.toFixed(1)} years</strong></p>
            <p>Safe withdrawal (4%): <strong>{money.format(swpMetrics.safeWithdrawal)} / mo</strong></p>
            <p>Sustainability score: <strong>{swpMetrics.score.toFixed(0)} / 100</strong></p>
          </div>
        </FeatureCard>

        <FeatureCard title="FIRE Calculator" subtitle="Financial independence timeline" premium tier={tier} onUpgrade={onUpgrade}>
          <div className="studio-fields">
            <LabeledInput label="Monthly Expenses" value={fire.monthlyExpenses} onChange={(value) => setFire((v) => ({ ...v, monthlyExpenses: value }))} />
            <LabeledInput label="Inflation %" value={fire.inflationPct} onChange={(value) => setFire((v) => ({ ...v, inflationPct: value }))} step={0.1} />
            <LabeledInput label="Retirement Age" value={fire.retirementAge} onChange={(value) => setFire((v) => ({ ...v, retirementAge: value }))} />
            <LabeledInput label="Savings Rate %" value={fire.savingsRatePct} onChange={(value) => setFire((v) => ({ ...v, savingsRatePct: value }))} step={0.1} />
            <LabeledInput label="Return %" value={fire.returnPct} onChange={(value) => setFire((v) => ({ ...v, returnPct: value }))} step={0.1} />
          </div>
          <div className="studio-metrics">
            <p>FIRE number: <strong>{money.format(fireMetrics.fireNumber)}</strong></p>
            <p>Years left: <strong>{fireMetrics.yearsLeft.toFixed(0)}</strong></p>
            <p>Monthly investment needed: <strong>{money.format(fireMetrics.monthlyNeeded)}</strong></p>
          </div>
        </FeatureCard>

        <FeatureCard title="Emergency Fund Planner" subtitle="Safety-first reserve plan" tier={tier} onUpgrade={onUpgrade}>
          <div className="studio-fields">
            <LabeledInput label="Monthly Expenses" value={emergency.monthlyExpenses} onChange={(value) => setEmergency((v) => ({ ...v, monthlyExpenses: value }))} />
            <LabeledInput label="Dependents" value={emergency.dependents} onChange={(value) => setEmergency((v) => ({ ...v, dependents: value }))} />
            <LabeledInput label="Job Stability (1-10)" value={emergency.jobStability} onChange={(value) => setEmergency((v) => ({ ...v, jobStability: clamp(value, 1, 10) }))} />
          </div>
          <div className="studio-metrics">
            <p>Recommended fund: <strong>{money.format(emergencyMetrics.fund)}</strong></p>
            <p>Coverage target: <strong>{emergencyMetrics.monthsCover.toFixed(1)} months</strong></p>
            <p>Build time with current savings: <strong>{emergencyMetrics.monthsToBuild.toFixed(1)} months</strong></p>
          </div>
        </FeatureCard>

        <FeatureCard title="Passive Income Dashboard" subtitle="Track salary dependency shift" premium tier={tier} onUpgrade={onUpgrade}>
          <div className="studio-fields">
            <LabeledInput label="Dividends" value={passive.dividends} onChange={(value) => setPassive((v) => ({ ...v, dividends: value }))} />
            <LabeledInput label="Rent" value={passive.rent} onChange={(value) => setPassive((v) => ({ ...v, rent: value }))} />
            <LabeledInput label="Freelance Retainers" value={passive.freelance} onChange={(value) => setPassive((v) => ({ ...v, freelance: value }))} />
            <LabeledInput label="Side Business" value={passive.sideBusiness} onChange={(value) => setPassive((v) => ({ ...v, sideBusiness: value }))} />
            <LabeledInput label="Affiliate" value={passive.affiliate} onChange={(value) => setPassive((v) => ({ ...v, affiliate: value }))} />
            <LabeledInput label="Trading" value={passive.trading} onChange={(value) => setPassive((v) => ({ ...v, trading: value }))} />
            <LabeledInput label="Salary" value={passive.activeSalary} onChange={(value) => setPassive((v) => ({ ...v, activeSalary: value }))} />
          </div>
          <div className="studio-metrics">
            <p>Total passive income: <strong>{money.format(passiveMetrics.monthlyPassive)}</strong></p>
            <p>Passive income ratio: <strong>{pct.format(passiveMetrics.passivePct)}</strong></p>
            <p>Dependency score: <strong>{passiveMetrics.dependencyScore.toFixed(0)} / 100</strong></p>
          </div>
        </FeatureCard>

        <FeatureCard title="Retirement Wealth Projection" subtitle="Corpus + inflation-adjusted readiness" premium tier={tier} onUpgrade={onUpgrade}>
          <div className="studio-fields">
            <LabeledInput label="Current Age" value={retirement.currentAge} onChange={(value) => setRetirement((v) => ({ ...v, currentAge: value }))} />
            <LabeledInput label="Retirement Age" value={retirement.retirementAge} onChange={(value) => setRetirement((v) => ({ ...v, retirementAge: value }))} />
            <LabeledInput label="Monthly Investment" value={retirement.monthlyInvestment} onChange={(value) => setRetirement((v) => ({ ...v, monthlyInvestment: value }))} />
            <LabeledInput label="EPF/PPF Monthly" value={retirement.epfPpfMonthly} onChange={(value) => setRetirement((v) => ({ ...v, epfPpfMonthly: value }))} />
            <LabeledInput label="Pension assumption / mo" value={retirement.pensionMonthly} onChange={(value) => setRetirement((v) => ({ ...v, pensionMonthly: value }))} />
          </div>
          <div className="studio-metrics">
            <p>Retirement corpus projection: <strong>{money.format(retirementMetrics.corpus)}</strong></p>
            <p>Inflation-adjusted value: <strong>{money.format(retirementMetrics.inflationAdjusted)}</strong></p>
            <p>Readiness score: <strong>{retirementMetrics.readiness.toFixed(0)} / 100</strong></p>
          </div>
        </FeatureCard>

        <FeatureCard title="Net Worth Tracker" subtitle="Assets vs liabilities intelligence" premium tier={tier} onUpgrade={onUpgrade}>
          <div className="studio-fields">
            <LabeledInput label="Savings" value={netWorth.savings} onChange={(value) => setNetWorth((v) => ({ ...v, savings: value }))} />
            <LabeledInput label="Stocks" value={netWorth.stocks} onChange={(value) => setNetWorth((v) => ({ ...v, stocks: value }))} />
            <LabeledInput label="Mutual Funds" value={netWorth.mutualFunds} onChange={(value) => setNetWorth((v) => ({ ...v, mutualFunds: value }))} />
            <LabeledInput label="Crypto" value={netWorth.crypto} onChange={(value) => setNetWorth((v) => ({ ...v, crypto: value }))} />
            <LabeledInput label="Property" value={netWorth.property} onChange={(value) => setNetWorth((v) => ({ ...v, property: value }))} />
            <LabeledInput label="Gold" value={netWorth.gold} onChange={(value) => setNetWorth((v) => ({ ...v, gold: value }))} />
            <LabeledInput label="Loans" value={netWorth.loans} onChange={(value) => setNetWorth((v) => ({ ...v, loans: value }))} />
            <LabeledInput label="EMI Debt" value={netWorth.emiDebt} onChange={(value) => setNetWorth((v) => ({ ...v, emiDebt: value }))} />
            <LabeledInput label="Card Debt" value={netWorth.cardDebt} onChange={(value) => setNetWorth((v) => ({ ...v, cardDebt: value }))} />
          </div>
          <div className="studio-metrics">
            <p>Total assets: <strong>{money.format(netWorthMetrics.assets)}</strong></p>
            <p>Total liabilities: <strong>{money.format(netWorthMetrics.liabilities)}</strong></p>
            <p>Net worth: <strong>{money.format(netWorthMetrics.net)}</strong></p>
          </div>
        </FeatureCard>

        <FeatureCard title="Goal-Based Investment Buckets" subtitle="Purpose-based monthly targets" tier={tier} onUpgrade={onUpgrade}>
          <div className="goal-grid">
            {goals.map((goal, index) => {
              const months = Math.max(1, goal.years * 12);
              const contribution = goal.target / months;
              return (
                <div key={goal.name} className="goal-row">
                  <strong>{goal.name}</strong>
                  <div className="goal-inputs">
                    <label className="field mini"><span>Target</span><input type="number" value={goal.target} onChange={(e) => setGoals((items) => items.map((item, i) => i === index ? { ...item, target: numberValue(e.target.value, item.target) } : item))} /></label>
                    <label className="field mini"><span>Years</span><input type="number" value={goal.years} onChange={(e) => setGoals((items) => items.map((item, i) => i === index ? { ...item, years: numberValue(e.target.value, item.years) } : item))} /></label>
                  </div>
                  <small>Need {money.format(contribution)} / month</small>
                </div>
              );
            })}
          </div>
        </FeatureCard>

        <FeatureCard title="Inflation Impact Simulator" subtitle="Lifestyle and retirement reality check" tier={tier} onUpgrade={onUpgrade}>
          <div className="studio-fields">
            <LabeledInput label="Current lifestyle cost" value={inflationSim.lifestyleCost} onChange={(value) => setInflationSim((v) => ({ ...v, lifestyleCost: value }))} />
            <LabeledInput label="Years ahead" value={inflationSim.yearsAhead} onChange={(value) => setInflationSim((v) => ({ ...v, yearsAhead: value }))} />
            <LabeledInput label="Inflation %" value={inflationSim.inflationPct} onChange={(value) => setInflationSim((v) => ({ ...v, inflationPct: value }))} step={0.1} />
          </div>
          <div className="studio-metrics">
            <p>Future required income: <strong>{money.format(inflationMetrics.futureIncome)} / month</strong></p>
            <p>Future retirement need: <strong>{money.format(inflationMetrics.retirementNeed)}</strong></p>
          </div>
        </FeatureCard>

        <FeatureCard title="DRIP Simulator" subtitle="Reinvest vs withdraw compounding" premium tier={tier} onUpgrade={onUpgrade}>
          <div className="studio-fields">
            <LabeledInput label="Initial corpus" value={drip.corpus} onChange={(value) => setDrip((v) => ({ ...v, corpus: value }))} />
            <LabeledInput label="Dividend yield %" value={drip.yieldPct} onChange={(value) => setDrip((v) => ({ ...v, yieldPct: value }))} step={0.1} />
            <LabeledInput label="Annual growth %" value={drip.annualGrowthPct} onChange={(value) => setDrip((v) => ({ ...v, annualGrowthPct: value }))} step={0.1} />
            <LabeledInput label="Years" value={drip.years} onChange={(value) => setDrip((v) => ({ ...v, years: value }))} />
          </div>
          <div className="studio-metrics">
            <p>Reinvest corpus: <strong>{money.format(dripMetrics.reinvestCorpus)}</strong></p>
            <p>Withdraw corpus: <strong>{money.format(dripMetrics.withdrawCorpus)}</strong></p>
            <p>Passive acceleration: <strong>{money.format(dripMetrics.acceleration)} / year</strong></p>
          </div>
        </FeatureCard>

        <FeatureCard title="Wealth Score Dashboard" subtitle="Gamified wealth health index" premium tier={tier} onUpgrade={onUpgrade}>
          <div className="studio-metrics">
            <p>Wealth health score: <strong>{wealthScore.toFixed(0)} / 100</strong></p>
            <p>Savings rate: <strong>{pct.format(defaultMonthlySavings / Math.max(1, defaultMonthlyIncome))}</strong></p>
            <p>Emergency strength: <strong>{emergencyMetrics.monthsCover.toFixed(1)} months</strong></p>
            <p>Debt control: <strong>{(100 - netWorthMetrics.debtRatio * 100).toFixed(0)} / 100</strong></p>
            <p>Passive flywheel: <strong>{pct.format(passiveMetrics.passivePct)}</strong></p>
          </div>
        </FeatureCard>
      </div>
    </section>
  );
}
