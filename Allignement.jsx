import React, { useEffect, useMemo, useState } from 'react';
import './allignement.css';

const STORAGE_KEY = 'allignementEntries';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createEntry = (overrides = {}) => ({
  id: generateId(),
  title: '',
  under: '',
  aligned: '',
  over: '',
  ...overrides,
});

const sanitizeEntries = (raw) => {
  if (!Array.isArray(raw)) return [createEntry()];
  return raw
    .map((entry) => ({
      ...createEntry(),
      ...entry,
    }))
    .filter((entry, index, arr) =>
      typeof entry.id === 'string' && arr.findIndex((e) => e.id === entry.id) === index
    );
};

export default function Allignement({ onBack }) {
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [createEntry()];
      return sanitizeEntries(JSON.parse(saved));
    } catch (error) {
      console.warn('Failed to load allignement entries:', error);
      return [createEntry()];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to persist allignement entries:', error);
    }
  }, [entries]);

  const hasContent = useMemo(
    () =>
      entries.some(
        ({ title, under, aligned, over }) =>
          [title, under, aligned, over].some((value) => value && value.trim() !== '')
      ),
    [entries]
  );

  const updateEntry = (id, field, value) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, createEntry()]);
  };

  const removeEntry = (id) => {
    setEntries((prev) => (prev.length === 1 ? prev : prev.filter((entry) => entry.id !== id)));
  };

  const clearEntries = () => {
    setEntries([createEntry()]);
  };

  return (
    <div className="allignement-app">
      <div className="allignement-header">
        <button className="allignement-back" type="button" onClick={onBack}>
          ← Back
        </button>
        <div className="allignement-title">
          <h2>Allignement</h2>
          <p className="allignement-subtitle">
            Map each energy, habit, or idea across under, aligned, and over expressions.
          </p>
        </div>
        <div className="allignement-controls">
          <button type="button" onClick={addEntry} className="allignement-button">
            + Add entry
          </button>
          <button
            type="button"
            onClick={clearEntries}
            className="allignement-button"
            disabled={!hasContent && entries.length === 1}
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="allignement-table">
        <div className="allignement-columns-header">
          <span className="allignement-label">Focus</span>
          <span className="allignement-label">Under</span>
          <span className="allignement-label">Aligned</span>
          <span className="allignement-label">Over</span>
        </div>
        {entries.map((entry) => (
          <div key={entry.id} className="allignement-row">
            <div className="allignement-focus">
              <input
                type="text"
                value={entry.title}
                placeholder="e.g. Sacral"
                onChange={(event) => updateEntry(entry.id, 'title', event.target.value)}
              />
              <button
                type="button"
                className="allignement-remove"
                onClick={() => removeEntry(entry.id)}
                title="Remove entry"
                disabled={entries.length === 1}
              >
                ✕
              </button>
            </div>
            <textarea
              value={entry.under}
              placeholder="How it looks when it's running low"
              onChange={(event) => updateEntry(entry.id, 'under', event.target.value)}
            />
            <textarea
              value={entry.aligned}
              placeholder="Your balanced, aligned state"
              onChange={(event) => updateEntry(entry.id, 'aligned', event.target.value)}
            />
            <textarea
              value={entry.over}
              placeholder="What it feels like when there's too much"
              onChange={(event) => updateEntry(entry.id, 'over', event.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
