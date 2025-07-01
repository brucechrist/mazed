import React, { useState } from 'react';
import './note-modal.css';

export default function EventModal({
  start,
  end,
  title: initialTitle = '',
  kind: initialKind = 'planned',
  color: initialColor = '#888888',
  description: initialDescription = '',
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
  const [kind, setKind] = useState(initialKind);
  const [description, setDescription] = useState(initialDescription);

  const handleSave = () => {
    onSave({
      title: title || 'Untitled',
      start: new Date(startTime),
      end: new Date(endTime),
      color,
      kind,
      description,
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
        <label className="note-label">
          Type
          <select className="note-title" value={kind} onChange={e => setKind(e.target.value)}>
            <option value="planned">Planned</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label className="note-label">
          Description
          <textarea
            className="note-title"
            value={description}
            onChange={e => setDescription(e.target.value)}
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
