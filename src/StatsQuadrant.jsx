import React, { useState } from 'react';
import './stats-quadrant.css';

export default function StatsQuadrant({ initialStats = [5, 5, 5, 5] }) {
  const [stats, setStats] = useState(initialStats);
  const [editing, setEditing] = useState(null);

  const handleChange = (index, value) => {
    const updated = [...stats];
    updated[index] = value;
    setStats(updated);
  };

  return (
    <div className="stats-quadrant">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`quadrant ${['top-left', 'top-right', 'bottom-left', 'bottom-right'][i]}`}
          onClick={() => setEditing(i)}
        >
          {editing === i ? (
            <input
              type="number"
              autoFocus
              value={stat}
              onChange={(e) => handleChange(i, e.target.value)}
              onBlur={() => setEditing(null)}
            />
          ) : (
            <span>{stat}</span>
          )}
        </div>
      ))}
    </div>
  );
}
