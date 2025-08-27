import React from 'react';
import './note-modal.css';
import './block-modal.css';

export default function BlockModal({ start, end, items, onClose }) {
  const format = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{`${format(start)} - ${format(end)}`}</h3>
        <ul className="block-items">
          {items.map((it, idx) => (
            <li key={idx} className="block-item">
              <span className="block-icon" />
              <span className="block-label">{it.label}</span>
              {it.duration != null && (
                <span className="block-duration">{Math.round(it.duration / 60000)}m</span>
              )}
            </li>
          ))}
        </ul>
        <div className="actions">
          <button className="save-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
