import React, { useState, useEffect } from 'react';
import './world.css';
import { supabase } from './supabaseClient.js';

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

  const completeQuest = async (id) => {
    const completed = quests.find((q) => q.id === id);
    const all = quests.map((q) => (q.id === id ? { ...q, completed: true } : q));
    setQuests(all);
    localStorage.setItem('quests', JSON.stringify(all));
    window.dispatchEvent(new Event('questsChange'));

    if (!completed) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('resources')
        .eq('id', user.id)
        .single();
      const current = (data && data.resources) || 0;
      const newResource = current + (completed.resource || 0);
      await supabase
        .from('profiles')
        .update({ resources: newResource })
        .eq('id', user.id);
      window.dispatchEvent(new CustomEvent('resourceChange', { detail: { resource: newResource } }));
    }
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
