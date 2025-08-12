import React, { useState, useEffect } from 'react';
import './placeholder-app.css';
import './character-evolve.css';

const BARS = [
  { key: 'II', text: 'Love - Help people' },
  {
    key: 'IE',
    text: 'Fun - Make something deep meaningful, and fun',
  },
  {
    key: 'EI',
    text: 'Peace - Make things beautiful, be surrounded by beauty',
  },
  { key: 'EE', text: 'Awe - Make everything at the max degree possible' },
];

const SEMI_FORMLESS_BARS = [
  { key: 'form', text: 'Form' },
  { key: 'semi', text: 'Semi-formless' },
  { key: 'formless', text: 'Formless' },
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

  const setManualValue = (key) => {
    const input = window.prompt('Enter a value between 0 and 100:');
    if (input === null) return;
    const num = parseInt(input, 10);
    if (!Number.isNaN(num)) {
      setValues((prev) => ({
        ...prev,
        [key]: Math.max(0, Math.min(num, 100)),
      }));
    }
  };

  const renderBar = ({ key, display, aria }) => (
    <div key={key} className="evolve-line">
      <button
        className="add-btn"
        aria-label={`add ${aria}`}
        onClick={() => setManualValue(key)}
      >
        +
      </button>
      <div className="label">{display}</div>
      <div className="evolve-bar">
        <div
          className="evolve-fill"
          style={{ width: `${Math.min(values[key] || 0, 100)}%` }}
        />
        <span className="evolve-value">
          {Math.min(values[key] || 0, 100)}%
        </span>
      </div>
    </div>
  );

  return (
    <div className="placeholder-app character-evolve">
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      {BARS.map((b) =>
        renderBar({ key: b.key, display: `${b.key} ${b.text}`, aria: b.key })
      )}
      {SEMI_FORMLESS_BARS.map((b) =>
        renderBar({ key: b.key, display: b.text, aria: b.text })
      )}
    </div>
  );
}
