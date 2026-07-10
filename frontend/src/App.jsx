import { useCallback, useEffect, useState } from 'react';
import { api, subscribeToPush } from './api';
import Dashboard from './components/Dashboard';
import BloodPressureForm from './components/BloodPressureForm';
import ActivityForm from './components/ActivityForm';
import History from './components/History';
import NotificationSetup from './components/NotificationSetup';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'bp', label: 'Blood Pressure' },
  { id: 'activity', label: 'Activity' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [config, setConfig] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [cfg, dash] = await Promise.all([api.getConfig(), api.getDashboard()]);
      setConfig(cfg);
      setDashboard(dash);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onDataSaved = () => refresh();

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading tracker...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>BP Tracker</h1>
          <p className="subtitle">Blood pressure · Steps · Calories</p>
        </div>
      </header>

      {error && <div className="banner error">{error}</div>}

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'dashboard' && dashboard && (
          <Dashboard data={dashboard} config={config} />
        )}
        {tab === 'bp' && (
          <BloodPressureForm onSaved={onDataSaved} bpToday={dashboard?.bp_today} />
        )}
        {tab === 'activity' && (
          <ActivityForm
            onSaved={onDataSaved}
            todaySteps={dashboard?.today_steps ?? 0}
            todayCalories={dashboard?.today_calories ?? 0}
            stepGoal={config?.step_goal ?? 5000}
          />
        )}
        {tab === 'history' && <History />}
        {tab === 'settings' && (
          <NotificationSetup config={config} onSubscribed={refresh} />
        )}
      </main>
    </div>
  );
}
