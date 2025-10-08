import React, { useMemo, useState } from 'react';
import './mood-quadrant-game.css';

const CONTENT_LIBRARY = [
  {
    id: 'sunrise-playlist',
    title: 'Sunrise Playlist',
    description: 'Gentle acoustic tracks to ease into the day.',
    moodTags: ['Calm', 'Hopeful'],
    quadrant: 'II',
  },
  {
    id: 'focus-ritual',
    title: 'Focus Ritual',
    description: 'A candle, a mantra, and 10 minutes of deep work.',
    moodTags: ['Focused', 'Grounded'],
    quadrant: 'IE',
  },
  {
    id: 'spontaneous-dance',
    title: 'Spontaneous Dance',
    description: 'Pick a song at random and dance until it ends.',
    moodTags: ['Playful', 'Energised'],
    quadrant: 'EE',
  },
  {
    id: 'gratitude-scan',
    title: 'Gratitude Scan',
    description: 'List three things that made you smile today.',
    moodTags: ['Grateful', 'Warm'],
    quadrant: 'II',
  },
  {
    id: 'mirror-pep-talk',
    title: 'Mirror Pep Talk',
    description: 'Give yourself the best hype speech you can.',
    moodTags: ['Confident', 'Bold'],
    quadrant: 'EI',
  },
  {
    id: 'forest-walk',
    title: 'Forest Walk',
    description: 'Take a mindful stroll and observe every colour you see.',
    moodTags: ['Calm', 'Curious'],
    quadrant: 'IE',
  },
  {
    id: 'idea-lightning',
    title: 'Idea Lightning',
    description: 'Write five ideas in five minutes without judging them.',
    moodTags: ['Curious', 'Creative'],
    quadrant: 'EI',
  },
  {
    id: 'call-a-friend',
    title: 'Call a Friend',
    description: 'Share a recent win or ask them about theirs.',
    moodTags: ['Connected', 'Supportive'],
    quadrant: 'EE',
  },
  {
    id: 'slow-tea',
    title: 'Slow Tea',
    description: 'Brew your favourite tea and sip it with total presence.',
    moodTags: ['Calm', 'Grounded'],
    quadrant: 'II',
  },
  {
    id: 'bold-micro-action',
    title: 'Bold Micro Action',
    description: 'Take the smallest step toward something that scares you.',
    moodTags: ['Bold', 'Adventurous'],
    quadrant: 'EI',
  },
  {
    id: 'inspiration-gallery',
    title: 'Inspiration Gallery',
    description: 'Scroll through saved artworks and pin the one that resonates.',
    moodTags: ['Inspired', 'Reflective'],
    quadrant: 'IE',
  },
  {
    id: 'celebration-toast',
    title: 'Celebration Toast',
    description: 'Raise a glass (water counts) to a tiny victory.',
    moodTags: ['Joyful', 'Confident'],
    quadrant: 'EE',
  },
];

const STORAGE_KEY = 'moodQuadrantSelections';

const allMoodTags = Array.from(
  new Set(CONTENT_LIBRARY.flatMap((entry) => entry.moodTags))
).sort();

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function MoodQuadrantGame({ onBack }) {
  const [selections, setSelections] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Unable to read stored selections', err);
      return [];
    }
  });
  const [filter, setFilter] = useState('All');

  const entryById = useMemo(() => {
    const map = new Map();
    CONTENT_LIBRARY.forEach((entry) => {
      map.set(entry.id, entry);
    });
    return map;
  }, []);

  const resolvedSelections = useMemo(
    () =>
      selections
        .map((selection) => ({
          ...entryById.get(selection.id),
          timestamp: selection.timestamp,
        }))
        .filter((entry) => entry.id),
    [entryById, selections]
  );

  const insights = useMemo(() => {
    const moodCounts = new Map();
    const quadrantCounts = new Map();

    resolvedSelections.forEach((entry) => {
      entry.moodTags.forEach((tag) => {
        moodCounts.set(tag, (moodCounts.get(tag) || 0) + 1);
      });
      quadrantCounts.set(
        entry.quadrant,
        (quadrantCounts.get(entry.quadrant) || 0) + 1
      );
    });

    const sortedMoods = Array.from(moodCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const sortedQuadrants = Array.from(quadrantCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    const topMood = sortedMoods[0]?.[0] || 'Not enough data';
    const secondaryMood = sortedMoods[1]?.[0] || null;
    const dominantQuadrant = sortedQuadrants[0]?.[0] || '—';

    return {
      moodCounts,
      quadrantCounts,
      sortedMoods,
      sortedQuadrants,
      topMood,
      secondaryMood,
      dominantQuadrant,
    };
  }, [resolvedSelections]);

  const filteredLibrary = useMemo(() => {
    if (filter === 'All') return CONTENT_LIBRARY;
    return CONTENT_LIBRARY.filter((entry) => entry.moodTags.includes(filter));
  }, [filter]);

  const handleSelect = (entry) => {
    setSelections((prev) => {
      const next = [...prev, { id: entry.id, timestamp: Date.now() }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSelections([]);
  };

  return (
    <div className="mood-quadrant-game">
      <aside className="mood-quadrant-sidebar">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h2>Signal Scanner</h2>
        <p>
          Choose the experiences that resonate with you right now. We will use
          their mood tags and quadrant labels to sketch the state you are in.
        </p>
        <div className="insight-card">
          <h3>Current Mood Signal</h3>
          <p className="primary-reading">{insights.topMood}</p>
          {insights.secondaryMood ? (
            <p className="secondary-reading">
              Secondary tone: {insights.secondaryMood}
            </p>
          ) : (
            <p className="secondary-reading subtle">Select a few entries</p>
          )}
        </div>
        <div className="insight-card">
          <h3>Dominant Quadrant</h3>
          <p className="primary-reading quadrant">{insights.dominantQuadrant}</p>
          <ul className="distribution">
            {insights.sortedQuadrants.map(([label, value]) => (
              <li key={label}>
                <span>{label}</span>
                <span className="bar">
                  <span
                    className="fill"
                    style={{ width: `${(value / resolvedSelections.length) * 100}%` }}
                  ></span>
                </span>
                <span>{value}</span>
              </li>
            ))}
            {!resolvedSelections.length && <li className="subtle">No data yet</li>}
          </ul>
        </div>
        <button className="reset-button" onClick={handleReset} disabled={!selections.length}>
          Reset log
        </button>
      </aside>
      <main className="mood-quadrant-main">
        <section className="library-header">
          <h2>Library Picks</h2>
          <div className="filters">
            <button
              className={filter === 'All' ? 'active' : ''}
              onClick={() => setFilter('All')}
            >
              All moods
            </button>
            {allMoodTags.map((tag) => (
              <button
                key={tag}
                className={filter === tag ? 'active' : ''}
                onClick={() => setFilter(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>
        <section className="library-grid">
          {filteredLibrary.map((entry) => (
            <button
              key={entry.id}
              className="library-card"
              onClick={() => handleSelect(entry)}
            >
              <div className="card-head">
                <span className="quadrant-pill">{entry.quadrant}</span>
                <div className="mood-tags">
                  {entry.moodTags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <h3>{entry.title}</h3>
              <p>{entry.description}</p>
            </button>
          ))}
        </section>
        <section className="recent-selections">
          <h2>Recent selections</h2>
          {resolvedSelections.length ? (
            <ul>
              {resolvedSelections
                .slice()
                .reverse()
                .slice(0, 6)
                .map((entry, index) => (
                  <li key={`${entry.id}-${index}`}>
                    <div>
                      <strong>{entry.title}</strong>
                      <span className="timestamp">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    <div className="recent-tags">
                      {entry.moodTags.join(' • ')}
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="subtle">No picks logged yet. Try tapping a card above.</p>
          )}
        </section>
      </main>
    </div>
  );
}
