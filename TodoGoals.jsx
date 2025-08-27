import React, { useState, useEffect } from 'react';
import './todo-goals.css';

const TIMEFRAMES = ['All Goals', 'Daily', 'Weekly', 'Monthly', 'Yearly'];
const QUADRANTS = [
  { key: 'UI', label: 'Urgent & Important' },
  { key: 'NI', label: 'Not Urgent & Important' },
  { key: 'UN', label: 'Urgent & Not Important' },
  { key: 'NN', label: 'Not Urgent & Not Important' },
];

export default function TodoGoals({ onBack }) {
  const [activeTab, setActiveTab] = useState(TIMEFRAMES[0]);
  const [tasks, setTasks] = useState(() => {
    const stored = localStorage.getItem('todoGoals');
    return stored ? JSON.parse(stored) : {};
  });
  const [doneLog, setDoneLog] = useState(() => {
    const stored = localStorage.getItem('todoDoneLog');
    return stored ? JSON.parse(stored) : [];
  });
  const [input, setInput] = useState('');
  const [bigGoals, setBigGoals] = useState(() => {
    const stored = localStorage.getItem('todoBigGoals');
    return stored
      ? JSON.parse(stored)
      : { transcendent: '', jackpot: '', rainbow: '', mirror: '' };
  });

  useEffect(() => {
    localStorage.setItem('todoDoneLog', JSON.stringify(doneLog));
  }, [doneLog]);

  useEffect(() => {
    localStorage.setItem('todoGoals', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('todoBigGoals', JSON.stringify(bigGoals));
  }, [bigGoals]);

  const handleAdd = () => {
    if (!input.trim()) return;
    const id = Date.now().toString();
    setTasks((prev) => {
      const next = { ...prev };
      const list = next[activeTab] || [];
      list.push({ id, text: input.trim(), quadrant: 'NI' });
      next[activeTab] = list;
      return next;
    });
    setInput('');
  };

  const handleBigGoalChange = (key, value) => {
    setBigGoals((prev) => ({ ...prev, [key]: value }));
  };

  const handleDragStart = (e, task, timeframe) => {
    e.dataTransfer.setData('task-id', task.id);
    e.dataTransfer.setData('from-timeframe', timeframe);
    e.dataTransfer.setData('quadrant', task.quadrant);
  };

  const handleDrop = (e, quadrant, timeframe) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('task-id');
    const from = e.dataTransfer.getData('from-timeframe');
    const fromQuadrant = e.dataTransfer.getData('quadrant');
    if (!id) return;
    setTasks((prev) => {
      const next = { ...prev };
      let moved;
      next[from] = (next[from] || []).filter((t) => {
        if (t.id === id) {
          moved = t;
          return false;
        }
        return true;
      });
      if (!moved) return prev;
      const targetQuadrant = quadrant || moved.quadrant || fromQuadrant;
      moved = { ...moved, quadrant: targetQuadrant };
      const dest = next[timeframe] || [];
      dest.push(moved);
      next[timeframe] = dest;
      return next;
    });
  };

  const handleDone = (taskId) => {
    const current = (tasks[activeTab] || []).find((t) => t.id === taskId);
    if (!current) return;
    setTasks((prev) => {
      const next = { ...prev };
      next[activeTab] = (next[activeTab] || []).filter((t) => t.id !== taskId);
      return next;
    });
    const entry = { text: current.text, time: Date.now() };
    setDoneLog((prev) => {
      const updated = [...prev, entry].slice(-50);
      return updated;
    });
    const ev = {
      title: current.text,
      start: new Date(),
      end: new Date(Date.now() + 10 * 60000),
      kind: 'done',
    };
    try {
      const stored = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
      stored.push({
        ...ev,
        start: ev.start.toISOString(),
        end: ev.end.toISOString(),
      });
      localStorage.setItem('calendarEvents', JSON.stringify(stored));
    } catch {}
    window.dispatchEvent(new CustomEvent('calendar-add-event', { detail: ev }));
  };

  const allowDrop = (e) => e.preventDefault();

  const renderQuadrant = (qKey) => {
    const items = (tasks[activeTab] || []).filter((t) => t.quadrant === qKey);
    return (
      <div
        className="goal-quadrant"
        onDragOver={allowDrop}
        onDrop={(e) => handleDrop(e, qKey, activeTab)}
      >
        {items.map((task) => (
          <div
            key={task.id}
            className="task"
            draggable
            onDragStart={(e) => handleDragStart(e, task, activeTab)}
          >
            <span className="task-text">{task.text}</span>
            <button
              className="done-button"
              onClick={() => handleDone(task.id)}
            >
              Done
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="todo-goals">
      <div className="big-goals">
        <div className="big-goal-wrapper">
          <label>Transcendent Goal</label>
          <input
            value={bigGoals.transcendent}
            onChange={(e) => handleBigGoalChange('transcendent', e.target.value)}
            placeholder="Set transcendent goal"
          />
        </div>
        <div className="big-goal-wrapper">
          <label>Jackpot Goal</label>
          <input
            value={bigGoals.jackpot}
            onChange={(e) => handleBigGoalChange('jackpot', e.target.value)}
            placeholder="Set jackpot goal"
          />
        </div>
        <div className="big-goal-wrapper">
          <label>Rainbow Goal</label>
          <input
            value={bigGoals.rainbow}
            onChange={(e) => handleBigGoalChange('rainbow', e.target.value)}
            placeholder="Set rainbow goal"
          />
        </div>
        <div className="big-goal-wrapper">
          <label>Mirror Goal</label>
          <input
            value={bigGoals.mirror}
            onChange={(e) => handleBigGoalChange('mirror', e.target.value)}
            placeholder="Set mirror goal"
          />
        </div>
      </div>
      <div className="main-panel">
        {onBack && (
          <button className="back-button" onClick={onBack}>Back</button>
        )}
        <div className="tabs">
          {TIMEFRAMES.map((t) => (
            <button
            key={t}
            className={activeTab === t ? 'active' : ''}
            onClick={() => setActiveTab(t)}
            onDragOver={allowDrop}
            onDrop={(e) => handleDrop(e, null, t)}
          >
            {t}
          </button>
        ))}
        </div>
        <div className="eisenhower">
          {QUADRANTS.map((q) => (
            <div key={q.key} className="goal-quadrant-wrapper">
              <h3>{q.label}</h3>
              {renderQuadrant(q.key)}
            </div>
          ))}
        </div>
        <div className="add">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add goal"
          />
          <button onClick={handleAdd}>Add</button>
        </div>
      </div>
      <div className="done-log">
        {doneLog
          .slice()
          .reverse()
          .map((entry, idx) => {
            const d = new Date(entry.time);
            const date = d.toLocaleDateString();
            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={idx} className="done-banner">
                {date} {time} - {entry.text}
              </div>
            );
          })}
      </div>
    </div>
  );
}
