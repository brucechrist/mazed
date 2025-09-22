import React, { useEffect, useState } from 'react';
import TrinityModal from './TrinityModal.jsx';
import './version-rating.css';

export default function Trinities({ onBack }) {
  const [trinities, setTrinities] = useState(() => {
    const stored = localStorage.getItem('trinities');
    return stored ? JSON.parse(stored) : [];
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('trinities', JSON.stringify(trinities));
  }, [trinities]);

  const addTrinity = (entry) => {
    setTrinities((prev) => [...prev, entry]);
  };

  const removeTrinity = (id) => {
    setTrinities((prev) => prev.filter((entry) => entry.id !== id));
  };

  const formatValue = (value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed : '—';
    }
    if (value === 0) {
      return '0';
    }
    return value ? String(value) : '—';
  };

  return (
    <div className="version-rating">
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      <div className="rating-list">
        {trinities.length === 0 && (
          <div className="empty-state">
            Map your inspirations across Form, Semi-formless, and Formless spaces to
            see how your ideas echo through each realm.
          </div>
        )}
        {trinities.map((entry) => (
          <div key={entry.id} className="version-card">
            <div className="version-header">
              <div className="version-name">{entry.name}</div>
              <button
                className="delete-button"
                onClick={() => removeTrinity(entry.id)}
                aria-label={`Delete ${entry.name}`}
              >
                ✖
              </button>
            </div>
            <div className="quadrant-notes">
              <div>
                <strong>Form:</strong> {formatValue(entry.categories?.form)}
              </div>
              <div>
                <strong>Semi-formless:</strong>{' '}
                {formatValue(entry.categories?.semiFormless)}
              </div>
              <div>
                <strong>Formless:</strong> {formatValue(entry.categories?.formless)}
              </div>
            </div>
            {entry.notes && <div className="extra-notes">{entry.notes}</div>}
          </div>
        ))}
      </div>
      <button className="action-button" onClick={() => setShowModal(true)}>
        Add Trinity
      </button>
      {showModal && (
        <TrinityModal
          onAdd={addTrinity}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
