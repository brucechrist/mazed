import React, { useState } from 'react';
import './note-modal.css';

export default function TrinityModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [form, setForm] = useState('');
  const [semiFormless, setSemiFormless] = useState('');
  const [formless, setFormless] = useState('');

  const handleSave = () => {
    onAdd({
      id: Date.now(),
      name: name || 'Untitled Trinity',
      notes,
      categories: {
        form,
        semiFormless,
        formless,
      },
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <input
          className="note-title"
          placeholder="Trinity name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Form"
          value={form}
          onChange={(e) => setForm(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Semi-formless"
          value={semiFormless}
          onChange={(e) => setSemiFormless(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Formless"
          value={formless}
          onChange={(e) => setFormless(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="actions">
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
