import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './world.css';

export default function CompletedQuestList() {
  const [quests, setQuests] = useState([]);
  const [profileQuest, setProfileQuest] = useState(null);

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

  // fetch profile for MBTI/Enneagram quest
  useEffect(() => {
    const loadProfile = async () => {
      if (!navigator.onLine) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('mbti, enneagram, instinct')
        .eq('id', user.id)
        .single();
      if (data && data.mbti && data.enneagram) {
        const log = `MBTI: ${data.mbti}\nEnneagram: ${data.enneagram}` +
          (data.instinct ? `\nInstinct: ${data.instinct}` : '');
        setProfileQuest({ id: 'profile', name: 'MBTI & Enneagram', log });
      }
    };
    loadProfile();
  }, []);

  const completed = quests.filter((q) => q.completed);

  return (
    <details className="completed-section" open={false}>
      <summary className="completed-summary">Completed Quests</summary>
      <div className="quest-list">
        {profileQuest && (
          <details className="quest-banner quest-details">
            <summary>{profileQuest.name}</summary>
            <div className="quest-log">{profileQuest.log}</div>
          </details>
        )}
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
