import React, { useState } from 'react';
import './note-modal.css';

export default function EventModal({
  start,
  end,
  title: initialTitle = '',
  color: initialColor = '#1a73e8',
  onSave,
  onDelete,
  onClose,
}) {
  const [title, setTitle] = useState(initialTitle);
  const [startTime, setStartTime] = useState(
    start ? new Date(start).toISOString().slice(0, 16) : ''
  );
  const [endTime, setEndTime] = useState(
    end ? new Date(end).toISOString().slice(0, 16) : ''
  );
  const [color, setColor] = useState(initialColor);

  const handleSave = () => {
    onSave({
      title: title || 'Untitled',
      start: new Date(startTime),
      end: new Date(endTime),
      color,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <input
          className="note-title"
          placeholder="Event title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <label className="note-label">
          Start
          <input
            type="datetime-local"
            className="note-title"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
          />
        </label>
        <label className="note-label">
          End
          <input
            type="datetime-local"
            className="note-title"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
          />
        </label>
        <label className="note-label">
          Color
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
          />
        </label>
        <div className="actions">
          {onDelete && (
            <button className="save-button" onClick={() => { onDelete(); onClose(); }}>
              Delete
            </button>
          )}
          <button className="save-button" onClick={onClose}>Cancel</button>
          <button className="save-button" onClick={() => { handleSave(); onClose(); }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
