import { useState } from 'react';
import { api } from '../api';

function inferPeriod() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export default function BloodPressureForm({ onSaved, bpToday }) {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [period, setPeriod] = useState(inferPeriod());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.createBloodPressure({
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        pulse: pulse ? Number(pulse) : null,
        period,
        notes: notes || null,
      });
      setMessage({ type: 'success', text: 'Blood pressure saved!' });
      setSystolic('');
      setDiastolic('');
      setPulse('');
      setNotes('');
      onSaved?.();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-panel">
      <h2>Log Blood Pressure</h2>
      <p className="hint">
        Record readings three times daily: morning, afternoon, and evening.
      </p>

      <div className="bp-grid compact">
        {['morning', 'afternoon', 'evening'].map((p) => (
          <div key={p} className={`bp-slot ${bpToday?.[p] ? 'done' : 'pending'}`}>
            <span className="bp-period">{p}</span>
            {bpToday?.[p] ? (
              <span className="bp-value">
                {bpToday[p].systolic}/{bpToday[p].diastolic}
              </span>
            ) : (
              <span className="bp-missing">Pending</span>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <label>
            Period
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </label>
        </div>

        <div className="form-row triple">
          <label>
            Systolic (mmHg)
            <input
              type="number"
              min="50"
              max="300"
              required
              value={systolic}
              onChange={(e) => setSystolic(e.target.value)}
              placeholder="120"
            />
          </label>
          <label>
            Diastolic (mmHg)
            <input
              type="number"
              min="30"
              max="200"
              required
              value={diastolic}
              onChange={(e) => setDiastolic(e.target.value)}
              placeholder="80"
            />
          </label>
          <label>
            Pulse (optional)
            <input
              type="number"
              min="30"
              max="250"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              placeholder="72"
            />
          </label>
        </div>

        <label>
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="After waking, before breakfast..."
          />
        </label>

        {message && (
          <div className={`banner ${message.type}`}>{message.text}</div>
        )}

        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Reading'}
        </button>
      </form>
    </div>
  );
}
