import React, { useEffect, useMemo, useState } from 'react';
import './note-modal.css';
import { getAppDefinition } from './config/appRegistry.jsx';

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

  const enhancedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        title: getAppDefinition(item.id)?.title ?? item.id,
      })),
    [items]
  );

  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Akashic Records</h2>
        <ul className="notes-list">
          {enhancedItems.map((item) => (
            <li key={item.id}>
              {item.title} - {item.layer}
            </li>
          ))}
        </ul>
        <button className="save-button" onClick={onBack}>Close</button>
      </div>
    </div>
  );
}
