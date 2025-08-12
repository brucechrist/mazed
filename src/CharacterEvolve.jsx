import React, { useState, useEffect } from 'react';
import './placeholder-app.css';
import './character-evolve.css';

const SEMI_FORMLESS_BARS = [
  { key: 'form', text: 'Form' },
  { key: 'semi', text: 'Semi-formless' },
  { key: 'formless', text: 'Formless' },
];

const BARS = [
  { key: 'II', text: 'Love' },
  { key: 'IE', text: 'Joy' },
  { key: 'EI', text: 'Peace' },
  { key: 'EE', text: 'Awe' },
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
    const num = Number(input);
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
        type="button"
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
      {SEMI_FORMLESS_BARS.map((b) =>
        renderBar({ key: b.key, display: b.text, aria: b.text })
      )}
      <div className="spacer" />
      {BARS.map((b) =>
        renderBar({ key: b.key, display: `${b.key} ${b.text}`, aria: b.key })
      )}
    </div>
  );
}
