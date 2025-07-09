import React from 'react';
import './note-modal.css';

export const akashicItems = [
  { id: 1, name: 'Example item 1' },
  { id: 2, name: 'Example item 2' },
];

export default function AkashicRecords({ onBack }) {
  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Akashic Records</h2>
        <ul className="notes-list">
          {akashicItems.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
        <button className="save-button" onClick={onBack}>Close</button>
      </div>
    </div>
  );
}
