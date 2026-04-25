import { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';

const COLORS = ['#4f8ef7', '#f7a44f', '#4ff7a4', '#f74f8e', '#a44ff7', '#f7f74f'];

export default function ScenarioManager() {
  const { state, dispatch } = usePlanner();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', initialSavings: 50000, annualIncome: 80000, annualExpenses: 40000, returnRate: 7, inflationRate: 3 });

  const handleAdd = () => {
    const usedColors = state.scenarios.map(s => s.color);
    const color = COLORS.find(c => !usedColors.includes(c)) || COLORS[state.scenarios.length % COLORS.length];
    dispatch({
      type: 'ADD_SCENARIO',
      scenario: { ...form, id: `scenario-${Date.now()}`, color, milestones: [] },
    });
    setShowForm(false);
    setForm({ name: '', initialSavings: 50000, annualIncome: 80000, annualExpenses: 40000, returnRate: 7, inflationRate: 3 });
  };

  return (
    <div className="scenario-manager">
      <h3>Scenarios</h3>
      <div className="scenario-list">
        {state.scenarios.map(s => (
          <div
            key={s.id}
            className={`scenario-item ${s.id === state.activeScenarioId ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_SCENARIO', id: s.id })}
          >
            <span className="scenario-dot" style={{ background: s.color }} />
            <span className="scenario-name">{s.name}</span>
            {state.scenarios.length > 1 && (
              <button
                className="btn-icon"
                onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_SCENARIO', id: s.id }); }}
                title="Delete scenario"
              >✕</button>
            )}
          </div>
        ))}
      </div>
      {!showForm ? (
        <button className="btn-add" onClick={() => setShowForm(true)}>+ Add Scenario</button>
      ) : (
        <div className="scenario-form">
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <label>Savings: <input type="number" value={form.initialSavings} onChange={e => setForm({ ...form, initialSavings: +e.target.value })} /></label>
          <label>Income: <input type="number" value={form.annualIncome} onChange={e => setForm({ ...form, annualIncome: +e.target.value })} /></label>
          <label>Expenses: <input type="number" value={form.annualExpenses} onChange={e => setForm({ ...form, annualExpenses: +e.target.value })} /></label>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleAdd} disabled={!form.name}>Add</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
