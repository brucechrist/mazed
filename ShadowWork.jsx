import React, { useState, useEffect } from 'react';
import ShadowModal from './ShadowModal.jsx';
import './placeholder-app.css';

export default function ShadowWork({ onBack }) {
  const [shadows, setShadows] = useState(() => {
    const stored = localStorage.getItem('shadows');
    return stored ? JSON.parse(stored) : [];
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('shadows', JSON.stringify(shadows));
  }, [shadows]);

  const addShadow = (s) => {
    setShadows([...shadows, s]);
  };

  return (
    <div className="placeholder-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <ul style={{ listStyle: 'none', padding: 0, width: '100%', maxWidth: '400px' }}>
        {shadows.map(s => (
          <li key={s.id} style={{ background: '#333', color: 'white', padding: '8px 12px', borderRadius: '8px', marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold' }}>{s.name}</div>
            {s.description && <div style={{ marginTop: '4px' }}>{s.description}</div>}
            {s.notes && <div style={{ marginTop: '4px', fontSize: '0.9em' }}>{s.notes}</div>}
          </li>
        ))}
      </ul>
      <button className="action-button" onClick={() => setShowModal(true)} style={{ borderRadius: '50%', width: '40px', height: '40px', fontSize: '24px', padding: 0 }}>
        +
      </button>
      {showModal && (
        <ShadowModal onAdd={addShadow} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
