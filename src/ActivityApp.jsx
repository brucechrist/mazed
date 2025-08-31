import React, { useState, useEffect } from 'react';
import './placeholder-app.css';
import './activity-app.css';
import AddActivityModal from './AddActivityModal.jsx';

const DEFAULT_ACTIVITIES = [
  {
    title: 'Meditation - Vipassana',
    icon: '🧘',
    base: 30,
    description: 'Focus on breath',
    dimension: 'Formless',
    aspect: 'II',
    timesPerDay: 1,
    planner: false,
  },
  {
    title: 'Meditation - Ramana',
    icon: '🧘',
    base: 30,
    description: 'Self inquiry',
    dimension: 'Formless',
    aspect: 'II',
    timesPerDay: 1,
    planner: false,
  },
  {
    title: 'Yoga',
    icon: '🧘‍♂️',
    base: 45,
    description: 'Stretch and breathe',
    dimension: 'Form',
    aspect: 'IE',
    timesPerDay: 1,
    planner: false,
  },
  {
    title: 'Workout',
    icon: '🏋️',
    base: 45,
    description: 'Strength training',
    dimension: 'Form',
    aspect: 'EE',
    timesPerDay: 1,
    planner: false,
  },
  {
    title: 'Reading',
    icon: '📚',
    base: 20,
    description: 'Read a book',
    dimension: 'Form',
    aspect: 'II',
    timesPerDay: 1,
    planner: false,
  },
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
  const [activities, setActivities] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('activities')) || DEFAULT_ACTIVITIES;
    } catch {
      return DEFAULT_ACTIVITIES;
    }
  });
  const [counts, setCounts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('activityCounts')) || {};
    } catch {
      return {};
    }
  });
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
  const [showAdd, setShowAdd] = useState(false);

  const saveActivities = (next) => {
    setActivities(next);
    localStorage.setItem('activities', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('activities-updated', { detail: next }));
  };

  const saveCounts = (next) => {
    setCounts(next);
    localStorage.setItem('activityCounts', JSON.stringify(next));
  };

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
    const today = new Date().toISOString().slice(0, 10);
    const nextCounts = { ...counts };
    if (!nextCounts[activity.title]) nextCounts[activity.title] = {};
    nextCounts[activity.title][today] = (nextCounts[activity.title][today] || 0) + 1;
    saveCounts(nextCounts);
    setModalAct(null);
    setActive({ title: activity.title, end: end.toISOString() });
    setTimeLeft(mins * 60);
  };

  const addActivity = (activity) => {
    const next = [...activities, activity];
    saveActivities(next);
    setShowAdd(false);
  };

  const removeActivity = (title) => {
    const next = activities.filter((a) => a.title !== title);
    saveActivities(next);
  };

  const togglePlanner = (title) => {
    const next = activities.map((a) =>
      a.title === title ? { ...a, planner: !a.planner } : a
    );
    saveActivities(next);
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
      <button className="add-button" onClick={() => setShowAdd(true)}>
        Add Activity
      </button>
      <ul className="activity-grid">
        {activities.map((act) => {
          const spent = xp[act.title] || 0;
          const pct = Math.min(spent / 180, 1);
          const today = new Date().toISOString().slice(0, 10);
          const done = counts[act.title]?.[today] || 0;
          return (
            <li
              key={act.title}
              className="activity-box"
              onClick={() => setModalAct(act)}
            >
              <button
                className={act.planner ? 'planner-button active' : 'planner-button'}
                title="Toggle Daily Planner"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlanner(act.title);
                }}
              >
                📅
              </button>
              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeActivity(act.title);
                }}
              >
                ×
              </button>
              <div className="box-header">
                <span className="activity-icon">{act.icon}</span>
                <span>{act.title}</span>
              </div>
              <div className="activity-desc">{act.description}</div>
              <div className="activity-tags">
                <span>{act.dimension}</span>
                <span>{act.aspect}</span>
              </div>
              <div className="daily-progress">
                {[...Array(act.timesPerDay || 0)].map((_, i) => (
                  <span key={i} className={i < done ? 'dot done' : 'dot'} />
                ))}
              </div>
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
      {showAdd && (
        <AddActivityModal
          onSave={addActivity}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
