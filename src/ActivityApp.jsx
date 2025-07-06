import React, { useState } from 'react';
import './placeholder-app.css';
import './activity-app.css';

const SUGGESTIONS = [
  { title: 'Meditation', duration: 30, reward: 5, cost: 0 },
  { title: 'Workout', duration: 45, reward: 8, cost: 0 },
  { title: 'Reading', duration: 20, reward: 3, cost: 0 },
];

export default function ActivityApp({ onBack }) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [reward, setReward] = useState(0);
  const [cost, setCost] = useState(0);

  const addEvent = (kind, startTime) => {
    const start = startTime ? new Date(startTime) : new Date();
    const end = new Date(start.getTime() + duration * 60000);
    const ev = {
      title: title || 'Activity',
      start: start.toISOString(),
      end: end.toISOString(),
      kind,
      color: '#34a853',
      reward,
      cost,
    };
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
    events.push(ev);
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    window.dispatchEvent(new CustomEvent('calendar-add-event', { detail: ev }));
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
    setReward(s.reward);
    setCost(s.cost);
  };

  return (
    <div className="placeholder-app activity-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <h2>Activity</h2>
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
          <li key={s.title}>
            <button className="save-button" onClick={() => applySuggestion(s)}>
              {s.title} ({s.duration}m, +{s.reward}xp)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
