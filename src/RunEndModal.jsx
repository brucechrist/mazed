import React, { useState } from 'react';
import './note-modal.css';

export default function RunEndModal({ onSave, onClose }) {
  const [reason, setReason] = useState('');

  const handleSave = () => {
    onSave(reason);
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
        <div className="actions">
          <button className="save-button" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
