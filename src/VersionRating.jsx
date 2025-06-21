import React, { useState, useEffect } from 'react';
import VersionModal from './VersionModal.jsx';
import './version-rating.css';

export default function VersionRating({ onBack }) {
  const [versions, setVersions] = useState(() => {
    const stored = localStorage.getItem('versions');
    return stored ? JSON.parse(stored) : [];
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('versions', JSON.stringify(versions));
  }, [versions]);

  const addVersion = (v) => {
    setVersions([...versions, v]);
  };

  const sorted = [...versions].sort((a, b) => b.rating - a.rating);

  return (
    <div className="version-rating">
      <button className="back-button" onClick={onBack}>Back</button>
      <div className="rating-list">
        {sorted.map((v) => (
          <div key={v.id} className="version-card">
            <div className="version-header">
              <div className="version-name">{v.name}</div>
              <div className="version-score">{v.rating}</div>
              <div className="version-like">{v.liked ? '👍' : '👎'}</div>
            </div>
            <div className="quadrant-notes">
              <div><strong>II:</strong> {v.quadrants?.II}</div>
              <div><strong>IE:</strong> {v.quadrants?.IE}</div>
              <div><strong>EI:</strong> {v.quadrants?.EI}</div>
              <div><strong>EE:</strong> {v.quadrants?.EE}</div>
            </div>
            {v.notes && <div className="extra-notes">{v.notes}</div>}
          </div>
        ))}
      </div>
      <button className="action-button" onClick={() => setShowModal(true)}>
        Add Version
      </button>
      {showModal && (
        <VersionModal
          onAdd={addVersion}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
