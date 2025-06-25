import React from 'react';
import './music-card.css';

export default function MusicCard({ track, onLike }) {
  if (!track) return null;
  const { title, preview, artist, album } = track;
  return (
    <div className="music-card">
      <img
        className="album-cover"
        src={album?.cover_small}
        alt={title + ' cover'}
      />
      <div className="music-info">
        <div className="track-title">{title}</div>
        <div className="artist-name">{artist?.name}</div>
        <audio
          data-testid="audio-preview"
          className="audio-preview"
          controls
          src={preview}
        />
        <button className="like-button" onClick={onLike}>Like</button>
      </div>
    </div>
  );
}
