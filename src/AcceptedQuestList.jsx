import React, { useState, useEffect } from 'react';
import './world.css';

export default function AcceptedQuestList() {
  const [quests, setQuests] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('quests');
    setQuests(stored ? JSON.parse(stored) : []);
    const handler = () => {
      const updated = localStorage.getItem('quests');
      setQuests(updated ? JSON.parse(updated) : []);
    };
    window.addEventListener('questsChange', handler);
    return () => window.removeEventListener('questsChange', handler);
  }, []);

  const completeQuest = (id) => {
    const all = quests.map((q) => {
      if (q.id === id) {
        const newResource = (parseInt(localStorage.getItem('resourceR') || '0', 10) + (q.resource || 0));
        localStorage.setItem('resourceR', newResource);
        window.dispatchEvent(new CustomEvent('resourceChange', { detail: { resource: newResource } }));
        return { ...q, completed: true };
      }
      return q;
    });
    setQuests(all);
    localStorage.setItem('quests', JSON.stringify(all));
    window.dispatchEvent(new Event('questsChange'));
  };

  return (
    <div>
      <h4>Accepted Quest</h4>
      <div className="quest-list">
        {quests.filter((q) => q.accepted && !q.completed).map((q) => (
          <div key={q.id} className="quest-banner">
            <div className="quest-info">
              <div className="quest-name">{q.name}</div>
              <div className="quest-quadrant">{q.quadrant}</div>
              {q.resource !== 0 && (
                <div className="quest-resource">
                  {q.resource > 0 ? '+' : ''}{q.resource} R
                </div>
              )}
            </div>
            <button className="accept-button" onClick={() => completeQuest(q.id)}>
              Complete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
