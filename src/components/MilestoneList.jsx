import { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import AddMilestoneModal from './AddMilestoneModal';
import { formatCurrency } from '../utils/finance';

export default function MilestoneList() {
  const { state, dispatch } = usePlanner();
  const [showModal, setShowModal] = useState(false);
  const scenario = state.scenarios.find(s => s.id === state.activeScenarioId);
  if (!scenario) return null;

  const handleAdd = milestone => {
    dispatch({ type: 'ADD_MILESTONE', scenarioId: scenario.id, milestone });
  };

  const handleDelete = milestoneId => {
    dispatch({ type: 'DELETE_MILESTONE', scenarioId: scenario.id, milestoneId });
  };

  return (
    <div className="milestone-list">
      <div className="milestone-list-header">
        <h3>Milestones</h3>
        <button className="btn-add-small" onClick={() => setShowModal(true)}>+ Add</button>
      </div>
      {scenario.milestones.length === 0 && (
        <p className="empty-hint">No milestones yet. Add one!</p>
      )}
      {scenario.milestones.map(m => (
        <div key={m.id} className="milestone-item">
          <span className="milestone-icon">{m.icon}</span>
          <div className="milestone-info">
            <span className="milestone-name">{m.name}</span>
            <span className="milestone-meta">{m.year} · {m.cost > 0 ? formatCurrency(m.cost) : 'Event'}</span>
          </div>
          <button className="btn-icon danger" onClick={() => handleDelete(m.id)}>✕</button>
        </div>
      ))}
      {showModal && (
        <AddMilestoneModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
          defaultYear={state.timelineStartYear + 5}
        />
      )}
    </div>
  );
}
