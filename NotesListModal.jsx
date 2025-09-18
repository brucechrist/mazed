import React, { useEffect, useMemo, useState } from 'react';
import './note-modal.css';

const NOTES_PER_PAGE = 9;
const TAG_FILTERS = ['ALL', 'II', 'IE', 'EI', 'EE'];
const TAG_COLORS = {
  ALL: '#38bdf8',
  II: '#f59e0b',
  IE: '#38bdf8',
  EI: '#34d399',
  EE: '#c084fc',
};

const VALID_NOTE_TAGS = new Set(TAG_FILTERS.slice(1));

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

const toPlainText = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  if (value == null) {
    return '';
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => toPlainText(item))
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  if (typeof value === 'object') {
    if (typeof value.text === 'string') {
      return value.text;
    }

    if (Array.isArray(value.ops)) {
      return value.ops
        .map((operation) => {
          const insert = operation?.insert;
          if (typeof insert === 'string') {
            return insert;
          }

          if (insert && typeof insert === 'object') {
            if (typeof insert.text === 'string') {
              return insert.text;
            }

            if (Array.isArray(insert)) {
              return toPlainText(insert);
            }
          }

          return '';
        })
        .join('');
    }

    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }

  return String(value);
};

const sanitiseTitle = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  if (value == null) {
    return '';
  }

  return String(value);
};

const resolveTimestamp = (note, fallbackBase, index) => {
  if (note.createdAt) {
    const fromStored = new Date(note.createdAt);
    if (!Number.isNaN(fromStored.getTime())) {
      return fromStored.toISOString();
    }
  }

  if (typeof note.id === 'number') {
    const fromId = new Date(note.id);
    if (!Number.isNaN(fromId.getTime())) {
      return fromId.toISOString();
    }
  }

  const fallback = new Date(fallbackBase + index);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toISOString();
  }

  return new Date().toISOString();
};

const normaliseEntry = (entry, fallbackBase, index) => {
  const base = entry && typeof entry === 'object' ? { ...entry } : { content: entry };
  let mutated = !entry || typeof entry !== 'object';

  if (base.id == null || base.id === '') {
    base.id = `note-${fallbackBase}-${index}`;
    mutated = true;
  }

  const safeTag = VALID_NOTE_TAGS.has(base.tag) ? base.tag : 'II';
  if (safeTag !== base.tag) {
    mutated = true;
  }

  const safeTitle = sanitiseTitle(base.title);
  if (safeTitle !== base.title) {
    mutated = true;
  }

  const safeContent = toPlainText(base.content);
  if (safeContent !== base.content) {
    mutated = true;
  }

  const createdAt = resolveTimestamp(base, fallbackBase, index);
  if (createdAt !== base.createdAt) {
    mutated = true;
  }

  const persistable = {
    ...base,
    id: base.id,
    tag: safeTag,
    title: safeTitle,
    content: safeContent,
    createdAt,
  };

  const display = {
    id: persistable.id,
    tag: persistable.tag,
    title: persistable.title,
    content: persistable.content,
    createdAt: persistable.createdAt,
  };

  return { persistable, display, mutated };
};

const sortByDateDesc = (first, second) => new Date(second.createdAt) - new Date(first.createdAt);

const formatTimestamp = (isoDate) => {
  if (!isoDate) {
    return 'Unknown date';
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear(),
    hour: '2-digit',
    minute: '2-digit',
  });
};

const previewContent = (content) => {
  if (!content) {
    return 'No additional context captured yet.';
  }
  const condensed = content.replace(/\s+/g, ' ').trim();
  if (condensed.length <= 140) {
    return condensed;
  }
  return `${condensed.slice(0, 137)}…`;
};

const countWords = (content) => {
  if (!content || !content.trim()) {
    return 0;
  }
  return content.trim().split(/\s+/).length;
};

const getTagColor = (tag) => TAG_COLORS[tag] || TAG_COLORS.ALL;

export default function NotesListModal({ onClose }) {
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const stored = loadStoredNotes();
    const fallbackBase = Date.now();
    const persistableNotes = [];
    const displayNotes = [];
    let shouldPersist = false;

    stored.forEach((entry, index) => {
      const { persistable, display, mutated } = normaliseEntry(entry, fallbackBase, index);
      persistableNotes.push(persistable);
      displayNotes.push(display);
      if (mutated) {
        shouldPersist = true;
      }
    });

    persistableNotes.sort(sortByDateDesc);
    displayNotes.sort(sortByDateDesc);

    setNotes(displayNotes);
    setSelectedId(displayNotes[0]?.id ?? null);

    if (shouldPersist) {
      try {
        localStorage.setItem('notes', JSON.stringify(persistableNotes));
      } catch (error) {
        console.warn('Failed to update stored notes', error);
      }
    }
  }, []);

  const filteredNotes = useMemo(() => {
    const trimmedSearch = searchTerm.trim().toLowerCase();
    let working = notes;

    if (tagFilter !== 'ALL') {
      working = working.filter((note) => note.tag === tagFilter);
    }

    if (trimmedSearch) {
      working = working.filter((note) => {
        const title = note.title ? note.title.toLowerCase() : '';
        const content = note.content ? note.content.toLowerCase() : '';
        return title.includes(trimmedSearch) || content.includes(trimmedSearch);
      });
    }

    const sorted = [...working];
    sorted.sort((first, second) => {
      const firstDate = new Date(first.createdAt);
      const secondDate = new Date(second.createdAt);
      return sortOrder === 'desc' ? secondDate - firstDate : firstDate - secondDate;
    });

    return sorted;
  }, [notes, searchTerm, tagFilter, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tagFilter, sortOrder]);

  const totalPages = filteredNotes.length ? Math.ceil(filteredNotes.length / NOTES_PER_PAGE) : 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * NOTES_PER_PAGE;
  const paginatedNotes = filteredNotes.slice(startIndex, startIndex + NOTES_PER_PAGE);
  const displayPage = filteredNotes.length ? activePage : 1;
  const displayTotalPages = filteredNotes.length ? totalPages : 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!filteredNotes.length) {
      if (selectedId !== null) {
        setSelectedId(null);
      }
      return;
    }

    const hasSelected = filteredNotes.some((note) => note.id === selectedId);
    if (!hasSelected) {
      const fallback = paginatedNotes[0] ?? filteredNotes[0];
      setSelectedId(fallback?.id ?? null);
    }
  }, [filteredNotes, paginatedNotes, selectedId]);

  const selectedNote = useMemo(
    () => filteredNotes.find((note) => note.id === selectedId) ?? null,
    [filteredNotes, selectedId],
  );

  const selectedWordCount = selectedNote ? countWords(selectedNote.content) : 0;
  const filtersActive = searchTerm || tagFilter !== 'ALL' || sortOrder !== 'desc';

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleToggleSort = () => {
    setSortOrder((previous) => (previous === 'desc' ? 'asc' : 'desc'));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTagFilter('ALL');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal notes-modal notes-list-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-library-title"
      >
        <header className="notes-header">
          <div>
            <h3 id="notes-library-title">Notes library</h3>
            <p className="notes-subtitle">
              {filteredNotes.length} {filteredNotes.length === 1 ? 'entry' : 'entries'} · {notes.length} total saved
            </p>
          </div>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close notes library"
          >
            &times;
          </button>
        </header>

        <div className="notes-controls">
          <div className="notes-search">
            <span className="notes-search__icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search notes by title or keywords"
              aria-label="Search notes"
            />
            {searchTerm && (
              <button
                type="button"
                className="ghost-button ghost-button--compact"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          <div className="notes-filters">
            <div className="notes-filter">
              <span>Quadrant</span>
              <div className="tag-options tag-options--filters">
                {TAG_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    data-tag={filter}
                    className={`tag-chip ${tagFilter === filter ? 'is-active' : ''}`}
                    style={{ '--tag-color': getTagColor(filter) }}
                    onClick={() => setTagFilter(filter)}
                    aria-pressed={tagFilter === filter}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="notes-filter">
              <span>Sort</span>
              <button type="button" className="toolbar-button" onClick={handleToggleSort}>
                {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
              </button>
            </div>
          </div>
        </div>

        <div className="notes-body">
          <div className="notes-grid" aria-live="polite">
            {paginatedNotes.length === 0 ? (
              <div className="notes-empty">
                <h4>No notes match your filters</h4>
                <p>Try adjusting your search or quadrant filters to see more results.</p>
                {filtersActive && (
                  <button type="button" className="ghost-button" onClick={handleResetFilters}>
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              paginatedNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className={`notes-card ${selectedId === note.id ? 'is-selected' : ''}`}
                  style={{ '--tag-color': getTagColor(note.tag) }}
                  onClick={() => setSelectedId(note.id)}
                  aria-pressed={selectedId === note.id}
                >
                  <div className="notes-card__header">
                    <span className="note-card__tag" data-tag={note.tag}>
                      {note.tag}
                    </span>
                    <span className="notes-card__date">{formatTimestamp(note.createdAt)}</span>
                  </div>
                  <h4 className="notes-card__title" title={note.title}>
                    {note.title || 'Untitled note'}
                  </h4>
                  <p className="notes-card__preview">{previewContent(note.content)}</p>
                </button>
              ))
            )}
          </div>

          <div className="notes-detail" aria-live="polite">
            {selectedNote ? (
              <React.Fragment>
                <div className="notes-detail__header">
                  <span className="note-card__tag" data-tag={selectedNote.tag}>
                    {selectedNote.tag}
                  </span>
                  <span className="notes-detail__date">{formatTimestamp(selectedNote.createdAt)}</span>
                  <span className="notes-detail__meta">
                    {selectedWordCount} {selectedWordCount === 1 ? 'word' : 'words'}
                  </span>
                </div>
                <h4 className="notes-detail__title">{selectedNote.title || 'Untitled note'}</h4>
                <pre className="note-view-content">
                  {selectedNote.content || 'No additional context captured yet.'}
                </pre>
              </React.Fragment>
            ) : (
              <div className="notes-empty-detail">
                <h4>Select a note to read it</h4>
                <p>Your detailed view will appear here once you choose a note on the left.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="notes-footer">
          <div className="notes-pagination">
            <button
              type="button"
              className="ghost-button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={activePage <= 1}
            >
              Previous
            </button>
            <span>
              Page {displayPage} of {displayTotalPages}
            </span>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={activePage >= totalPages || !filteredNotes.length}
            >
              Next
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
