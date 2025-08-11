import React from 'react';
import './level-rating.css';

export const RARITY_LEVELS = [
  { key: 'transcendent', label: 'Transcendent', color: '#e6e6fa', textColor: '#000' },
  { key: 'rainbow', label: 'Rainbow', color: 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)', textColor: '#000' },
  { key: 'jackpot', label: 'Jackpot', color: '#ff1493', textColor: '#000' },
  { key: 'white', label: 'White', color: '#ffffff', textColor: '#000' },
  { key: 'golden', label: 'Golden', color: '#ffd700', textColor: '#000' },
  { key: 'blue', label: 'Blue', color: '#1e90ff', textColor: '#fff' },
  { key: 'green', label: 'Green', color: '#32cd32', textColor: '#000' },
  { key: 'yellow', label: 'Yellow', color: '#ffff00', textColor: '#000' },
  { key: 'red', label: 'Red', color: '#ff4500', textColor: '#fff' },
  { key: 'purple', label: 'Purple', color: '#800080', textColor: '#fff' },
  { key: 'dark', label: 'Dark', color: '#2f4f4f', textColor: '#fff' },
  { key: 'buglight', label: 'Buglight', color: 'linear-gradient(45deg, #00ffff, #ff00ff)', textColor: '#000' },
  { key: 'darkskull', label: 'Dark (Skull)', color: '#000000', textColor: '#fff' },
  { key: 'black', label: 'Black', color: '#000000', textColor: '#fff' },
  { key: 'doom', label: 'Doom', color: '#000000', textColor: '#ff0000' },
];

export default function LevelRating({ value, onChange, readOnly = false }) {
  if (readOnly) {
    const r = RARITY_LEVELS.find((lvl) => lvl.key === value);
    if (!r) return null;
    return (
      <div className="level-rating readonly">
        <div
          className="level-option selected"
          style={{ background: r.color, color: r.textColor }}
        >
          {r.label}
        </div>
      </div>
    );
  }

  return (
    <div className="level-rating">
      {RARITY_LEVELS.map((r) => (
        <div
          key={r.key}
          className={`level-option ${value === r.key ? 'selected' : ''}`}
          style={{ background: r.color, color: r.textColor }}
          onClick={() => onChange(r.key)}
        >
          {r.label}
        </div>
      ))}
    </div>
  );
}
