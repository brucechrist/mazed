import React, { useState } from 'react';
import './shadow-modal.css';

export default function ShadowModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onAdd({
      id: Date.now(),
      name: name || 'Unnamed',
      description,
      notes,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <input
          className="note-title"
          placeholder="Shadow name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
