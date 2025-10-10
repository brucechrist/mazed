import React, { useEffect, useMemo, useState } from 'react';
import './note-modal.css';

const VIEWPORT_FALLBACK = { width: 1440, height: 900 };
const MODAL_ASPECT_RATIO = 16 / 9;
const MAX_MODAL_WIDTH = 1840;
const MAX_MODAL_HEIGHT = MAX_MODAL_WIDTH / MODAL_ASPECT_RATIO;
const MIN_MODAL_WIDTH = 960;
const MIN_MODAL_HEIGHT = MIN_MODAL_WIDTH / MODAL_ASPECT_RATIO;
const HORIZONTAL_MARGIN = 64;
const VERTICAL_MARGIN = 64;

const readViewportSize = () => {
  if (typeof window === 'undefined') {
    return VIEWPORT_FALLBACK;
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

const clampDimension = (value, margin, minimum, maximum) => {
  const safeMinimum = Math.min(minimum, value);
  const safeMaximum = Math.min(maximum, value);
  const reducedValue = value - margin;

  if (safeMaximum <= 0) {
    return 0;
  }

  const expanded = Math.max(reducedValue, safeMinimum);
  return Math.min(Math.max(expanded, 0), safeMaximum);
};

const computeModalDimensions = (viewport) => {
  const baseWidth = viewport?.width ?? VIEWPORT_FALLBACK.width;
  const baseHeight = viewport?.height ?? VIEWPORT_FALLBACK.height;

  const maxWidth = clampDimension(baseWidth, HORIZONTAL_MARGIN, MIN_MODAL_WIDTH, MAX_MODAL_WIDTH);
  const maxHeight = clampDimension(baseHeight, VERTICAL_MARGIN, MIN_MODAL_HEIGHT, MAX_MODAL_HEIGHT);

  const hasSpace = maxWidth > 0 && maxHeight > 0;
  const referenceWidth = hasSpace
    ? maxWidth
    : Math.min(VIEWPORT_FALLBACK.width - HORIZONTAL_MARGIN, MAX_MODAL_WIDTH);
  const referenceHeight = hasSpace
    ? maxHeight
    : Math.min(VIEWPORT_FALLBACK.height - VERTICAL_MARGIN, MAX_MODAL_HEIGHT);

  if (!referenceWidth || !referenceHeight) {
    return {
      width: MIN_MODAL_WIDTH,
      height: MIN_MODAL_HEIGHT,
      maxWidth: MIN_MODAL_WIDTH,
      maxHeight: MIN_MODAL_HEIGHT,
    };
  }

  const widthBasedOnHeight = referenceHeight * MODAL_ASPECT_RATIO;

  if (widthBasedOnHeight <= referenceWidth) {
    return {
      width: widthBasedOnHeight,
      height: referenceHeight,
      maxWidth,
      maxHeight,
    };
  }

  const heightBasedOnWidth = referenceWidth / MODAL_ASPECT_RATIO;

  return {
    width: referenceWidth,
    height: heightBasedOnWidth,
    maxWidth,
    maxHeight,
  };
};

const QUADRANT_TAGS = ['II', 'IE', 'EI', 'EE', 'form', 'semi-formless', 'formless'];
const TAG_OPTIONS = ['ALL', ...QUADRANT_TAGS];
const TAG_COLORS = {
  ALL: '#38bdf8',
  II: '#f59e0b',
  IE: '#38bdf8',
  EI: '#34d399',
  EE: '#c084fc',
  form: '#fb923c',
  'semi-formless': '#f472b6',
  formless: '#60a5fa',
};

const getLocalStorage = () => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const isPlainObject = (value) => value != null && typeof value === 'object' && !Array.isArray(value);

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const parseDate = (value) => {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }

    const dateFromNumber = new Date(value);
    return isValidDate(dateFromNumber) ? dateFromNumber : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const dateFromString = new Date(trimmed);
    if (isValidDate(dateFromString)) {
      return dateFromString;
    }

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      const dateFromNumeric = new Date(numeric);
      if (isValidDate(dateFromNumeric)) {
        return dateFromNumeric;
      }
    }

    return null;
  }

  if (typeof value === 'bigint') {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return null;
    }

    const dateFromBigInt = new Date(numeric);
    return isValidDate(dateFromBigInt) ? dateFromBigInt : null;
  }

  if (isPlainObject(value)) {
    if (typeof value.toDate === 'function') {
      try {
        const dateFromMethod = parseDate(value.toDate());
        if (dateFromMethod) {
          return dateFromMethod;
        }
      } catch {
        // ignore conversion failures from custom toDate implementations
      }
    }

    const secondsSource =
      value.seconds ?? value._seconds ?? value.epochSeconds ?? value.value ?? null;
    if (secondsSource != null) {
      const seconds = Number(secondsSource);
      if (Number.isFinite(seconds)) {
        let milliseconds = seconds * 1000;

        const nanosSource = value.nanoseconds ?? value._nanoseconds ?? value.nanos ?? 0;
        const nanos = Number(nanosSource);
        if (Number.isFinite(nanos)) {
          milliseconds += Math.floor(nanos / 1e6);
        }

        const dateFromSeconds = new Date(milliseconds);
        if (isValidDate(dateFromSeconds)) {
          return dateFromSeconds;
        }
      }
    }

    if (typeof value.valueOf === 'function') {
      const primitive = value.valueOf();
      if (primitive !== value) {
        const fromPrimitive = parseDate(primitive);
        if (fromPrimitive) {
          return fromPrimitive;
        }
      }
    }
  }

  return null;
};

const formatDateTime = (date) => {
  if (!isValidDate(date)) {
    return 'Unknown date';
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toISOString();
  }
};

const toText = (value) => {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).filter(Boolean).join('\n');
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  return '';
};

const createPreview = (content) => {
  const trimmed = content.replace(/\s+/g, ' ').trim();
  if (!trimmed) {
    return 'No additional context yet.';
  }

  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed;
};

const normaliseNote = (entry, index) => {
  if (typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean' || typeof entry === 'bigint') {
    const text = toText(entry).trim();
    if (!text) {
      return null;
    }

    const createdAt = new Date(0);

    return {
      id: `note-${index}`,
      referenceId: null,
      title: text.slice(0, 60) || 'Untitled note',
      content: text,
      tag: 'II',
      createdAt,
      createdAtLabel: formatDateTime(createdAt),
      updatedAtLabel: null,
      preview: createPreview(text),
      searchable: text.toLowerCase(),
      sortKey: createdAt.getTime(),
      wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0,
      characterCount: text.length,
    };
  }

  if (!isPlainObject(entry)) {
    return null;
  }

  let referenceId = null;
  const idSource =
    entry.id ?? entry.noteId ?? entry.uuid ?? entry.key ?? entry.identifier ?? entry.note_id;
  if (typeof idSource === 'string' && idSource.trim()) {
    referenceId = idSource.trim();
  } else if (typeof idSource === 'number' && Number.isFinite(idSource)) {
    referenceId = String(idSource);
  } else if (typeof idSource === 'bigint') {
    referenceId = idSource.toString();
  }

  const baseId = referenceId ? `${referenceId}-${index}` : `note-${index}`;

  const rawTitle = toText(entry.title ?? entry.name ?? entry.heading ?? '');
  const rawContent = toText(entry.content ?? entry.body ?? entry.note ?? entry.text ?? '');
  const content = rawContent;
  const titleFromContent = content.split(/\n/).find((line) => line.trim()) || '';
  const title = rawTitle.trim() || titleFromContent.trim() || 'Untitled note';

  const tagCandidate = toText(entry.tag ?? entry.quadrant ?? entry.category ?? '').trim().toUpperCase();
  const tag = QUADRANT_TAGS.includes(tagCandidate) ? tagCandidate : 'II';

  const createdAtSource =
    entry.createdAt ??
    entry.created_at ??
    entry.created ??
    entry.date ??
    entry.timestamp ??
    entry.time ??
    entry.inserted_at ??
    entry.savedAt ??
    null;
  const createdAt = parseDate(createdAtSource) ?? new Date(0);
  const sortKey = isValidDate(createdAt) ? createdAt.getTime() : 0;

  const updatedAtSource =
    entry.updatedAt ?? entry.updated_at ?? entry.modifiedAt ?? entry.editedAt ?? entry.lastUpdated;
  const updatedAt = parseDate(updatedAtSource);

  const preview = createPreview(content);
  const searchable = `${title} ${content} ${tag}`.toLowerCase();
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return {
    id: baseId,
    referenceId,
    title,
    content,
    tag,
    createdAt,
    createdAtLabel: formatDateTime(createdAt),
    updatedAtLabel: updatedAt ? formatDateTime(updatedAt) : null,
    preview,
    searchable,
    sortKey,
    wordCount,
    characterCount: content.length,
  };
};

const loadStoredNotes = () => {
  const storage = getLocalStorage();
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem('notes');
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    const source = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.notes)
      ? parsed.notes
      : [];

    const normalised = source
      .map((entry, index) => normaliseNote(entry, index))
      .filter(Boolean)
      .map((note, index) => ({
        ...note,
        id: `${note.id}-${index}`,
        sortKey: Number.isFinite(note.sortKey) ? note.sortKey : 0,
      }));

    normalised.sort((a, b) => {
      if (b.sortKey !== a.sortKey) {
        return b.sortKey - a.sortKey;
      }

      return a.title.localeCompare(b.title);
    });

    return normalised;
  } catch (error) {
    console.warn('Failed to load notes from storage', error);
    return [];
  }
};

const pluralise = (count, singular, plural) => (count === 1 ? singular : plural);

export default function NotesListModal({ onClose }) {
  const [viewportSize, setViewportSize] = useState(() => readViewportSize());
  const [notes, setNotes] = useState(() => loadStoredNotes());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState('ALL');
  const [selectedId, setSelectedId] = useState(null);
  const modalDimensions = useMemo(() => computeModalDimensions(viewportSize), [viewportSize]);
  const modalStyle = useMemo(() => {
    if (!modalDimensions) {
      return undefined;
    }

    return {
      width: `${modalDimensions.width}px`,
      height: `${modalDimensions.height}px`,
      maxWidth: `${modalDimensions.maxWidth}px`,
      maxHeight: `${modalDimensions.maxHeight}px`,
    };
  }, [modalDimensions]);

  const filteredNotes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesTag = activeTag === 'ALL' || note.tag === activeTag;
      if (!matchesTag) {
        return false;
      }

      if (!query) {
        return true;
      }

      return note.searchable.includes(query);
    });
  }, [notes, activeTag, searchTerm]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      setViewportSize(readViewportSize());
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (filteredNotes.length === 0) {
      setSelectedId(null);
      return;
    }

    setSelectedId((currentId) => {
      if (currentId && filteredNotes.some((note) => note.id === currentId)) {
        return currentId;
      }

      return filteredNotes[0].id;
    });
  }, [filteredNotes]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStorage = (event) => {
      if (event.key === 'notes') {
        setNotes(loadStoredNotes());
      }
    };

    const handleFocus = () => {
      setNotes(loadStoredNotes());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const tagCounts = useMemo(() => {
    const counts = { ALL: notes.length };
    QUADRANT_TAGS.forEach((tag) => {
      counts[tag] = 0;
    });

    notes.forEach((note) => {
      counts[note.tag] = (counts[note.tag] ?? 0) + 1;
    });

    return counts;
  }, [notes]);

  const selectedNote = filteredNotes.find((note) => note.id === selectedId) ?? null;

  const subtitle = useMemo(() => {
    if (notes.length === 0) {
      return 'You have not captured any notes yet. Write a reflection from the Fifth to see it here.';
    }

    if (filteredNotes.length === 0) {
      return 'No notes match your filters. Clear the search or pick a different quadrant to continue.';
    }

    if (activeTag === 'ALL' && !searchTerm.trim() && filteredNotes.length === notes.length) {
      return `Browsing all ${notes.length} saved ${pluralise(notes.length, 'note', 'notes')}.`;
    }

    return `Showing ${filteredNotes.length} of ${notes.length} saved ${pluralise(notes.length, 'note', 'notes')}.`;
  }, [notes, filteredNotes, activeTag, searchTerm]);

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && typeof onClose === 'function') {
      onClose();
    }
  };

  const handleRefresh = () => {
    setNotes(loadStoredNotes());
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal notes-modal notes-list-modal"
        onClick={(event) => event.stopPropagation()}
        style={modalStyle}
      >
        <header className="notes-header">
          <div>
            <h3>Your notes library</h3>
            <p className="notes-subtitle">{subtitle}</p>
          </div>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close notes list"
          >
            &times;
          </button>
        </header>

        <div className="notes-controls">
          <label className="notes-search">
            <span className="notes-search__icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              placeholder="Search notes by title, content, or quadrant"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <div className="notes-filters">
            <div className="notes-filter">
              <span>Quadrant</span>
              <div className="tag-options">
                {TAG_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    data-tag={option}
                    className={`tag-chip ${activeTag === option ? 'is-active' : ''}`}
                    style={{ '--tag-color': TAG_COLORS[option] }}
                    onClick={() => setActiveTag(option)}
                  >
                    {option}
                    <span aria-hidden="true"> ({tagCounts[option] ?? 0})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="notes-body">
          <div className="notes-grid">
            {filteredNotes.length === 0 ? (
              <div className="notes-empty">
                <h4>No notes to show</h4>
                <p>Try clearing the search or selecting a different quadrant to continue browsing.</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className={`notes-card ${selectedId === note.id ? 'is-selected' : ''}`}
                  style={{ '--tag-color': TAG_COLORS[note.tag] }}
                  onClick={() => setSelectedId(note.id)}
                >
                  <div className="notes-card__header">
                    <span className="note-card__tag" data-tag={note.tag}>
                      {note.tag}
                    </span>
                    <span className="notes-card__date">{note.createdAtLabel}</span>
                  </div>
                  <h4 className="notes-card__title">{note.title}</h4>
                  <p className="notes-card__preview">{note.preview}</p>
                </button>
              ))
            )}
          </div>

          <aside className="notes-detail">
            {selectedNote ? (
              <>
                <div className="notes-detail__header">
                  <span className="note-card__tag" data-tag={selectedNote.tag}>
                    {selectedNote.tag}
                  </span>
                  <div className="notes-detail__meta">
                    <span>Created {selectedNote.createdAtLabel}</span>
                    {selectedNote.updatedAtLabel ? (
                      <span>Updated {selectedNote.updatedAtLabel}</span>
                    ) : null}
                    <span>
                      {selectedNote.wordCount}{' '}
                      {pluralise(selectedNote.wordCount, 'word', 'words')}
                    </span>
                    <span>{selectedNote.characterCount} characters</span>
                    {selectedNote.referenceId ? (
                      <span>Ref. {selectedNote.referenceId}</span>
                    ) : null}
                  </div>
                </div>
                <h4 className="notes-detail__title">{selectedNote.title}</h4>
                <div className="note-view-content">
                  {selectedNote.content ? selectedNote.content : 'No additional context yet.'}
                </div>
              </>
            ) : (
              <div className="notes-empty-detail">
                <h4>{notes.length === 0 ? 'No saved notes yet' : 'Select a note to read it'}</h4>
                <p>
                  {notes.length === 0
                    ? 'Capture your reflections from the Fifth quadrant to build your personal library.'
                    : 'Choose any note from the list to explore its full content.'}
                </p>
              </div>
            )}
          </aside>
        </div>

        <footer className="notes-footer">
          <div className="notes-pagination">
            <span>
              {notes.length === 0
                ? 'No notes stored'
                : filteredNotes.length === notes.length && activeTag === 'ALL' && !searchTerm.trim()
                ? `${notes.length} ${pluralise(notes.length, 'note', 'notes')}`
                : `${filteredNotes.length} of ${notes.length} notes`}
            </span>
            <button
              type="button"
              className="ghost-button ghost-button--compact"
              onClick={handleRefresh}
            >
              Refresh
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

