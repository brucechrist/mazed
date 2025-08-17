import React, { useState, useEffect } from 'react';
import './placeholder-app.css';
import './character-evolve.css';

// Distinct constant name to avoid accidental redeclarations during builds
const FORM_STATE_BARS = [
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

export default function CharacterEvolve({ onBack }) {
  const [values, setValues] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('evolveValues')) || {};
    } catch {
      return {};
    }
  });
  const [editingKey, setEditingKey] = useState(null);
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    localStorage.setItem('evolveValues', JSON.stringify(values));
  }, [values]);

  const startEdit = (key) => {
    setEditingKey(key);
    setTempValue(values[key] ?? '');
  };

  const commitValue = (key) => {
    const num = Number(tempValue);
    if (!Number.isNaN(num)) {
      setValues((prev) => ({
        ...prev,
        [key]: Math.max(0, Math.min(num, 100)),
      }));
    }
    setEditingKey(null);
    setTempValue('');
  };

  const renderBar = ({ key, display, aria }) => (
    <div key={key} className="evolve-line">
      <button
        className="add-btn"
        aria-label={`add ${aria}`}
        type="button"
        onClick={() => startEdit(key)}
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
      {editingKey === key && (
        <input
          type="number"
          className="manual-input"
          value={tempValue}
          min="0"
          max="100"
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={() => commitValue(key)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitValue(key);
          }}
          autoFocus
        />
      )}
    </div>
  );

  return (
    <div className="placeholder-app character-evolve">
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      {FORM_STATE_BARS.map((b) =>
        renderBar({ key: b.key, display: b.text, aria: b.text })
      )}
      <div className="spacer" />
      {BARS.map((b) =>
        renderBar({ key: b.key, display: `${b.key} ${b.text}`, aria: b.key })
      )}
    </div>
  );
}
