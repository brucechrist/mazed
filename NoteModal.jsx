import React, { useState } from 'react';
import './note-modal.css';

export default function NoteModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('II');

  const saveNote = () => {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push({ id: Date.now(), title: title || 'Untitled', content, tag });
    localStorage.setItem('notes', JSON.stringify(notes));
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <input
          className="note-title"
          placeholder="Add a new note"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Type your note here..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <select
          className="note-tag"
          value={tag}
          onChange={e => setTag(e.target.value)}
        >
          <option value="II">II</option>
          <option value="IE">IE</option>
          <option value="EI">EI</option>
          <option value="EE">EE</option>
        </select>
        <div className="actions">
          <button className="save-button" onClick={saveNote}>Save</button>
        </div>
      </div>
    </div>
  );
}
