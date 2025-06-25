import React from 'react';
import { useQuests } from './QuestContext.jsx';
import './world.css';

export default function CompletedQuestList() {
  const { quests } = useQuests();

  const completed = quests.filter((q) => q.completed);
  const groups = completed.reduce((acc, q) => {
    const t = q.type || 'user';
    if (!acc[t]) acc[t] = [];
    acc[t].push(q);
    return acc;
  }, {});

  return (
    <details className="completed-section">
      <summary className="completed-summary">Completed Quests</summary>
      {Object.entries(groups).map(([type, list]) => (
        <div key={type}>
          <h5>{type.charAt(0).toUpperCase() + type.slice(1)} Quests</h5>
          <div className="quest-list">
            {list.map((q) => (
              <details key={q.id} className="quest-banner quest-details">
                <summary>
                  <div className="quest-info">
                    <div className="quest-name">{q.name}</div>
                    <div className="quest-quadrant">{q.quadrant}</div>
                  </div>
                </summary>
                {q.description && (
                  <div className="quest-log">{q.description}</div>
                )}
              </details>
            ))}
          </div>
        </div>
      ))}
    </details>
  );
}
