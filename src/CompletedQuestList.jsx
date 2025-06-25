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

  const count = completed.length;

  return (
    <details className="completed-section">
      <summary className="completed-summary">{`Completed Quests (${count})`}</summary>
      <div className="quest-list">
        {completed.map((q) => (
          <details key={q.id} className="quest-banner quest-details">
            <summary>
              <div className="quest-info">
                <div className="quest-name">{q.name}</div>
                <div className="quest-quadrant">{q.quadrant}</div>
              </div>
            </summary>
            {q.description && <div className="quest-log">{q.description}</div>}
          </details>
        ))}
      </div>
    </details>
  );
}
