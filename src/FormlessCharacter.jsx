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

  const formlessRows = 5;
  const semiColors = [5, 2, 0];
  const formColors = [4, 3, 1];

  return (
    <div className="formless-character">
      {onBack && (
        <button className="back-button" onClick={onBack}>
          Back
        </button>
      )}
      <div className="column-labels">
        <span>Formless</span>
        <span>Semi-formless</span>
        <span>Form</span>
      </div>
      <div className="diagram">
        {Array.from({ length: formlessRows }).map((_, i) => (
          <div
            key={`f-${i}`}
            className="node circle"
            style={{
              backgroundColor: colors[6],
              gridColumn: 1,
              gridRow: i + 1,
            }}
          />
        ))}
        {semiColors.map((ci, i) => (
          <div
            key={`s-${i}`}
            className="node circle"
            style={{
              backgroundColor: colors[ci],
              gridColumn: 3,
              gridRow: i + 1,
            }}
          />
        ))}
        {formColors.map((ci, i) => (
          <div
            key={`fo-${i}`}
            className="node circle"
            style={{
              backgroundColor: colors[ci],
              gridColumn: 5,
              gridRow: i + 1,
            }}
          />
        ))}
        <div
          className="arrow"
          style={{ gridColumn: 2, gridRow: `1 / span ${formlessRows}` }}
        >
          ▶
        </div>
        <div
          className="arrow"
          style={{ gridColumn: 4, gridRow: `1 / span ${formlessRows}` }}
        >
          ▶
        </div>
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

