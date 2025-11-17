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

const NOTE_TITLE_KEYS = ['title', 'name', 'heading'];
const NOTE_CONTENT_KEYS = ['content', 'body', 'note', 'text'];
const NOTE_TAG_KEYS = ['tag', 'quadrant', 'category'];
const NOTE_UPDATED_AT_KEYS = ['updatedAt', 'updated_at', 'modifiedAt', 'editedAt', 'lastUpdated'];
const NOTE_IMAGE_KEYS = ['image', 'imageUrl', 'imageURL', 'image_url', 'photo', 'attachment'];

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

const pickFirstAvailableField = (entry, keys, fallbackKey) => {
  if (!isPlainObject(entry)) {
    return { key: fallbackKey, value: undefined, hasMatch: false };
  }

  for (const key of keys) {
    if (entry[key] !== undefined && entry[key] !== null) {
      return { key, value: entry[key], hasMatch: true };
    }
  }

  return { key: fallbackKey, value: undefined, hasMatch: false };
};

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
      storageIndex: index,
      fieldMapping: null,
      image: null,
      sourceType: 'primitive',
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

  const titleField = pickFirstAvailableField(entry, NOTE_TITLE_KEYS, 'title');
  const contentField = pickFirstAvailableField(entry, NOTE_CONTENT_KEYS, 'content');
  const tagField = pickFirstAvailableField(entry, NOTE_TAG_KEYS, 'tag');
  const updatedField = pickFirstAvailableField(entry, NOTE_UPDATED_AT_KEYS, 'updatedAt');
  const imageField = pickFirstAvailableField(entry, NOTE_IMAGE_KEYS, 'image');

  const rawTitle = toText(titleField.value ?? '');
  const rawContent = toText(contentField.value ?? '');
  const content = rawContent;
  const titleFromContent = content.split(/\n/).find((line) => line.trim()) || '';
  const title = rawTitle.trim() || titleFromContent.trim() || 'Untitled note';

  const tagCandidate = toText(tagField.value ?? '').trim().toUpperCase();
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

  const updatedAt = parseDate(updatedField.value);

  const preview = createPreview(content);
  const rawImage = imageField.value;
  const image = typeof rawImage === 'string' && rawImage.trim() ? rawImage.trim() : null;
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
    image,
    searchable,
    sortKey,
    wordCount,
    characterCount: content.length,
    storageIndex: index,
    fieldMapping: {
      title: titleField.key,
      content: contentField.key,
      tag: tagField.key,
      updatedAt: updatedField.key,
      image: imageField.key,
    },
    sourceType: 'object',
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

    const normalised = [];
    source.forEach((entry, sourceIndex) => {
      const note = normaliseNote(entry, sourceIndex);
      if (!note) {
        return;
      }

      const listIndex = normalised.length;
      normalised.push({
        ...note,
        id: `${note.id}-${listIndex}`,
        sortKey: Number.isFinite(note.sortKey) ? note.sortKey : 0,
      });
    });

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

const buildUpdatedEntry = (originalEntry, note, { title, content, tag, image }) => {
  const timestamp = new Date().toISOString();
  const safeTitle = title && title.trim() ? title.trim() : 'Untitled note';
  const safeContent = typeof content === 'string' ? content : '';
  const normalisedTag = QUADRANT_TAGS.includes(tag) ? tag : 'II';
  const safeImage = typeof image === 'string' && image.trim() ? image.trim() : null;

  if (!isPlainObject(originalEntry)) {
    const createdAt =
      note?.createdAt instanceof Date && isValidDate(note.createdAt)
        ? note.createdAt.toISOString()
        : timestamp;

    const payload = {
      id: note?.referenceId ?? `note-${Date.now()}`,
      title: safeTitle,
      content: safeContent,
      tag: normalisedTag,
      createdAt,
      updatedAt: timestamp,
    };

    if (safeImage !== null) {
      payload.image = safeImage;
    }

    if (note?.referenceId) {
      payload.id = note.referenceId;
    }

    return payload;
  }

  const mapping = note?.fieldMapping ?? {};
  const updatedEntry = { ...originalEntry };

  const titleKey = mapping.title ?? 'title';
  updatedEntry[titleKey] = safeTitle;

  const contentKey = mapping.content ?? 'content';
  updatedEntry[contentKey] = safeContent;

  const tagKey = mapping.tag ?? 'tag';
  updatedEntry[tagKey] = normalisedTag;

  const imageKey = mapping.image ?? 'image';
  if (safeImage) {
    updatedEntry[imageKey] = safeImage;
  } else if (Object.prototype.hasOwnProperty.call(updatedEntry, imageKey)) {
    updatedEntry[imageKey] = null;
  }

  const updatedAtKey =
    mapping.updatedAt ??
    (Object.prototype.hasOwnProperty.call(originalEntry, 'updated_at') ? 'updated_at' : 'updatedAt');
  updatedEntry[updatedAtKey] = timestamp;

  if (!updatedEntry.id && note?.referenceId) {
    updatedEntry.id = note.referenceId;
  }

  if (note?.createdAt instanceof Date && isValidDate(note.createdAt)) {
    const isoCreatedAt = note.createdAt.toISOString();
    if (Object.prototype.hasOwnProperty.call(originalEntry, 'createdAt')) {
      updatedEntry.createdAt = isoCreatedAt;
    } else if (Object.prototype.hasOwnProperty.call(originalEntry, 'created_at')) {
      updatedEntry.created_at = isoCreatedAt;
    } else if (!updatedEntry.createdAt && !updatedEntry.created_at) {
      updatedEntry.createdAt = isoCreatedAt;
    }
  }

  return updatedEntry;
};

const updateNoteInStorage = (note, fields) => {
  const storage = getLocalStorage();
  if (!storage) {
    return { success: false, reason: 'storage-unavailable' };
  }

  let raw;
  try {
    raw = storage.getItem('notes');
  } catch (error) {
    console.warn('Failed to read notes from storage', error);
    return { success: false, reason: 'read-failed' };
  }

  if (!raw) {
    return { success: false, reason: 'missing-data' };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse stored notes', error);
    return { success: false, reason: 'parse-failed' };
  }

  let notesSource;
  let wrapObject = false;
  if (Array.isArray(parsed)) {
    notesSource = [...parsed];
  } else if (parsed && Array.isArray(parsed.notes)) {
    notesSource = [...parsed.notes];
    wrapObject = true;
  } else {
    return { success: false, reason: 'invalid-structure' };
  }

  const index = note?.storageIndex;
  if (!Number.isInteger(index) || index < 0 || index >= notesSource.length) {
    return { success: false, reason: 'invalid-index' };
  }

  const updatedEntry = buildUpdatedEntry(notesSource[index], note, fields);
  notesSource[index] = updatedEntry;

  const payload = wrapObject ? { ...parsed, notes: notesSource } : notesSource;

  try {
    storage.setItem('notes', JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to persist notes to storage', error);
    return { success: false, reason: 'write-failed' };
  }

  return { success: true };
};

const pluralise = (count, singular, plural) => (count === 1 ? singular : plural);

export default function NotesListModal({ onClose }) {
  const [viewportSize, setViewportSize] = useState(() => readViewportSize());
  const [notes, setNotes] = useState(() => loadStoredNotes());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState('ALL');
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTag, setEditTag] = useState(QUADRANT_TAGS[0]);
  const [editImage, setEditImage] = useState(null);
  const [editImageError, setEditImageError] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);
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

  const selectedNote = useMemo(() => {
    if (!selectedId) {
      return null;
    }

    return (
      filteredNotes.find((note) => note.id === selectedId) ??
      notes.find((note) => note.id === selectedId) ??
      null
    );
  }, [filteredNotes, notes, selectedId]);

  useEffect(() => {
    if (!selectedNote) {
      setIsEditing(false);
      setEditTitle('');
      setEditContent('');
      setEditTag(QUADRANT_TAGS[0]);
      setEditError(null);
      setEditImage(null);
      setEditImageError(null);
      return;
    }

    if (!isEditing) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditTag(selectedNote.tag);
      setEditError(null);
      setEditImage(selectedNote.image ?? null);
      setEditImageError(null);
    }
  }, [selectedNote, isEditing]);

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

  const editingMetrics = useMemo(() => {
    if (!selectedNote) {
      return { wordCount: 0, characterCount: 0 };
    }

    if (!isEditing) {
      return {
        wordCount: selectedNote.wordCount ?? 0,
        characterCount: selectedNote.characterCount ?? 0,
      };
    }

    const trimmed = editContent.trim();
    return {
      wordCount: trimmed ? trimmed.split(/\s+/).length : 0,
      characterCount: editContent.length,
    };
  }, [selectedNote, isEditing, editContent]);

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && typeof onClose === 'function') {
      onClose();
    }
  };

  const startEditing = () => {
    if (!selectedNote) {
      return;
    }

    setIsEditing(true);
    setEditTitle(selectedNote.title);
    setEditContent(selectedNote.content);
    setEditTag(selectedNote.tag);
    setEditError(null);
    setEditImage(selectedNote.image ?? null);
    setEditImageError(null);
  };

  const handleEditImageChange = (event) => {
    if (isSavingEdit) {
      return;
    }

    const input = event.target;
    const file = input?.files?.[0];
    if (!file) {
      setEditImageError(null);
      return;
    }

    if (file.type && !file.type.startsWith('image/')) {
      setEditImageError('Please choose an image file (JPG, PNG, GIF, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setEditImage(result);
      setEditImageError(null);
      if (input) {
        input.value = '';
      }
    };
    reader.onerror = () => {
      setEditImageError('Unable to load the selected image. Please try again.');
      if (input) {
        input.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveEditImage = () => {
    if (isSavingEdit) {
      return;
    }

    setEditImage(null);
    setEditImageError(null);
  };

  const handleCancelEdit = () => {
    if (isSavingEdit) {
      return;
    }

    setIsEditing(false);
    setEditError(null);
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditTag(selectedNote.tag);
      setEditImage(selectedNote.image ?? null);
    } else {
      setEditTitle('');
      setEditContent('');
      setEditTag(QUADRANT_TAGS[0]);
      setEditImage(null);
    }
    setEditImageError(null);
  };

  const handleSaveEdit = () => {
    if (!selectedNote || isSavingEdit) {
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    const trimmedTitle = editTitle.trim();
    const cleanedContent = editContent.replace(/\r\n/g, '\n');
    const safeTitle = trimmedTitle || 'Untitled note';
    const safeTag = QUADRANT_TAGS.includes(editTag) ? editTag : 'II';
    const safeImage = editImage ?? null;

    const result = updateNoteInStorage(selectedNote, {
      title: safeTitle,
      content: cleanedContent,
      tag: safeTag,
      image: safeImage,
    });

    if (!result.success) {
      setEditError('Unable to save changes. Please try again.');
      setIsSavingEdit(false);
      return;
    }

    const updatedNotes = loadStoredNotes();
    setNotes(updatedNotes);

    const nextSelected =
      updatedNotes.find((note) => note.storageIndex === selectedNote.storageIndex) ??
      (selectedNote.referenceId
        ? updatedNotes.find((note) => note.referenceId === selectedNote.referenceId)
        : null);

    if (nextSelected) {
      setSelectedId(nextSelected.id);

      const query = searchTerm.trim().toLowerCase();
      const matchesTag = activeTag === 'ALL' || nextSelected.tag === activeTag;
      const matchesQuery = !query || nextSelected.searchable.includes(query);

      if (!matchesTag) {
        setActiveTag(nextSelected.tag);
      }

      if (!matchesQuery) {
        setSearchTerm('');
      }
    } else if (updatedNotes.length > 0) {
      setSelectedId(updatedNotes[0].id);
    } else {
      setSelectedId(null);
    }

    const nextSelectedImage = nextSelected ? nextSelected.image ?? null : safeImage;

    setEditTitle(safeTitle);
    setEditContent(cleanedContent);
    setEditTag(safeTag);
    setEditImage(nextSelectedImage);
    setEditImageError(null);
    setEditError(null);
    setIsEditing(false);
    setIsSavingEdit(false);
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
                    <div className="notes-card__header-meta">
                      <span className="notes-card__date">{note.createdAtLabel}</span>
                      {note.image ? (
                        <span className="notes-card__attachment" title="Contains an image" aria-label="Contains an image">
                          📷
                        </span>
                      ) : null}
                    </div>
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
                  <div className="notes-detail__summary">
                    <span
                      className="note-card__tag"
                      data-tag={isEditing ? editTag : selectedNote.tag}
                    >
                      {isEditing ? editTag : selectedNote.tag}
                    </span>
                    <div className="notes-detail__meta">
                      <span>Created {selectedNote.createdAtLabel}</span>
                      {selectedNote.updatedAtLabel ? (
                        <span>Updated {selectedNote.updatedAtLabel}</span>
                      ) : null}
                      <span>
                        {editingMetrics.wordCount}{' '}
                        {pluralise(editingMetrics.wordCount, 'word', 'words')}
                      </span>
                      <span>{editingMetrics.characterCount} characters</span>
                      {selectedNote.referenceId ? (
                        <span>Ref. {selectedNote.referenceId}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="notes-detail__actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={handleCancelEdit}
                          disabled={isSavingEdit}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={handleSaveEdit}
                          disabled={isSavingEdit}
                        >
                          {isSavingEdit ? 'Saving…' : 'Save changes'}
                        </button>
                      </>
                    ) : (
                      <button type="button" className="ghost-button" onClick={startEditing}>
                        Edit note
                      </button>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <div className="notes-edit-form">
                    <label className="form-field">
                      <span>Title</span>
                      <input
                        className="note-title"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        placeholder="Update the note title"
                        disabled={isSavingEdit}
                      />
                    </label>

                    <label className="form-field">
                      <span>Notes</span>
                      <textarea
                        className="note-content"
                        value={editContent}
                        onChange={(event) => setEditContent(event.target.value)}
                        placeholder="Revise the insight, context, or next steps..."
                        disabled={isSavingEdit}
                      />
                    </label>

                    <label className="form-field note-image-field">
                      <span>Image (optional)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageChange}
                        className="note-image-input"
                        disabled={isSavingEdit}
                      />
                      {editImageError ? (
                        <p className="note-image-error">{editImageError}</p>
                      ) : null}
                      {editImage ? (
                        <div className="note-image-preview">
                          <img src={editImage} alt="Attached to this note" loading="lazy" />
                          <div className="note-image-preview__meta">
                            <span>Image attached</span>
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={handleRemoveEditImage}
                              disabled={isSavingEdit}
                            >
                              Remove image
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="note-image-hint">
                          Drop in a diagram, screenshot, or sketch to make the note memorable.
                        </p>
                      )}
                    </label>

                    <div className="notes-edit-form__footer">
                      <div className="form-field form-field--inline">
                        <span>Quadrant</span>
                        <div className="tag-options">
                          {QUADRANT_TAGS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              data-tag={option}
                              className={`tag-chip ${editTag === option ? 'is-active' : ''}`}
                              style={{ '--tag-color': TAG_COLORS[option] }}
                              onClick={() => setEditTag(option)}
                              disabled={isSavingEdit}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      {editError ? <p className="notes-edit-form__error">{editError}</p> : null}
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="notes-detail__title">{selectedNote.title}</h4>
                    <div className="note-view-content">
                      {selectedNote.content ? selectedNote.content : 'No additional context yet.'}
                    </div>
                    {selectedNote.image ? (
                      <div className="note-image-preview note-image-preview--detail">
                        <img
                          src={selectedNote.image}
                          alt={`Attachment for ${selectedNote.title}`}
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                  </>
                )}
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

