import { useState } from 'react';
import { api } from '../api';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ActivityForm({ onSaved, todaySteps, todayCalories, stepGoal }) {
  const [activityDate, setActivityDate] = useState(todayISO());
  const [steps, setSteps] = useState(String(todaySteps || ''));
  const [calories, setCalories] = useState(String(todayCalories || ''));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.upsertActivity({
        activity_date: activityDate,
        steps: Number(steps),
        calories_burned: Number(calories),
        notes: notes || null,
      });
      setMessage({ type: 'success', text: 'Activity saved!' });
      onSaved?.();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const stepNum = Number(steps) || 0;
  const pct = Math.min(100, Math.round((stepNum / stepGoal) * 100));

  return (
    <div className="form-panel">
      <h2>Log Activity</h2>
      <p className="hint">
        Enter your daily steps and calories burned. You'll get an evening reminder if steps are below your goal.
      </p>

      <div className="card inline">
        <span className="card-label">Step progress</span>
        <span className="card-value">{stepNum.toLocaleString()} / {stepGoal.toLocaleString()}</span>
        <div className="progress-bar">
          <div className="progress-fill orange" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Date
          <input
            type="date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            required
          />
        </label>

        <div className="form-row">
          <label>
            Steps
            <input
              type="number"
              min="0"
              required
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="8000"
            />
          </label>
          <label>
            Calories Burned
            <input
              type="number"
              min="0"
              step="0.1"
              required
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="350"
            />
          </label>
        </div>

        <label>
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Morning walk, gym session..."
          />
        </label>

        {message && (
          <div className={`banner ${message.type}`}>{message.text}</div>
        )}

        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Activity'}
        </button>
      </form>
    </div>
  );
}
