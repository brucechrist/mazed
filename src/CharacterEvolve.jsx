import React, { useState, useEffect } from 'react';
import './placeholder-app.css';
import './character-evolve.css';

const BARS = [
  { key: 'II', text: 'Love - Help people' },
  { key: 'IE', text: 'Fun - Make something deep meaningful, and fun' },
  { key: 'EI', text: 'Peace - Make things beautiful, be surrounded by beauty' },
  { key: 'EE', text: 'Awe - Make everything at the max degree possible' },
];

export default function CharacterEvolve({ onBack }) {
  const [values, setValues] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('evolveValues')) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('evolveValues', JSON.stringify(values));
  }, [values]);

  const increment = (key) => {
    setValues((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  return (
    <div className="placeholder-app character-evolve">
      <button className="back-button" onClick={onBack}>Back</button>
        {BARS.map((b) => (
          <div key={b.key} className="evolve-line">
            <div className="label">{b.key} {b.text}</div>
            <div className="evolve-bar">
              <div
                className="evolve-fill"
                style={{ width: `${Math.min(values[b.key] || 0, 100)}%` }}
              />
            </div>
            <button
              className="add-btn"
              aria-label={`add ${b.key}`}
              onClick={() => increment(b.key)}
            >
              +
            </button>
          </div>
        ))}
    </div>
  );
}
