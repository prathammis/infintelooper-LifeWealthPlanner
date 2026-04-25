import { usePlanner } from '../context/PlannerContext';

function Slider({ label, value, min, max, step, format, onChange }) {
  return (
    <div className="slider-control">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(+e.target.value)}
      />
      <div className="slider-range">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

export default function WhatIfControls() {
  const { state, dispatch } = usePlanner();
  const scenario = state.scenarios.find(s => s.id === state.activeScenarioId);
  if (!scenario) return null;

  const update = updates => dispatch({ type: 'UPDATE_SCENARIO', id: scenario.id, updates });
  const fmt$ = v => `$${(v / 1000).toFixed(0)}k`;
  const fmtPct = v => `${v}%`;

  return (
    <div className="whatif-controls">
      <h3>What-If Controls</h3>
      <p className="whatif-subtitle">Scenario: <strong style={{ color: scenario.color }}>{scenario.name}</strong></p>
      <Slider label="Initial Savings" value={scenario.initialSavings} min={0} max={500000} step={5000} format={fmt$} onChange={v => update({ initialSavings: v })} />
      <Slider label="Annual Income" value={scenario.annualIncome} min={20000} max={500000} step={5000} format={fmt$} onChange={v => update({ annualIncome: v })} />
      <Slider label="Annual Expenses" value={scenario.annualExpenses} min={10000} max={300000} step={5000} format={fmt$} onChange={v => update({ annualExpenses: v })} />
      <Slider label="Return Rate" value={scenario.returnRate} min={1} max={15} step={0.5} format={fmtPct} onChange={v => update({ returnRate: v })} />
      <Slider label="Inflation Rate" value={scenario.inflationRate} min={0} max={10} step={0.5} format={fmtPct} onChange={v => update({ inflationRate: v })} />
    </div>
  );
}
