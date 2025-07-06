import React, { useState, useEffect } from 'react';
import './placeholder-app.css';
import './activity-app.css';

const SUGGESTIONS = [
  { title: 'Meditation - Vipassana', icon: '🧘', duration: 30 },
  { title: 'Meditation - Ramana', icon: '🧘', duration: 30 },
  { title: 'Yoga', icon: '🧘‍♂️', duration: 45 },
  { title: 'Workout', icon: '🏋️', duration: 45 },
  { title: 'Reading', icon: '📚', duration: 20 },
];

export default function ActivityApp({ onBack }) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [reward, setReward] = useState(0);
  const [cost, setCost] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [xp, setXp] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('activityXP')) || {};
    } catch {
      return {};
    }
  });

  const computeReward = (mins) => {
    let base = 10 + mins;
    let mult = 1;
    if (mins >= 30) mult *= 1.2;
    if (mins >= 60) mult *= 1.2;
    if (mins >= 120) mult *= 1.5;
    if (mins >= 180) mult *= 2;
    return Math.round(base * mult);
  };

  const saveXp = (next) => {
    setXp(next);
    localStorage.setItem('activityXP', JSON.stringify(next));
  };

  useEffect(() => {
    if (!timeLeft) return;
    const id = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const addEvent = (kind, startTime) => {
    const start = startTime ? new Date(startTime) : new Date();
    const end = new Date(start.getTime() + duration * 60000);
    const ev = {
      title: title || 'Activity',
      start: start.toISOString(),
      end: end.toISOString(),
      kind,
      color: '#34a853',
      reward: computeReward(duration),
      cost,
    };
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
    events.push(ev);
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    window.dispatchEvent(new CustomEvent('calendar-add-event', { detail: ev }));

    const titleKey = ev.title;
    const nextXp = { ...xp, [titleKey]: (xp[titleKey] || 0) + duration };
    saveXp(nextXp);
  };

  const handleStart = () => {
    if (!title.trim()) return;
    setTimeLeft(duration * 60);
    addEvent('done');
    setTitle('');
  };

  const handleSchedule = () => {
    if (!title.trim()) return;
    const input = prompt('Start time (YYYY-MM-DDTHH:MM)', new Date().toISOString().slice(0,16));
    if (!input) return;
    addEvent('planned', input);
    setTitle('');
  };

  const applySuggestion = (s) => {
    setTitle(s.title);
    setDuration(s.duration);
    setReward(computeReward(s.duration));
    setCost(0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const t = e.dataTransfer.getData('text/plain');
    const s = SUGGESTIONS.find((x) => x.title === t);
    if (s) applySuggestion(s);
  };

  return (
    <div className="placeholder-app activity-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <h2>Meditation</h2>
      <div
        className="activity-launcher"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {timeLeft > 0 ? (
          <div className="timer">
            {Math.floor(timeLeft / 60)}m {timeLeft % 60}s left
          </div>
        ) : (
          <span>{title || 'Drag activity here'}</span>
        )}
      </div>
      <div className="activity-form">
        <input
          className="activity-input"
          placeholder="Activity"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="number"
          min="1"
          className="activity-input short"
          value={duration}
          onChange={(e) => {
            const d = Number(e.target.value);
            setDuration(d);
            setReward(computeReward(d));
          }}
        />
        <input
          type="number"
          className="activity-input short"
          value={reward}
          onChange={(e) => setReward(Number(e.target.value))}
        />
        <input
          type="number"
          className="activity-input short"
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
        />
        <button className="save-button" onClick={handleStart}>Start Now</button>
        <button className="save-button" onClick={handleSchedule}>Schedule</button>
      </div>
      <h3>Suggestions</h3>
      <ul className="activity-suggestions">
        {SUGGESTIONS.map((s) => (
          <li
            key={s.title}
            className="activity-suggestion"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', s.title)}
          >
            <button className="save-button" onClick={() => applySuggestion(s)}>
              <span className="activity-icon">{s.icon}</span> {s.title} ({s.duration}m)
              <div className="reward-label">{computeReward(s.duration)} R</div>
            </button>
            <div className="xp-bar">
              <div
                className="xp-fill"
                style={{ width: `${Math.min((xp[s.title] || 0) / 180 * 100, 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
