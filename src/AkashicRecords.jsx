import React, { useEffect, useState } from 'react';
import './note-modal.css';

export default function AkashicRecords({ onBack }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('appLayers');
    if (stored) {
      const mapping = JSON.parse(stored);
      setItems(
        Object.entries(mapping).map(([id, layer]) => ({ id, layer }))
      );
    }
  }, []);

  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Akashic Records</h2>
        <ul className="notes-list">
          {items.map((item) => (
            <li key={item.id}>
              {item.id} - {item.layer}
            </li>
          ))}
        </ul>
        <button className="save-button" onClick={onBack}>Close</button>
      </div>
    </div>
  );
}
