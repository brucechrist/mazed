import React, { useState } from 'react';
import './note-modal.css';

export default function RunEndModal({ onSave, onClose, type }) {
  const [reason, setReason] = useState('');
  const [time, setTime] = useState(
    () => new Date().toTimeString().slice(0, 5)
  );

  const handleSave = () => {
    if (type === 'relapse') {
      onSave(reason, time);
    } else {
      onSave(reason);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Why did the run end?</h3>
        <textarea
          className="note-content"
          placeholder="Reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {type === 'relapse' && (
          <input
            type="time"
            className="note-content"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        )}
        <div className="actions">
          <button className="save-button" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
