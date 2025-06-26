import React, { useState } from 'react';
import './note-modal.css';

export default function QuestModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quadrant, setQuadrant] = useState('II');
  const [resource, setResource] = useState(0);
  const [rarity, setRarity] = useState('C');
  const [urgent, setUrgent] = useState(false);

  const handlePublish = () => {
    onAdd({
      id: Date.now(),
      name: name || 'Untitled',
      description,
      quadrant,
      resource: parseInt(resource, 10) || 0,
      rarity,
      urgent,
      accepted: true,
      completed: false,
      type: 'user',
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <input
          className="note-title"
          placeholder="Quest name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="note-content"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select
          className="note-tag"
          value={quadrant}
          onChange={(e) => setQuadrant(e.target.value)}
        >
          <option value="II">II</option>
          <option value="IE">IE</option>
          <option value="EI">EI</option>
          <option value="EE">EE</option>
        </select>
        <input
          className="note-title"
          type="number"
          placeholder="Resource (+/-)"
          value={resource}
          onChange={(e) => setResource(e.target.value)}
        />
        <label className="note-label">
          Rarity
          <select
            className="note-tag"
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
          >
            <option value="SS">SS</option>
            <option value="S">S</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </label>
        <label className="note-label">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
          />
          Urgent
        </label>
        <div className="actions">
          <button className="save-button" onClick={onClose}>Cancel</button>
          <button className="save-button" onClick={handlePublish}>Publish Quest</button>
        </div>
      </div>
    </div>
  );
}
