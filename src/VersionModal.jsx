import React, { useState } from 'react';
import './note-modal.css';

export default function VersionModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState('');
  const [liked, setLiked] = useState(false);
  const [ii, setII] = useState('');
  const [ie, setIE] = useState('');
  const [ei, setEI] = useState('');
  const [ee, setEE] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onAdd({
      id: Date.now(),
      name: name || 'Unnamed',
      rating: parseInt(rating, 10) || 0,
      liked,
      quadrants: { II: ii, IE: ie, EI: ei, EE: ee },
      notes,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <input
          className="note-title"
          placeholder="Version name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="note-title"
          type="number"
          placeholder="Rating"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="checkbox"
            checked={liked}
            onChange={(e) => setLiked(e.target.checked)}
          />
          Like
        </label>
        <textarea
          className="note-content"
          placeholder="Quadrant II notes"
          value={ii}
          onChange={(e) => setII(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Quadrant IE notes"
          value={ie}
          onChange={(e) => setIE(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Quadrant EI notes"
          value={ei}
          onChange={(e) => setEI(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Quadrant EE notes"
          value={ee}
          onChange={(e) => setEE(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Extra notes"
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
