import React, { useEffect, useRef, useState } from 'react';
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
  const [imageData, setImageData] = useState(null);
  const [imageName, setImageName] = useState('');
  const [imageError, setImageError] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);

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
    const timestamp = new Date().toISOString();

    const newNote = {
      id: Date.now(),
      title: trimmedTitle || 'Untitled',
      content: trimmedContent,
      tag,
      createdAt: timestamp,
      updatedAt: timestamp,
      image: imageData,
    };

    const updatedNotes = [...notes, newNote];
    localStorage.setItem('notes', JSON.stringify(updatedNotes));

    setTitle('');
    setContent('');
    setTag(TAGS[0]);
    setImageData(null);
    setImageName('');
    setImageError(null);
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

  const handleImageChange = (event, droppedFile = null) => {
    const input = event?.target || null;
    const file = droppedFile || (input?.files && input.files[0]);
    if (!file) {
      setImageError(null);
      return;
    }

    if (file.type && !file.type.startsWith('image/')) {
      setImageError('Please choose an image file (JPG, PNG, GIF, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setImageData(result);
      setImageName(file.name);
      setImageError(null);
      if (input) {
        input.value = '';
      }
    };
    reader.onerror = () => {
      setImageError('Failed to read the selected image. Please try again.');
      if (input) {
        input.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageData(null);
    setImageName('');
    setImageError(null);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current += 1;
    setIsDraggingFile(true);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setIsDraggingFile(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDraggingFile(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);
    const file = event.dataTransfer?.files && event.dataTransfer.files[0];
    if (file) {
      handleImageChange(null, file);
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
          <div
            className={`note-editor__composer ${isDraggingFile ? 'is-dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              className="note-title note-composer__title"
              placeholder="Add a bold title..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <textarea
              className="note-content note-composer__content"
              placeholder="Share the story, the feeling, the next mission..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </div>

          <label className="form-field note-image-field">
            <span>Image (optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="note-image-input"
            />
            {imageError ? <p className="note-image-error">{imageError}</p> : null}
            {imageData ? (
              <div className="note-image-preview">
                <img src={imageData} alt="Selected attachment" loading="lazy" />
                <div className="note-image-preview__meta">
                  <span>{imageName || 'Attached image'}</span>
                  <button type="button" className="ghost-button" onClick={handleRemoveImage}>
                    Remove image
                  </button>
                </div>
              </div>
            ) : (
              <p className="note-image-hint">
                Add a reference photo or sketch to bring the note to life.
              </p>
            )}
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
