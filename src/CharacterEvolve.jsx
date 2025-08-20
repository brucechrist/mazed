import React, { useState, useEffect } from 'react';
import './placeholder-app.css';
import './character-evolve.css';
import { COLOR_STORAGE_KEY, DEFAULT_COLORS } from './colorConfig.js';

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
  const [colors, setColors] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(COLOR_STORAGE_KEY)) || DEFAULT_COLORS;
    } catch {
      return DEFAULT_COLORS;
    }
  });

  useEffect(() => {
    localStorage.setItem('evolveValues', JSON.stringify(values));
  }, [values]);

  useEffect(() => {
    localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(colors));
    window.dispatchEvent(new Event('palette-change'));
  }, [colors]);

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
      <div className="color-settings">
        <h2>Colors</h2>
        <div className="color-edit-list">
          {colors.map((c, idx) => (
            <input
              key={idx}
              type="color"
              value={c}
              onChange={(e) => {
                const nc = [...colors];
                nc[idx] = e.target.value;
                setColors(nc);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
