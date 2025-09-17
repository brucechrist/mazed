import React, { useState, useEffect } from 'react';
import './note-modal.css';

const DEFAULT_NOTES = [];

function readStoredNotes() {
  try {
    const stored = localStorage.getItem('notes');

    if (!stored) {
      return DEFAULT_NOTES;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return DEFAULT_NOTES;
    }

    return parsed;
  } catch (error) {
    console.warn('Unable to read stored notes – resetting list', error);
    return DEFAULT_NOTES;
  }
}

function normaliseNote(entry, index) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const id = entry.id || `note-${index}`;
  const createdAt = entry.createdAt ?? entry.created_at ?? null;

  return {
    id,
    title: typeof entry.title === 'string' ? entry.title : 'Untitled note',
    tag: typeof entry.tag === 'string' ? entry.tag : 'general',
    content: typeof entry.content === 'string' ? entry.content : '',
    createdAt,
  };
}

function sanitiseNotes(rawNotes) {
  const normalised = rawNotes
    .map((note, index) => normaliseNote(note, index))
    .filter(Boolean);

  localStorage.setItem('notes', JSON.stringify(normalised));

  return normalised;
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return 'Unknown date';
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return formatter
    .formatToParts(date)
    .map(part => (part.type === 'year' ? String(date.getFullYear()) : part.value))
    .join('');
}

export default function NotesListModal({ onClose }) {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const stored = readStoredNotes();
    const safeNotes = sanitiseNotes(stored);

    setNotes(safeNotes);
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {selected ? (
          <>
            <h3>
              {selected.title} [{selected.tag}]
            </h3>
            <pre className="note-view-content">{selected.content}</pre>
            {selected.createdAt ? (
              <p className="note-meta">Created {formatTimestamp(selected.createdAt)}</p>
            ) : null}
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
                    <span className="note-line-main">
                      {note.title} [{note.tag}]
                    </span>
                    {note.createdAt ? (
                      <span className="note-line-meta">{formatTimestamp(note.createdAt)}</span>
                    ) : null}
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
