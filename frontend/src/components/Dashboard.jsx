import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function BpStatus({ systolic, diastolic }) {
  let cls = 'normal';
  let label = 'Normal';
  if (systolic >= 140 || diastolic >= 90) {
    cls = 'high';
    label = 'High';
  } else if (systolic >= 130 || diastolic >= 80) {
    cls = 'elevated';
    label = 'Elevated';
  }
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function Dashboard({ data, config }) {
  const stepPct = Math.min(100, Math.round((data.today_steps / data.step_goal) * 100));

  const bpChartData = data.weekly_bp_systolic.map((s, i) => ({
    label: `${formatDate(s.date)} ${s.period[0].toUpperCase()}`,
    systolic: s.value,
    diastolic: data.weekly_bp_diastolic[i]?.value,
  }));

  return (
    <div className="dashboard">
      <section className="cards">
        <div className="card">
          <span className="card-label">Today's Steps</span>
          <span className="card-value">{data.today_steps.toLocaleString()}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${stepPct}%` }} />
          </div>
          <span className="card-meta">Goal: {data.step_goal.toLocaleString()} ({stepPct}%)</span>
        </div>
        <div className="card">
          <span className="card-label">Calories Burned</span>
          <span className="card-value">{Math.round(data.today_calories)}</span>
          <span className="card-meta">Today</span>
        </div>
      </section>

      <section className="panel">
        <h2>Today's Blood Pressure</h2>
        <div className="bp-grid">
          {['morning', 'afternoon', 'evening'].map((period) => {
            const reading = data.bp_today[period];
            const time = config?.bp_times?.[period] ?? '';
            return (
              <div key={period} className={`bp-slot ${reading ? 'done' : 'pending'}`}>
                <span className="bp-period">{period}</span>
                <span className="bp-time">{time}</span>
                {reading ? (
                  <>
                    <span className="bp-value">
                      {reading.systolic}/{reading.diastolic}
                    </span>
                    <BpStatus systolic={reading.systolic} diastolic={reading.diastolic} />
                  </>
                ) : (
                  <span className="bp-missing">Not recorded</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>Weekly Steps</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.weekly_steps.map((d) => ({ ...d, label: formatDate(d.date) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            />
            <ReferenceLine y={data.step_goal} stroke="#f59e0b" strokeDasharray="4 4" label="Goal" />
            <Bar dataKey="steps" fill="#14b8a6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="panel">
        <h2>Weekly Calories</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.weekly_calories.map((d) => ({ ...d, label: formatDate(d.date) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            />
            <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {bpChartData.length > 0 && (
        <section className="panel">
          <h2>Blood Pressure Trend (7 days)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={bpChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[40, 180]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              />
              <Legend />
              <ReferenceLine y={120} stroke="#ef4444" strokeDasharray="4 4" label="Systolic 120" />
              <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 4" label="Diastolic 80" />
              <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  );
}
