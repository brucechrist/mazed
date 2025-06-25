import React from 'react';
import { useQuests } from './QuestContext.jsx';
import './world.css';

export default function AcceptedQuestList() {
  const { quests, completeQuest } = useQuests();

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
