import React, { useEffect, useMemo, useRef, useState } from 'react';
import './weakness.css';

const STAGES = ['Awareness', 'Training', 'Mastery'];

const PROMPT_LIBRARY = {
  0: [
    (text) => `Name one micro-trigger that sparks "${text}" and design a 60-second ritual to interrupt it today.`,
    (text) => `Imagine a mentor watching you confront "${text}". What is the smallest move they would cheer for right now?`,
    (text) => `Transform "${text}" into a training quest. Write the headline of the victory story you want to read tomorrow.`,
  ],
  1: [
    (text) => `You have experimented with "${text}" already. List one thing that worked once and schedule it again in the next 24 hours.`,
    (text) => `What would "${text}" look like at 50% intensity? Design a drill that rehearses success against that softer version.`,
    (text) => `Send a quick message (or voice memo) to your future self about how you will disarm "${text}" before bedtime.`,
  ],
  2: [
    (text) => `Celebrate the mastery of "${text}". How can you teach this transformation to someone else within the next week?`,
    (text) => `Write a gratitude line for the part of you that once created "${text}". What new role can that energy play now?`,
    (text) => `Archive "${text}" in your personal codex: what were the three turning points that made mastery inevitable?`,
  ],
  fallback: [
    () => 'Log a weakness to unlock your alchemy prompt and spotlight ritual.',
  ],
};

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
  const [spotlightId, setSpotlightId] = useState(null);
  const [promptSeed, setPromptSeed] = useState(() => Date.now());

  const bannerRefs = useRef({});

  useEffect(() => {
    localStorage.setItem('weaknessEntries', JSON.stringify(weaknesses));
  }, [weaknesses]);

  const sortedWeaknesses = useMemo(() => {
    return [...weaknesses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [weaknesses]);

  useEffect(() => {
    if (!weaknesses.length) {
      if (spotlightId !== null) {
        setSpotlightId(null);
      }
      return;
    }
    if (!weaknesses.some((item) => item.id === spotlightId)) {
      const firstNonMastered = sortedWeaknesses.find((item) => item.stage !== STAGES.length - 1);
      const nextSpotlight = (firstNonMastered || sortedWeaknesses[0]).id;
      setSpotlightId(nextSpotlight);
    }
  }, [weaknesses, spotlightId, sortedWeaknesses]);

  const stageCounts = useMemo(
    () => STAGES.map((_, index) => weaknesses.filter((item) => item.stage === index).length),
    [weaknesses]
  );

  const totalWeaknesses = weaknesses.length;
  const masteryRate = totalWeaknesses
    ? Math.round((stageCounts[STAGES.length - 1] / totalWeaknesses) * 100)
    : 0;
  const newestEntry = sortedWeaknesses[0];

  const spotlight = useMemo(() => {
    if (!sortedWeaknesses.length) return null;
    if (spotlightId) {
      const match = sortedWeaknesses.find((item) => item.id === spotlightId);
      if (match) return match;
    }
    return sortedWeaknesses[0];
  }, [sortedWeaknesses, spotlightId]);

  const alchemyPrompt = useMemo(() => {
    if (!spotlight) return PROMPT_LIBRARY.fallback[0]();
    const library = PROMPT_LIBRARY[spotlight.stage] || PROMPT_LIBRARY.fallback;
    const index = Math.abs(promptSeed) % library.length;
    const builder = library[index] || PROMPT_LIBRARY.fallback[0];
    return builder(spotlight.text);
  }, [promptSeed, spotlight]);

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

  const registerBannerRef = (id) => (node) => {
    if (node) {
      bannerRefs.current[id] = node;
    } else {
      delete bannerRefs.current[id];
    }
  };

  const focusEntry = (id) => {
    setSpotlightId(id);
    requestAnimationFrame(() => {
      const target = bannerRefs.current[id];
      if (target?.scrollIntoView) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    setPromptSeed((seed) => seed + 1);
  };

  const shufflePrompt = () => setPromptSeed((seed) => seed + 13);

  const formatDate = (isoString) => {
    try {
      return new Date(isoString).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return isoString;
    }
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
      <div className="weakness-body">
        <section className="weakness-main-column">
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
                const isSpotlight = spotlight?.id === item.id;
                return (
                  <article
                    key={item.id}
                    ref={registerBannerRef(item.id)}
                    className={`weakness-banner stage-${item.stage} ${isSpotlight ? 'spotlight' : ''}`}
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
                        <time>{formatDate(item.createdAt)}</time>
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
                              <button type="button" onClick={() => focusEntry(item.id)}>
                                Spotlight
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
        </section>
        <aside className="weakness-insights">
          <div className="weakness-insight-card">
            <h2>Momentum</h2>
            <p className="weakness-insight-sub">{totalWeaknesses || 'No'} entries logged • {masteryRate}% mastered</p>
            <div className="weakness-stat-grid">
              {STAGES.map((label, index) => {
                const count = stageCounts[index];
                const percent = totalWeaknesses ? Math.round((count / totalWeaknesses) * 100) : 0;
                return (
                  <div key={label} className="weakness-stat-card">
                    <span className="weakness-stat-value">{count}</span>
                    <span className="weakness-stat-label">{label}</span>
                    <div className="weakness-progress-bar" aria-hidden="true">
                      <div style={{ width: `${percent}%` }} />
                    </div>
                    <span className="weakness-stat-percent">{percent}%</span>
                  </div>
                );
              })}
            </div>
            {newestEntry && (
              <div className="weakness-recent">
                <span>Last entry</span>
                <strong>{formatDate(newestEntry.createdAt)}</strong>
              </div>
            )}
          </div>
          <div className="weakness-insight-card">
            <h3>Spotlight</h3>
            {spotlight ? (
              <div className="weakness-spotlight">
                <span className={`stage-pill stage-pill-${spotlight.stage}`}>{STAGES[spotlight.stage]}</span>
                <p className="weakness-spotlight-text">{spotlight.text}</p>
                {spotlight.notes && <p className="weakness-spotlight-notes">{spotlight.notes}</p>}
                <button type="button" className="weakness-spotlight-focus" onClick={() => focusEntry(spotlight.id)}>
                  Jump to banner
                </button>
              </div>
            ) : (
              <p className="weakness-empty">Add a weakness and mark it as your spotlight to begin.</p>
            )}
          </div>
          <div className="weakness-insight-card surprise-card">
            <h3>Alchemy Prompt</h3>
            <p className="weakness-prompt">{alchemyPrompt}</p>
            <button type="button" className="weakness-surprise-button" onClick={shufflePrompt}>
              New ritual idea
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
