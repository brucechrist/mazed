import React, { useEffect, useMemo, useState } from 'react';
import './weakness.css';

const STAGES = ['Awareness', 'Training', 'Mastery'];

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const loadWeaknesses = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('weaknessEntries'));
    if (Array.isArray(stored)) {
      return stored.map((item) => ({
        id: item.id ?? Date.now().toString(),
        text: item.text ?? '',
        stage: Number.isInteger(item.stage) ? item.stage % STAGES.length : 0,
        createdAt: item.createdAt ?? new Date().toISOString(),
        notes: item.notes ?? '',
      }));
    }
  } catch (error) {
    console.error('Failed to load weakness entries', error);
  }
  return [];
};

export default function Weakness({ onBack }) {
  const [weaknesses, setWeaknesses] = useState(loadWeaknesses);
  const [input, setInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingNotes, setEditingNotes] = useState('');

  useEffect(() => {
    localStorage.setItem('weaknessEntries', JSON.stringify(weaknesses));
  }, [weaknesses]);

  const sortedWeaknesses = useMemo(() => {
    return [...weaknesses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [weaknesses]);

  const resetInputs = () => {
    setInput('');
    setNotesInput('');
  };

  const handleAdd = () => {
    if (!input.trim()) return;
    const entry = {
      id: createId(),
      text: input.trim(),
      notes: notesInput.trim(),
      stage: 0,
      createdAt: new Date().toISOString(),
    };
    setWeaknesses((prev) => [entry, ...prev]);
    resetInputs();
  };

  const handleDelete = (id) => {
    setWeaknesses((prev) => prev.filter((item) => item.id !== id));
  };

  const cycleStage = (id) => {
    setWeaknesses((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stage: (item.stage + 1) % STAGES.length,
            }
          : item
      )
    );
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditingText(item.text);
    setEditingNotes(item.notes || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
    setEditingNotes('');
  };

  const saveEditing = () => {
    if (!editingId) return;
    setWeaknesses((prev) =>
      prev.map((item) =>
        item.id === editingId
          ? {
              ...item,
              text: editingText.trim() ? editingText.trim() : item.text,
              notes: editingNotes.trim(),
            }
          : item
      )
    );
    cancelEditing();
  };

  return (
    <div className="weakness-app">
      <header className="weakness-header">
        <button className="back-button" type="button" onClick={onBack}>
          Back
        </button>
        <div>
          <h1>Weakness Lab</h1>
          <p>Capture weaknesses and track your path from awareness to mastery.</p>
        </div>
      </header>
      <section className="weakness-input">
        <div className="weakness-input-fields">
          <textarea
            className="weakness-textarea"
            placeholder="Describe the weakness you want to transform..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
          />
          <textarea
            className="weakness-textarea notes"
            placeholder="Optional notes, triggers, or experiments..."
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            rows={2}
          />
        </div>
        <button className="weakness-add-button" type="button" onClick={handleAdd}>
          Add Weakness
        </button>
      </section>
      <section className="weakness-banners" aria-live="polite">
        {sortedWeaknesses.length === 0 ? (
          <p className="weakness-empty">
            No weaknesses logged yet. Start by writing one above and it will appear here
            as a banner you can revisit.
          </p>
        ) : (
          sortedWeaknesses.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <article
                key={item.id}
                className={`weakness-banner stage-${item.stage}`}
              >
                <div className="weakness-content">
                  <div className="weakness-main">
                    {isEditing ? (
                      <>
                        <textarea
                          className="weakness-edit-text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          rows={3}
                        />
                        <textarea
                          className="weakness-edit-notes"
                          value={editingNotes}
                          onChange={(e) => setEditingNotes(e.target.value)}
                          rows={2}
                          placeholder="Notes, triggers, experiments..."
                        />
                      </>
                    ) : (
                      <>
                        <h2>{item.text}</h2>
                        {item.notes && <p className="weakness-notes">{item.notes}</p>}
                      </>
                    )}
                  </div>
                  <div className="weakness-meta">
                    <span className="stage-label">{STAGES[item.stage]}</span>
                    <time>
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                    <div className="weakness-actions">
                      {isEditing ? (
                        <>
                          <button type="button" onClick={saveEditing}>
                            Save
                          </button>
                          <button type="button" onClick={cancelEditing}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => cycleStage(item.id)}>
                            Advance Stage
                          </button>
                          <button type="button" onClick={() => startEditing(item)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(item.id)}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
