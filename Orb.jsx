import React, { useState } from 'react';
import './orb.css';

const zones = [
  { id: 'typomancy', label: 'Typomancy' },
  { id: 'decoupe', label: 'Découpe' },
  { id: 'aspect', label: 'Aspect Builder' },
  { id: 'fear', label: 'Fear List' },
  { id: 'character', label: 'Character Sheet' },
  { id: 'healing', label: 'Healing Rituals' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'lore', label: 'Lore / Memory' }
];

export default function Orb({ onBack }) {
  const [text, setText] = useState('');
  const [drops, setDrops] = useState({});

  const handleDragStart = (e) => {
    const target = e.target;
    const selection = target.value.substring(target.selectionStart, target.selectionEnd);
    e.dataTransfer.setData('text/plain', selection);
  };

  const allowDrop = (e) => {
    e.preventDefault();
  };

  const handleDrop = (zone) => (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data) {
      setDrops((prev) => ({ ...prev, [zone]: data }));
    }
  };

  return (
    <div>
      {onBack && (
        <button className="back-button" onClick={onBack}>Back</button>
      )}
      <div className="orb-container">
      <textarea
        className="orb-center"
        value={text}
        onChange={(e) => setText(e.target.value)}
        draggable
        onDragStart={handleDragStart}
        placeholder="Type or paste text here..."
      />
      {zones.map((z) => (
        <div
          key={z.id}
          className={`zone ${z.id}`}
          onDragOver={allowDrop}
          onDrop={handleDrop(z.id)}
        >
          <span>{z.label}</span>
          {drops[z.id] && <p className="drop-text">{drops[z.id]}</p>}
        </div>
      ))}
      </div>
    </div>
  );
}
