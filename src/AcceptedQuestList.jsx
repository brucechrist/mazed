import React, { useState } from 'react';
import { RIcon } from './ResourceIcons.jsx';
import { useQuests } from './QuestContext.jsx';
import './world.css';

export default function AcceptedQuestList() {
  const { quests, completeQuest } = useQuests();
  const [expanded, setExpanded] = useState(null);

  const accepted = quests.filter((q) => q.accepted && !q.completed);
  const groups = accepted.reduce((acc, q) => {
    const t = q.type || 'user';
    if (!acc[t]) acc[t] = [];
    acc[t].push(q);
    return acc;
  }, {});

  return (
    <div>
      <h4>Accepted Quest</h4>
      {Object.entries(groups).map(([type, list]) => (
        <div key={type}>
          <h5>{type.charAt(0).toUpperCase() + type.slice(1)} Quests</h5>
          <div className="quest-list">
            {list.map((q) => (
              <div key={q.id}>
                <div className="quest-banner">
                  <div className="quest-info">
                    <div className="quest-name">{q.name}</div>
                    <div className="quest-quadrant">{q.quadrant}</div>
                    <div className="quest-rarity">{q.rarity || 'C'}</div>
                    {q.urgent && <div className="quest-urgent">Urgent</div>}
                    {q.resource !== 0 && (
                      <div className="quest-resource">
                        {q.resource > 0 ? '+' : ''}
                        {q.resource} <RIcon />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {q.description && (
                      <button
                        className="info-button"
                        onClick={() =>
                          setExpanded(expanded === q.id ? null : q.id)
                        }
                      >
                        i
                      </button>
                    )}
                    <button
                      className="accept-button"
                      onClick={() => completeQuest(q.id)}
                    >
                      Complete
                    </button>
                  </div>
                </div>
                {expanded === q.id && q.description && (
                  <div className="quest-log">{q.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
