import React, { useState, useEffect } from 'react';
import './placeholder-app.css';
import './implementation-ideas.css';

export default function ImplementationIdeas({ onBack }) {
  const [ideas, setIdeas] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('implementationIdeas')) || [];
    } catch {
      return [];
    }
  });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState(1);
  const [implemented, setImplemented] = useState(false);
  const [view, setView] = useState(null);

  useEffect(() => {
    localStorage.setItem('implementationIdeas', JSON.stringify(ideas));
  }, [ideas]);

  const addIdea = () => {
    if (!name.trim()) return;
    const entry = {
      id: Date.now(),
      name: name.trim(),
      description,
      implemented,
      importance,
      date: new Date().toISOString(),
    };
    setIdeas((prev) => [...prev, entry]);
    setName('');
    setDescription('');
    setImportance(1);
    setImplemented(false);
  };

  return (
    <div className="placeholder-app implementation-ideas">
      <button className="back-button" onClick={onBack}>Back</button>
      <div className="idea-form">
        <input
          className="idea-input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="idea-textarea"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="idea-label">
          Importance
          <input
            type="number"
            min="1"
            max="5"
            value={importance}
            onChange={(e) => setImportance(Number(e.target.value))}
          />
        </label>
        <label className="idea-label">
          Implemented
          <input
            type="checkbox"
            checked={implemented}
            onChange={(e) => setImplemented(e.target.checked)}
          />
        </label>
        <button className="save-button" onClick={addIdea}>Add</button>
      </div>
      <table className="ideas-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Implemented</th>
            <th>Date</th>
            <th>Importance</th>
          </tr>
        </thead>
        <tbody>
          {ideas.map((i) => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td>
                {i.description.length > 30 ? (
                  <button className="desc-button" onClick={() => setView(i)}>
                    {i.description.slice(0, 30)}...
                  </button>
                ) : (
                  i.description
                )}
              </td>
              <td>{i.implemented ? 'Yes' : 'No'}</td>
              <td>{new Date(i.date).toLocaleDateString()}</td>
              <td>{i.importance}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {view && (
        <div className="modal-overlay" onClick={() => setView(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{view.name}</h3>
            <pre className="idea-desc">{view.description}</pre>
            <div className="actions">
              <button className="save-button" onClick={() => setView(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
