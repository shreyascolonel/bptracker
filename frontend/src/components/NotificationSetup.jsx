import { useState } from 'react';
import { api, subscribeToPush } from '../api';

export default function NotificationSetup({ config, onSubscribed }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    if (!config?.vapid_public_key) {
      setStatus({ type: 'error', text: 'VAPID keys not configured. Generate them and add to .env, then rebuild.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await subscribeToPush(config.vapid_public_key);
      setStatus({ type: 'success', text: 'Notifications enabled! You will receive BP and walking reminders.' });
      onSubscribed?.();
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      await api.testPush();
      setStatus({ type: 'success', text: 'Test notification sent!' });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-panel">
      <h2>Notifications</h2>

      <section className="panel inner">
        <h3>Blood Pressure Reminders</h3>
        <ul className="schedule-list">
          <li>Morning — {config?.bp_times?.morning ?? '08:00'}</li>
          <li>Afternoon — {config?.bp_times?.afternoon ?? '14:00'}</li>
          <li>Evening — {config?.bp_times?.evening ?? '20:00'}</li>
        </ul>
        <p className="hint">Reminders are skipped if you've already logged that period today.</p>
      </section>

      <section className="panel inner">
        <h3>Walking Reminder</h3>
        <p>
          If steps are below <strong>{config?.step_goal?.toLocaleString() ?? '5,000'}</strong> by{' '}
          <strong>{config?.walking_reminder_time ?? '18:00'}</strong>, you'll get a nudge to go for a walk.
        </p>
      </section>

      <section className="panel inner">
        <h3>Enable Push Notifications</h3>
        <p className="hint">
          For browser notifications, enable push below. For phone alerts, set <code>NTFY_TOPIC</code> in your .env
          and subscribe to that topic in the <a href="https://ntfy.sh" target="_blank" rel="noreferrer">ntfy app</a>.
        </p>

        <div className="btn-row">
          <button className="btn primary" onClick={handleEnable} disabled={loading}>
            {loading ? 'Working...' : 'Enable Notifications'}
          </button>
          <button className="btn secondary" onClick={handleTest} disabled={loading}>
            Send Test
          </button>
        </div>

        {status && <div className={`banner ${status.type}`}>{status.text}</div>}
      </section>

      <section className="panel inner">
        <h3>Tips for NAS deployment</h3>
        <ul className="schedule-list">
          <li>Access via HTTPS for push notifications to work (use your NAS reverse proxy).</li>
          <li>Add the site to your phone home screen for PWA notifications.</li>
          <li>All data stays in PostgreSQL on your NAS — nothing leaves your network.</li>
        </ul>
      </section>
    </div>
  );
}
