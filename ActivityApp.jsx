import React, { useState, useEffect } from 'react';
import './placeholder-app.css';
import './activity-app.css';

const ACTIVITIES = [
  { title: 'Meditation - Vipassana', icon: '🧘', base: 30, description: 'Focus on breath' },
  { title: 'Meditation - Ramana', icon: '🧘', base: 30, description: 'Self inquiry' },
  { title: 'Yoga', icon: '🧘‍♂️', base: 45, description: 'Stretch and breathe' },
  { title: 'Workout', icon: '🏋️', base: 45, description: 'Strength training' },
  { title: 'Reading', icon: '📚', base: 20, description: 'Read a book' },
];

const computeReward = (mins) => {
  let base = 10 + mins;
  let mult = 1;
  if (mins >= 30) mult *= 1.2;
  if (mins >= 60) mult *= 1.2;
  if (mins >= 120) mult *= 1.5;
  if (mins >= 180) mult *= 2;
  return Math.round(base * mult);
};

const getColor = (val) => {
  if (val > 135) return '#f44336';
  if (val > 90) return '#ff9800';
  if (val > 45) return '#ffc107';
  return '#4caf50';
};

function ActivityModal({ activity, onStart, onClose }) {
  const [duration, setDuration] = useState(activity.base);
  const reward = computeReward(duration);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{activity.title}</h3>
        <p>{activity.description}</p>
        <label className="note-label">
          Minutes
          <input
            type="number"
            className="note-title"
            min="1"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </label>
        <div className="reward-label">Reward: {reward} R</div>
        <div className="actions">
          <button className="save-button" onClick={onClose}>Cancel</button>
          <button className="save-button" onClick={() => onStart(duration)}>
            Start
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActivityApp({ onBack }) {
  const [xp, setXp] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('activityXP')) || {};
    } catch {
      return {};
    }
  });
  const [active, setActive] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('activeActivity')) || null;
    } catch {
      return null;
    }
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!active) return 0;
    return Math.max(0, Math.floor((new Date(active.end) - Date.now()) / 1000));
  });
  const [modalAct, setModalAct] = useState(null);

  const saveXp = (next) => {
    setXp(next);
    localStorage.setItem('activityXP', JSON.stringify(next));
  };

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setActive((cur) => {
        if (!cur) return null;
        const remaining = Math.floor((new Date(cur.end) - Date.now()) / 1000);
        if (remaining <= 0) {
          localStorage.removeItem('activeActivity');
          return null;
        }
        setTimeLeft(remaining);
        return cur;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    const onStorage = () => {
      try {
        const data = JSON.parse(localStorage.getItem('activeActivity')) || null;
        setActive(data);
        if (data) {
          setTimeLeft(Math.max(0, Math.floor((new Date(data.end) - Date.now()) / 1000)));
        }
      } catch {
        setActive(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const startActivity = (activity, mins) => {
    const start = new Date();
    const end = new Date(start.getTime() + mins * 60000);
    localStorage.setItem('activeActivity', JSON.stringify({ title: activity.title, end: end.toISOString() }));

    const ev = {
      title: activity.title,
      start: start.toISOString(),
      end: end.toISOString(),
      kind: 'done',
      color: '#34a853',
      reward: computeReward(mins),
      cost: 0,
    };
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
    events.push(ev);
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    window.dispatchEvent(new CustomEvent('calendar-add-event', { detail: ev }));

    const nextXp = { ...xp, [activity.title]: (xp[activity.title] || 0) + mins };
    saveXp(nextXp);
    setModalAct(null);
    setActive({ title: activity.title, end: end.toISOString() });
    setTimeLeft(mins * 60);
  };

  return (
    <div className="placeholder-app activity-app">
      <button className="back-button" onClick={onBack}>Back</button>
      {active && (
        <div className="activity-launcher">
          <div className="timer">
            {Math.floor(timeLeft / 60)}m {timeLeft % 60}s left
          </div>
        </div>
      )}
      <h2>Activities</h2>
      <ul className="activity-grid">
        {ACTIVITIES.map((act) => {
          const spent = xp[act.title] || 0;
          const pct = Math.min(spent / 180, 1);
          return (
            <li
              key={act.title}
              className="activity-box"
              onClick={() => setModalAct(act)}
            >
              <div className="box-header">
                <span className="activity-icon">{act.icon}</span>
                <span>{act.title}</span>
              </div>
              <div className="activity-desc">{act.description}</div>
              <div className="xp-bar">
                <div
                  className="xp-fill"
                  style={{ width: `${pct * 100}%`, background: getColor(spent) }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {modalAct && (
        <ActivityModal
          activity={modalAct}
          onStart={(mins) => startActivity(modalAct, mins)}
          onClose={() => setModalAct(null)}
        />
      )}
    </div>
  );
}
