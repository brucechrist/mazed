import React, { useState } from 'react';
import './note-modal.css';

export default function QuadrantCombModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [ii, setII] = useState('');
  const [ie, setIE] = useState('');
  const [ei, setEI] = useState('');
  const [ee, setEE] = useState('');

  const handleSave = () => {
    onAdd({
      id: Date.now(),
      name: name || 'Unnamed',
      notes,
      quadrants: { II: ii, IE: ie, EI: ei, EE: ee },
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <input
          className="note-title"
          placeholder="Combinaison name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Quadrant II"
          value={ii}
          onChange={(e) => setII(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Quadrant IE"
          value={ie}
          onChange={(e) => setIE(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Quadrant EI"
          value={ei}
          onChange={(e) => setEI(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Quadrant EE"
          value={ee}
          onChange={(e) => setEE(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="actions">
          <button className="save-button" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
