import { useEffect, useState } from 'react';
import { api } from '../api';

export default function History() {
  const [bp, setBp] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getBloodPressure(30), api.getActivity(30)])
      .then(([bpData, actData]) => {
        setBp(bpData);
        setActivity(actData.reverse());
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this reading?')) return;
    await api.deleteBloodPressure(id);
    setBp((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <div className="loading">Loading history...</div>;

  return (
    <div className="history">
      <section className="panel">
        <h2>Blood Pressure History</h2>
        {bp.length === 0 ? (
          <p className="empty">No readings yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Period</th>
                  <th>Reading</th>
                  <th>Pulse</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bp.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.recorded_at).toLocaleString()}</td>
                    <td>{r.period}</td>
                    <td>
                      <strong>{r.systolic}/{r.diastolic}</strong>
                    </td>
                    <td>{r.pulse ?? '—'}</td>
                    <td>
                      <button className="btn small danger" onClick={() => handleDelete(r.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Activity History</h2>
        {activity.length === 0 ? (
          <p className="empty">No activity logged yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Steps</th>
                  <th>Calories</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id}>
                    <td>{a.activity_date}</td>
                    <td>{a.steps.toLocaleString()}</td>
                    <td>{Math.round(a.calories_burned)}</td>
                    <td>{a.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
