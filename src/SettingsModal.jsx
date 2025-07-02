import React from 'react';
import './note-modal.css';

export default function SettingsModal({ onClose, autoLog, onToggleAutoLog }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={autoLog}
            onChange={e => onToggleAutoLog(e.target.checked)}
          />
          Auto log calendar
        </label>
      </div>
    </div>
  );
}
