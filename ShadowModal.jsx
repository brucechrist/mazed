import React, { useState } from 'react';
import './shadow-modal.css';

export default function ShadowModal({ categories, onAdd, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState(categories[0]);

  const handleSave = () => {
    onAdd(category, {
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
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <div className="actions">
          <button className="save-button" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
