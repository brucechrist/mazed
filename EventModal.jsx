import React, { useState } from 'react';
import './note-modal.css';

export default function EventModal({ start, end, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState(new Date(start).toISOString().slice(0,16));
  const [endTime, setEndTime] = useState(new Date(end).toISOString().slice(0,16));
  const [color, setColor] = useState('#1a73e8');

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
          <button className="save-button" onClick={onClose}>Cancel</button>
          <button className="save-button" onClick={() => { handleSave(); onClose(); }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
