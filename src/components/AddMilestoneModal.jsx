import { useState } from 'react';

const ICONS = { goal: '🎯', income: '💰', event: '🎉' };

export default function AddMilestoneModal({ onAdd, onClose, defaultYear }) {
  const [form, setForm] = useState({
    name: '',
    year: defaultYear || new Date().getFullYear() + 5,
    cost: 0,
    type: 'goal',
  });

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name) return;
    onAdd({ ...form, id: `m-${Date.now()}`, icon: ICONS[form.type] });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Milestone</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Name
            <input
              autoFocus
              placeholder="e.g. Buy a house"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Year
            <input
              type="number"
              value={form.year}
              onChange={e => setForm({ ...form, year: +e.target.value })}
            />
          </label>
          <label>
            Cost ($)
            <input
              type="number"
              value={form.cost}
              onChange={e => setForm({ ...form, cost: +e.target.value })}
            />
          </label>
          <label>
            Type
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="goal">Goal (expense)</option>
              <option value="income">Income event</option>
              <option value="event">Life event</option>
            </select>
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={!form.name}>Add Milestone</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
