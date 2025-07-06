import React, { useState } from 'react';
import './placeholder-app.css';
import './activity-app.css';

const SUGGESTIONS = [
  { title: 'Meditation', icon: '🧘', duration: 30 },
  { title: 'Workout', icon: '🏋️', duration: 45 },
  { title: 'Reading', icon: '📚', duration: 20 },
];

export default function ActivityApp({ onBack }) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [reward, setReward] = useState(0);
  const [cost, setCost] = useState(0);
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

  return (
    <div className="placeholder-app activity-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <h2>Meditation</h2>
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
          onChange={(e) => setDuration(Number(e.target.value))}
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
          <li key={s.title} className="activity-suggestion">
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
