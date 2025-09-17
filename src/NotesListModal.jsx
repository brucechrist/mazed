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

const VALID_NOTE_TAGS = TAG_FILTERS.slice(1);

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

const sanitiseTag = (value) =>
  typeof value === 'string' && VALID_NOTE_TAGS.includes(value) ? value : 'II';

const sortByDateDesc = (first, second) =>
  new Date(second.createdAt) - new Date(first.createdAt);

const getTagColor = (tag) => TAG_COLORS[tag] || TAG_COLORS.ALL;

const normaliseTimestamp = (note) => {
  if (note.createdAt) {
    return { ...note, createdAt: note.createdAt };
  }

  if (typeof note.id === 'number') {
    const derivedDate = new Date(note.id);
    if (!Number.isNaN(derivedDate.getTime())) {
      return { ...note, createdAt: derivedDate.toISOString() };
    }
  }

  return { ...note, createdAt: new Date().toISOString() };
};

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
    let needsPersist = false;
    const persistableNotes = [];
    const displayNotes = [];

    stored.forEach((item, index) => {
      const base =
        item && typeof item === 'object' ? { ...item } : { content: item };

      if (!item || typeof item !== 'object') {
        needsPersist = true;
      }

      if (base.id == null) {
        base.id = `note-${fallbackBase}-${index}`;
        needsPersist = true;
      }

      const withDate = normaliseTimestamp(base);
      if (withDate.createdAt !== base.createdAt) {
        needsPersist = true;
      }

      const safeTag = sanitiseTag(base.tag);
      if (safeTag !== base.tag) {
        needsPersist = true;
      }

      const storageNote = {
        ...base,
        tag: safeTag,
        createdAt: withDate.createdAt,
      };

      persistableNotes.push(storageNote);

      displayNotes.push({
        ...storageNote,
        title: sanitiseTitle(storageNote.title),
        content: toPlainText(storageNote.content),
      });
    });

    displayNotes.sort(sortByDateDesc);
    setNotes(displayNotes);
    setSelectedId(displayNotes[0]?.id ?? null);

    if (needsPersist) {
      persistableNotes.sort(sortByDateDesc);
      localStorage.setItem('notes', JSON.stringify(persistableNotes));
    }
  }, []);

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    if (tagFilter !== 'ALL') {
      result = result.filter((note) => note.tag === tagFilter);
    }

    if (searchTerm.trim()) {
      const lowered = searchTerm.trim().toLowerCase();
      result = result.filter((note) => {
        const title = note.title ? note.title.toLowerCase() : '';
        const content = note.content ? note.content.toLowerCase() : '';
        return title.includes(lowered) || content.includes(lowered);
      });
    }

    result.sort((a, b) => {
      const first = new Date(a.createdAt);
      const second = new Date(b.createdAt);
      return sortOrder === 'desc' ? second - first : first - second;
    });

    return result;
  }, [notes, searchTerm, tagFilter, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tagFilter, sortOrder]);

  const totalPages = filteredNotes.length ? Math.ceil(filteredNotes.length / NOTES_PER_PAGE) : 1;
  const activePage = Math.min(currentPage, totalPages);
  const displayPage = filteredNotes.length ? activePage : 1;
  const displayTotalPages = filteredNotes.length ? totalPages : 1;
  const startIndex = (activePage - 1) * NOTES_PER_PAGE;
  const paginatedNotes = filteredNotes.slice(startIndex, startIndex + NOTES_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!filteredNotes.length) {
      setSelectedId(null);
      return;
    }

    if (!paginatedNotes.some((note) => note.id === selectedId)) {
      const fallback = paginatedNotes[0] ?? filteredNotes[0];
      setSelectedId(fallback?.id ?? null);
    }
  }, [filteredNotes, paginatedNotes, selectedId]);

  const selectedNote = useMemo(
    () => filteredNotes.find((note) => note.id === selectedId) ?? null,
    [filteredNotes, selectedId],
  );

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
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal notes-modal notes-list-modal" onClick={(event) => event.stopPropagation()}>
        <header className="notes-header">
          <div>
            <h3>Notes library</h3>
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
            <span className="notes-search__icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search notes by title or keywords"
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
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="notes-body">
          <div className="notes-grid">
            {paginatedNotes.length === 0 ? (
              <div className="notes-empty">
                <h4>No notes match your filters</h4>
                <p>Try adjusting your search or quadrant filters to see more results.</p>
                {(searchTerm || tagFilter !== 'ALL' || sortOrder !== 'desc') && (
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

          <aside className="notes-detail">
            {selectedNote ? (
              <>
                <div className="notes-detail__header">
                  <span className="note-card__tag" data-tag={selectedNote.tag}>
                    {selectedNote.tag}
                  </span>
                  <span className="notes-detail__date">{formatTimestamp(selectedNote.createdAt)}</span>
                  <span className="notes-detail__meta">{countWords(selectedNote.content)} words</span>
                </div>
                <h4 className="notes-detail__title">{selectedNote.title || 'Untitled note'}</h4>
                <pre className="note-view-content">{selectedNote.content || 'No additional context captured yet.'}</pre>
              </>
            ) : (
              <div className="notes-empty-detail">
                <h4>Select a note to read it</h4>
                <p>Your detailed view will appear here once you choose a note on the left.</p>
              </div>
            )}
          </aside>
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
