import React, { useEffect, useState } from 'react';
import './note-modal.css';

const TAGS = ['II', 'IE', 'EI', 'EE', 'form', 'semi-formless', 'formless'];
const TAG_COLORS = {
  II: '#f59e0b',
  IE: '#38bdf8',
  EI: '#34d399',
  EE: '#c084fc',
  form: '#fb923c',
  'semi-formless': '#f472b6',
  formless: '#60a5fa',
};

const loadStoredNotes = () => {
  try {
    const raw = localStorage.getItem('notes');
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (parsed && Array.isArray(parsed.notes)) {
      return parsed.notes;
    }
  } catch (error) {
    console.warn('Failed to parse stored notes', error);
  }

  return [];
};

export default function NoteModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState(TAGS[0]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__noteEditorOpenCount = (window.__noteEditorOpenCount || 0) + 1;
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.__noteEditorOpenCount = Math.max(
          0,
          (window.__noteEditorOpenCount || 1) - 1,
        );
        if ((window.__noteEditorOpenCount || 0) <= 0) {
          delete window.__noteEditorOpenCount;
        }
      }
    };
  }, []);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const notes = loadStoredNotes();

    const newNote = {
      id: Date.now(),
      title: trimmedTitle || 'Untitled',
      content: trimmedContent,
      tag,
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [...notes, newNote];
    localStorage.setItem('notes', JSON.stringify(updatedNotes));

    setTitle('');
    setContent('');
    setTag(TAGS[0]);
    onClose();
  };

  const handleEditorKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      const tagName = event.target?.tagName?.toLowerCase();
      if (tagName === 'textarea' || tagName === 'input') {
        event.preventDefault();
        handleSave();
      }
    }
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal notes-modal note-editor-modal"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleEditorKeyDown}
      >
        <header className="note-editor__header">
          <div>
            <h3>Capture a new note</h3>
            <p className="note-editor__subtitle">
              Give it a clear intention and choose the quadrant so it remains easy to
              find when you revisit your reflections.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close note editor"
          >
            &times;
          </button>
        </header>

        <div className="note-editor__fields">
          <label className="form-field">
            <span>Title</span>
            <input
              className="note-title"
              placeholder="Add a descriptive title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Notes</span>
            <textarea
              className="note-content"
              placeholder="Capture the insight, context, and any next steps..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </label>
        </div>

        <div className="note-editor__footer">
          <div className="form-field form-field--inline">
            <span>Quadrant</span>
            <div className="tag-options">
              {TAGS.map((option) => (
                <button
                  key={option}
                  type="button"
                  data-tag={option}
                  className={`tag-chip ${tag === option ? 'is-active' : ''}`}
                  style={{ '--tag-color': TAG_COLORS[option] }}
                  onClick={() => setTag(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="note-editor__actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="primary-button" onClick={handleSave}>
              Save note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
