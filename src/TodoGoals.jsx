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
  const [input, setInput] = useState('');

  useEffect(() => {
    localStorage.setItem('todoGoals', JSON.stringify(tasks));
  }, [tasks]);

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
            {task.text}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="todo-goals">
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
  );
}
