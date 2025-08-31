import React, { useState } from 'react';

const DIMENSIONS = ['Form', 'SemiFormless', 'Formless'];
const ASPECTS = ['II', 'IE', 'EI', 'EE'];

export default function AddActivityModal({ onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🏷️');
  const [description, setDescription] = useState('');
  const [base, setBase] = useState(30);
  const [dimension, setDimension] = useState(DIMENSIONS[0]);
  const [aspect, setAspect] = useState(ASPECTS[0]);
  const [times, setTimes] = useState(1);

  const handleSave = () => {
    onSave({
      title,
      icon,
      base,
      description,
      dimension,
      aspect,
      timesPerDay: times,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add Activity</h3>
        <label className="note-label">
          Title
          <input className="note-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="note-label">
          Icon
          <input className="note-title" value={icon} onChange={(e) => setIcon(e.target.value)} />
        </label>
        <label className="note-label">
          Description
          <input className="note-title" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="note-label">
          Base Minutes
          <input
            type="number"
            className="note-title"
            value={base}
            min="1"
            onChange={(e) => setBase(Number(e.target.value))}
          />
        </label>
        <label className="note-label">
          Dimension
          <select className="note-title" value={dimension} onChange={(e) => setDimension(e.target.value)}>
            {DIMENSIONS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="note-label">
          Aspect
          <select className="note-title" value={aspect} onChange={(e) => setAspect(e.target.value)}>
            {ASPECTS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="note-label">
          Times per Day
          <input
            type="number"
            className="note-title"
            min="1"
            value={times}
            onChange={(e) => setTimes(Number(e.target.value))}
          />
        </label>
        <div className="actions">
          <button className="save-button" onClick={onClose}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
