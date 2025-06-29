import React, { useState, useEffect } from 'react';
import QuadrantCombModal from './QuadrantCombModal.jsx';
import './version-rating.css';

export default function QuadrantCombinaisons({ onBack }) {
  const [combos, setCombos] = useState(() => {
    const stored = localStorage.getItem('quadrantCombinaisons');
    return stored ? JSON.parse(stored) : [];
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('quadrantCombinaisons', JSON.stringify(combos));
  }, [combos]);

  const addCombo = (c) => setCombos([...combos, c]);
  const removeCombo = (id) => setCombos(combos.filter((c) => c.id !== id));

  return (
    <div className="version-rating">
      <button className="back-button" onClick={onBack}>Back</button>
      <div className="rating-list">
        {combos.map((c) => (
          <div key={c.id} className="version-card">
            <div className="version-header">
              <div className="version-name">{c.name}</div>
              <button className="delete-button" onClick={() => removeCombo(c.id)}>
                ✖
              </button>
            </div>
            <div className="quadrant-notes">
              <div><strong>II:</strong> {c.quadrants?.II}</div>
              <div><strong>IE:</strong> {c.quadrants?.IE}</div>
              <div><strong>EI:</strong> {c.quadrants?.EI}</div>
              <div><strong>EE:</strong> {c.quadrants?.EE}</div>
            </div>
            {c.notes && <div className="extra-notes">{c.notes}</div>}
          </div>
        ))}
      </div>
      <button className="action-button" onClick={() => setShowModal(true)}>
        Add Combinaison
      </button>
      {showModal && (
        <QuadrantCombModal
          onAdd={addCombo}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
