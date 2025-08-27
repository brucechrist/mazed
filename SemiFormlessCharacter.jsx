import React, { useState, useEffect } from 'react';
import './semi-formless-character.css';
import { DEFAULT_COLORS, loadPalette, savePalette } from './colorConfig.js';

export default function SemiFormlessCharacter({ onBack }) {
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadPalette().then(setColors);
  }, []);

  useEffect(() => {
    savePalette(colors);
  }, [colors]);

  const nodes = [
    { id: 0, type: 'circle', top: 0, left: 50, colorIndex: 6, label: '1' },
    { id: 1, type: 'circle', top: 15, left: 20, colorIndex: 5, label: '2' },
    { id: 2, type: 'circle', top: 15, left: 80, colorIndex: 4, label: '3' },
    { id: 3, type: 'square', top: 30, left: 50, colorIndex: 6, label: '4' },
    { id: 4, type: 'circle', top: 45, left: 20, colorIndex: 2, label: '5' },
    { id: 5, type: 'circle', top: 45, left: 80, colorIndex: 3, label: '6' },
    { id: 6, type: 'square', top: 60, left: 50, colorIndex: 6, label: '7' },
    { id: 7, type: 'circle', top: 75, left: 20, colorIndex: 0, label: '8' },
    { id: 8, type: 'circle', top: 75, left: 80, colorIndex: 1, label: '9' },
    { id: 9, type: 'circle', top: 90, left: 50, colorIndex: 6, label: '10' },
    { id: 10, type: 'circle', top: 'calc(100% - 60px)', left: 50, colorIndex: 6, label: '11' },
  ];

  return (
    <div className="semi-formless-character">
      {onBack && (
        <button className="back-button" onClick={onBack}>
          Back
        </button>
      )}
      <div className="diagram">
        {nodes.map((n) => (
          <div
            key={n.id}
            className={`node ${n.type}`}
            style={{
              top: typeof n.top === 'number' ? `${n.top}%` : n.top,
              left: typeof n.left === 'number' ? `${n.left}%` : n.left,
              backgroundColor: colors[n.colorIndex % colors.length],
            }}
          >
            {n.label}
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

