import React, { useState, useEffect } from 'react';
import './note-modal.css';

export default function NotesListModal({ onClose }) {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('notes') || '[]');
    setNotes(stored);
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {selected ? (
          <>
            <h3>{selected.title} [{selected.tag}]</h3>
            <pre className="note-view-content">{selected.content}</pre>
            <div className="actions">
              <button className="save-button" onClick={() => setSelected(null)}>
                Back
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>Saved Notes</h3>
            <ul className="notes-list">
              {notes.map(note => (
                <li key={note.id}>
                  <button className="note-line" onClick={() => setSelected(note)}>
                    {note.title} [{note.tag}]
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
