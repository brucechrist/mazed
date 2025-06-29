import React from 'react';
import './music-search.css';

export default function MusicCard({ track, liked, onToggle }) {
  return (
    <div className="music-card">
      {track.cover || track.album?.cover_small ? (
        <img
          className="cover"
          src={track.cover || track.album?.cover_small}
          alt={track.title}
        />
      ) : null}
      <div className="music-info">
        <div className="music-title">{track.title}</div>
        <div className="music-artist">{track.artist?.name || track.artist}</div>
        {track.preview && (
          <audio
            controls
            src={track.preview}
            className="preview"
            data-testid="audio-preview"
          />
        )}
      </div>
      <button className="action-button" onClick={() => onToggle(track)}>
        {liked ? 'Unlike' : 'Like'}
      </button>
    </div>
  );
}
