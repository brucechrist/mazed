import React, { useEffect, useMemo, useState } from 'react';
import './access-state-logger.css';

const LAYERS = ['Form', 'Semi-Formless', 'Formless'];
const QUADRANTS = ['II', 'IE', 'EI', 'EE'];
const SIDES = ['♂', '♀'];
const RATING_OPTIONS = [
  { key: 'good', label: 'Good' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'bad', label: 'Bad' },
];

const STORAGE_KEY = 'accessStateLog';
const SELECTION_KEY = 'accessStateSelections';

const createEmptySelection = () => ({
  layers: ['Semi-Formless'],
  quadrants: [],
  sides: [],
});

export default function AccessStateLogger({ onBack }) {
  const [selections, setSelections] = useState(() => {
    try {
      const stored = localStorage.getItem(SELECTION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          layers: Array.isArray(parsed.layers) ? parsed.layers : ['Semi-Formless'],
          quadrants: Array.isArray(parsed.quadrants) ? parsed.quadrants : [],
          sides: Array.isArray(parsed.sides) ? parsed.sides : [],
        };
      }
    } catch (err) {
      console.warn('Failed to parse selections', err);
    }
    return createEmptySelection();
  });

  const [log, setLog] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to parse access log', err);
    }
    return [];
  });

  const [recentRating, setRecentRating] = useState(null);

  useEffect(() => {
    localStorage.setItem(SELECTION_KEY, JSON.stringify(selections));
  }, [selections]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  }, [log]);

  const toggleSelection = (group, value) => {
    setSelections((prev) => {
      const current = prev[group] || [];
      const exists = current.includes(value);
      let next;
      if (exists) {
        next = current.filter((item) => item !== value);
      } else {
        next = [...current, value];
      }

      if (group === 'layers' && next.length === 0) {
        next = ['Semi-Formless'];
      }

      return { ...prev, [group]: next };
    });
  };

  const summary = useMemo(() => {
    const counts = {
      good: 0,
      neutral: 0,
      bad: 0,
    };
    log.forEach((entry) => {
      counts[entry.rating] = (counts[entry.rating] || 0) + 1;
    });
    const total = log.length || 1;
    return RATING_OPTIONS.map((option) => ({
      ...option,
      count: counts[option.key] || 0,
      percentage: Math.round(((counts[option.key] || 0) / total) * 100),
    }));
  }, [log]);

  const addEntry = (ratingKey) => {
    const timestamp = Date.now();
    const entry = {
      id: timestamp,
      timestamp,
      rating: ratingKey,
      layers: [...new Set(selections.layers)].sort(),
      quadrants: [...new Set(selections.quadrants)].sort(),
      sides: [...new Set(selections.sides)].sort(),
    };
    setLog((prev) => [entry, ...prev]);
    setRecentRating(ratingKey);
  };

  useEffect(() => {
    if (!recentRating) return;
    const timeout = setTimeout(() => setRecentRating(null), 2000);
    return () => clearTimeout(timeout);
  }, [recentRating]);

  const renderSelectionGroup = (title, groupKey, options) => (
    <div className="selection-group">
      <h3>{title}</h3>
      <div className="option-list">
        {options.map((option) => {
          const active = selections[groupKey]?.includes(option);
          return (
            <button
              key={option}
              type="button"
              className={`option-chip ${active ? 'active' : ''}`}
              onClick={() => toggleSelection(groupKey, option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="access-state-logger">
      <div className="logger-header">
        {onBack && (
          <button className="back-button" onClick={onBack}>
            Back
          </button>
        )}
        <div className="title-block">
          <h1>Access State Log</h1>
          <p>Track which parts of you are online and how the experience felt.</p>
        </div>
      </div>

      <div className="selections-grid">
        {renderSelectionGroup('Layers', 'layers', LAYERS)}
        {renderSelectionGroup('Quadrants', 'quadrants', QUADRANTS)}
        {renderSelectionGroup('Side', 'sides', SIDES)}
      </div>

      <div className="rating-section">
        <h3>Mood tone</h3>
        <p className="hint">Click a point to instantly log this moment.</p>
        <div className="vertical-scale">
          <div className="scale-line" aria-hidden="true" />
          {RATING_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`scale-option ${option.key} ${recentRating === option.key ? 'pulse' : ''}`}
              onClick={() => addEntry(option.key)}
            >
              <span className="marker" />
              <span className="label">{option.label}</span>
            </button>
          ))}
        </div>
        <div className="rating-summary">
          {summary.map((option) => (
            <div key={option.key} className="summary-pill">
              <span className="summary-label">{option.label}</span>
              <span className="summary-count">{option.count}</span>
              <span className="summary-percentage">{option.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="current-access">
        <h3>Current access</h3>
        <div className="access-lines">
          <div>
            <span className="line-label">Layers:</span>
            <span className="line-value">
              {selections.layers.length > 0
                ? selections.layers.join(', ')
                : 'None selected'}
            </span>
          </div>
          <div>
            <span className="line-label">Quadrants:</span>
            <span className="line-value">
              {selections.quadrants.length > 0
                ? selections.quadrants.join(', ')
                : 'None selected'}
            </span>
          </div>
          <div>
            <span className="line-label">Side:</span>
            <span className="line-value">
              {selections.sides.length > 0
                ? selections.sides.join(', ')
                : 'Neutral'}
            </span>
          </div>
        </div>
      </div>

      <div className="log-section">
        <h3>Log</h3>
        {log.length === 0 ? (
          <p className="empty-state">
            No entries yet. Activate the modes you feel right now and tap the line to log it.
          </p>
        ) : (
          <ul className="log-list">
            {log.map((entry) => {
              const date = new Date(entry.timestamp);
              return (
                <li key={entry.id} className={`log-entry ${entry.rating}`}>
                  <div className="log-meta">
                    <span className="log-date">
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="log-rating">{RATING_OPTIONS.find((opt) => opt.key === entry.rating)?.label}</span>
                  </div>
                  <div className="log-data">
                    <div>
                      <span className="line-label">Layers:</span>
                      <span className="line-value">
                        {entry.layers.length ? entry.layers.join(', ') : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="line-label">Quadrants:</span>
                      <span className="line-value">
                        {entry.quadrants.length ? entry.quadrants.join(', ') : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="line-label">Side:</span>
                      <span className="line-value">
                        {entry.sides.length ? entry.sides.join(', ') : '—'}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
