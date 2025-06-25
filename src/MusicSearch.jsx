import React, { useState, useEffect } from 'react';
import './music-search.css';

export default function MusicSearch({ onBack }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [liked, setLiked] = useState(() => {
    const stored = localStorage.getItem('musicLikes');
    return stored ? JSON.parse(stored) : [];
  });

  const search = async () => {
    if (!query) return;
    try {
      const resp = await fetch(
        `https://api.deezer.com/search?q=${encodeURIComponent(query)}`
      );
      if (!resp.ok) return;
      const data = await resp.json();
      setResults(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLike = (track) => {
    const exists = liked.some((t) => t.id === track.id);
    let updated;
    if (exists) {
      updated = liked.filter((t) => t.id !== track.id);
    } else {
      updated = [...liked, { id: track.id, title: track.title, artist: track.artist?.name }];
    }
    setLiked(updated);
    localStorage.setItem('musicLikes', JSON.stringify(updated));
  };

  return (
    <div className="music-search">
      <button className="back-button" onClick={onBack}>Back</button>
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search songs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="action-button" onClick={search}>Search</button>
      </div>
      <div className="results">
        {results.map((t) => (
          <div key={t.id} className="track-line">
            <span>{t.title} - {t.artist?.name}</span>
            <button className="action-button" onClick={() => toggleLike(t)}>
              {liked.some((l) => l.id === t.id) ? 'Unlike' : 'Like'}
            </button>
          </div>
        ))}
      </div>
      <h3>Liked Songs</h3>
      <div className="liked-list">
        {liked.map((t) => (
          <div key={t.id} className="track-line">
            <span>{t.title} - {t.artist}</span>
            <button className="action-button" onClick={() => toggleLike(t)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
