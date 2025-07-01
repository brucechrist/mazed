import React, { useState, useEffect } from 'react';
import ShadowModal from './ShadowModal.jsx';
import './placeholder-app.css';
import './shadow-work.css';

export default function ShadowWork({ onBack }) {
  const categories = ['desires', 'aversion', 'ideas'];
  const [shadows, setShadows] = useState(() => {
    const stored = localStorage.getItem('shadows');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return { desires: parsed, aversion: [], ideas: [] };
      }
      return { desires: [], aversion: [], ideas: [], ...parsed };
    }
    return { desires: [], aversion: [], ideas: [] };
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('shadows', JSON.stringify(shadows));
  }, [shadows]);

  const addShadow = (cat, s) => {
    setShadows({ ...shadows, [cat]: [...shadows[cat], s] });
  };

  const handleDragStart = (cat, id) => (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ category: cat, id }));
  };

  const handleDrop = (cat) => (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    const { category: fromCat, id } = JSON.parse(data);
    if (fromCat === cat) return;
    setShadows((prev) => {
      const itemId = Number(id);
      const item = prev[fromCat].find((n) => n.id === itemId);
      if (!item) return prev;
      return {
        ...prev,
        [fromCat]: prev[fromCat].filter((n) => n.id !== itemId),
        [cat]: [...prev[cat], item],
      };
    });
  };

  return (
    <div className="placeholder-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <div className="shadow-categories">
        {categories.map(cat => (
          <div
            key={cat}
            className="shadow-category"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop(cat)}
          >
            <h3>{cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
            <ul>
              {shadows[cat].map(s => (
                <li
                  key={s.id}
                  className="shadow-note"
                  draggable
                  onDragStart={handleDragStart(cat, s.id)}
                >
                  <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                  {s.description && <div style={{ marginTop: '4px' }}>{s.description}</div>}
                  {s.notes && <div style={{ marginTop: '4px', fontSize: '0.9em' }}>{s.notes}</div>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <button className="action-button" onClick={() => setShowModal(true)} style={{ borderRadius: '50%', width: '40px', height: '40px', fontSize: '24px', padding: 0 }}>
        +
      </button>
      {showModal && (
        <ShadowModal categories={categories} onAdd={addShadow} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
