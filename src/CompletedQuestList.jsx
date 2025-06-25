import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './world.css';

export default function CompletedQuestList() {
  const [quests, setQuests] = useState([]);

  // load quests from local storage and keep in sync
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

  // fetch quests from supabase on mount
  useEffect(() => {
    const loadQuests = async () => {
      if (!navigator.onLine) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id);
      if (data) {
        setQuests(data);
        localStorage.setItem('quests', JSON.stringify(data));
      }
    };
    loadQuests();
  }, []);


  const completed = quests.filter((q) => q.completed);

  return (
    <details className="completed-section">
      <summary className="completed-summary">Completed Quests</summary>
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
