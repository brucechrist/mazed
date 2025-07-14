import React, { useState } from 'react';
import './moodtracker.css';

const TAGS = [
  'Happy',
  'Sad',
  'Angry',
  'Excited',
  'Tired',
  'Calm',
  'Anxious',
];

export default function Moodtracker({ onBack }) {
  const [score, setScore] = useState(5);
  const [tags, setTags] = useState([]);
  const [log, setLog] = useState(() => {
    const stored = localStorage.getItem('moodLog');
    return stored ? JSON.parse(stored) : [];
  });

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addEntry = () => {
    const entry = { time: Date.now(), score, tags };
    const updated = [...log, entry];
    setLog(updated);
    localStorage.setItem('moodLog', JSON.stringify(updated));
    setTags([]);
    setScore(5);
  };

  const stars = (s) => '⭐'.repeat(Math.floor(s / 2));

  return (
    <div className="moodtracker">
      <div className="left-panel">
        <button className="back-button" onClick={onBack}>Back</button>
        <div className="input-section">
          <label>
            Mood score: {score}/10
            <input
              type="range"
              min="0"
              max="10"
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value, 10))}
            />
          </label>
          <div className="tag-options">
            {TAGS.map((tag) => (
              <label key={tag} className="tag-option">
                <input
                  type="checkbox"
                  checked={tags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
          <button className="action-button" onClick={addEntry}>
            Add Entry
          </button>
        </div>
      </div>
      <div className="right-panel">
        <div className="mood-log">
          {log.map((entry, idx) => {
            const d = new Date(entry.time);
            const date = d.toLocaleDateString();
            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={idx} className="mood-banner">
                {date} {time} mood: {entry.tags.join(', ') || 'none'} {stars(entry.score)}{' '}
                {entry.score}/10
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
