import React, { useState, useEffect } from 'react';
import './formless-character.css';
import { DEFAULT_COLORS, loadPalette, savePalette } from './colorConfig.js';

export default function FormlessCharacter({ onBack }) {
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadPalette().then(setColors);
  }, []);

  useEffect(() => {
    savePalette(colors);
  }, [colors]);

  const rows = [
    {
      formless: { colorIndex: 6 },
      semi: { colorIndex: 5 },
      form: { colorIndex: 4 },
    },
    {
      formless: { colorIndex: 6 },
      semi: { colorIndex: 2 },
      form: { colorIndex: 3 },
    },
    {
      formless: { colorIndex: 6 },
      semi: { colorIndex: 0 },
      form: { colorIndex: 1 },
    },
  ];

  return (
    <div className="formless-character">
      {onBack && (
        <button className="back-button" onClick={onBack}>
          Back
        </button>
      )}
      <div className="diagram">
        <div className="column-labels">
          <span>Formless</span>
          <span>Semi-formless</span>
          <span>Form</span>
        </div>
        {rows.map((r, idx) => (
          <div key={idx} className="row">
            <div
              className="node circle"
              style={{ backgroundColor: colors[r.formless.colorIndex] }}
            />
            <div className="arrow">▶</div>
            <div
              className="node circle"
              style={{ backgroundColor: colors[r.semi.colorIndex] }}
            />
            <div className="arrow">▶</div>
            <div
              className="node circle"
              style={{ backgroundColor: colors[r.form.colorIndex] }}
            />
          </div>
        ))}
      </div>
      <button
        className="color-edit-toggle"
        onClick={() => setEditing((e) => !e)}
      >
        {editing ? 'Done' : 'Edit Colors'}
      </button>
      {editing && (
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
      )}
    </div>
  );
}

