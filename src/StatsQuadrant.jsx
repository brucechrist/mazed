import React, { useState } from 'react';
import './stats-quadrant.css';

export default function StatsQuadrant({ initialStats = [5, 5, 5, 5] }) {
  const [stats, setStats] = useState(initialStats);

  const updateStat = (index) => {
    const newVal = prompt('Enter new value', stats[index]);
    if (newVal !== null && newVal !== '') {
      const updated = [...stats];
      updated[index] = newVal;
      setStats(updated);
    }
  };

  return (
    <div className="stats-quadrant">
      <div className="quadrant top-left" onClick={() => updateStat(0)}>{stats[0]}</div>
      <div className="quadrant top-right" onClick={() => updateStat(1)}>{stats[1]}</div>
      <div className="quadrant bottom-left" onClick={() => updateStat(2)}>{stats[2]}</div>
      <div className="quadrant bottom-right" onClick={() => updateStat(3)}>{stats[3]}</div>
    </div>
  );
}
