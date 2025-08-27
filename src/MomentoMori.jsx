import React, { useState, useEffect } from 'react';
import './momento-mori.css';
import LevelRating, { RARITY_LEVELS } from './LevelRating.jsx';

export default function MomentoMori({ onBack }) {
  const [columns, setColumns] = useState({
    canDo: [],
    cantDo: [],
    wishes: [],
  });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('momentoMori') || '{}');
    if (stored && typeof stored === 'object') {
      setColumns({
        canDo: (stored.canDo || []).map((c) => ({
          ...c,
          level: c.level || RARITY_LEVELS[0].key,
        })),
        cantDo: (stored.cantDo || []).map((c) => ({
          ...c,
          level: c.level || RARITY_LEVELS[0].key,
        })),
        wishes: (stored.wishes || []).map((c) => ({
          ...c,
          level: c.level || RARITY_LEVELS[0].key,
        })),
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('momentoMori', JSON.stringify(columns));
  }, [columns]);

  const [newCards, setNewCards] = useState({
    canDo: { text: '', type: 'Form', level: RARITY_LEVELS[0].key },
    cantDo: { text: '', type: 'Form', level: RARITY_LEVELS[0].key },
    wishes: { text: '', type: 'Form', level: RARITY_LEVELS[0].key },
  });

  const [dragInfo, setDragInfo] = useState(null);

  const handleAdd = (column) => {
    const entry = newCards[column];
    if (!entry.text.trim()) return;
    const card = {
      id: Date.now(),
      text: entry.text,
      type: entry.type,
      level: entry.level,
    };
    setColumns((prev) => ({
      ...prev,
      [column]: [...prev[column], card],
    }));
    setNewCards((prev) => ({
      ...prev,
      [column]: { text: '', type: 'Form', level: RARITY_LEVELS[0].key },
    }));
  };

  const handleDelete = (column, id) => {
    setColumns((prev) => ({
      ...prev,
      [column]: prev[column].filter((c) => c.id !== id),
    }));
  };

  const handleEdit = (column, id, text) => {
    setColumns((prev) => ({
      ...prev,
      [column]: prev[column].map((c) => (c.id === id ? { ...c, text } : c)),
    }));
  };

  const onDragStart = (column, index) => (e) => {
    setDragInfo({ column, index });
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (column) => (e) => {
    e.preventDefault();
    if (!dragInfo) return;
    setColumns((prev) => {
      const fromList = [...prev[dragInfo.column]];
      const [item] = fromList.splice(dragInfo.index, 1);
      const toList = [...prev[column], item];
      return {
        ...prev,
        [dragInfo.column]: fromList,
        [column]: toList,
      };
    });
    setDragInfo(null);
  };

  const updateNewCardField = (column, field, value) => {
    setNewCards((prev) => ({
      ...prev,
      [column]: { ...prev[column], [field]: value },
    }));
  };

  return (
    <div className="momento-mori">
      <button className="back-button" onClick={onBack}>
        ← Back
      </button>
      <div className="momento-columns">
        {['canDo', 'cantDo', 'wishes'].map((col) => (
          <div
            key={col}
            className="momento-column"
            onDragOver={onDragOver}
            onDrop={onDrop(col)}
          >
            <h2>
              {col === 'canDo'
                ? 'Can Do Now'
                : col === 'cantDo'
                ? "Can't Do"
                : 'Wishes'}
            </h2>
            {columns[col].map((card, index) => (
              <div
                key={card.id}
                className="momento-card"
                draggable
                onDragStart={onDragStart(col, index)}
              >
                <span className={`type-tag ${card.type.replace(/\s+/g, '-').toLowerCase()}`}>
                  {card.type}
                </span>
                <LevelRating value={card.level} readOnly />
                <EditableText
                  text={card.text}
                  onChange={(t) => handleEdit(col, card.id, t)}
                />
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(col, card.id)}
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="add-card">
              <input
                type="text"
                placeholder="New billet"
                value={newCards[col].text}
                onChange={(e) => updateNewCardField(col, 'text', e.target.value)}
              />
              <select
                value={newCards[col].type}
                onChange={(e) => updateNewCardField(col, 'type', e.target.value)}
              >
                <option>Form</option>
                <option>Semi Formless</option>
                <option>Formless</option>
              </select>
              <LevelRating
                value={newCards[col].level}
                onChange={(v) => updateNewCardField(col, 'level', v)}
              />
              <button onClick={() => handleAdd(col)}>Add</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableText({ text, onChange }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(text);

  const save = () => {
    onChange(value);
    setEditing(false);
  };

  return editing ? (
    <div className="edit-area">
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={save}>Save</button>
    </div>
  ) : (
    <span className="card-text" onDoubleClick={() => setEditing(true)}>
      {text}
    </span>
  );
}
