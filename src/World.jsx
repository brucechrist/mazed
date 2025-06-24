import React, { useState, useEffect } from 'react';
import QuestModal from './QuestModal.jsx';
import MainQuestModal from './MainQuestModal.jsx';
import { supabase } from './supabaseClient';
import './world.css';

export default function World() {
  const [resource, setResource] = useState(() => {
    const stored = localStorage.getItem('resourceR');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [userId, setUserId] = useState(null);
  const [quests, setQuests] = useState(() => {
    const stored = localStorage.getItem('quests');
    return stored ? JSON.parse(stored) : [];
  });
  const [showModal, setShowModal] = useState(false);
  const [profile, setProfile] = useState({});
  const [needsMainQuest, setNeedsMainQuest] = useState(false);
  const [showMainQuest, setShowMainQuest] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setResource((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!navigator.onLine) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('resources, mbti, enneagram, instinct')
        .eq('id', user.id)
        .single();
      if (profileData) {
        if (typeof profileData.resources === 'number') {
          setResource(profileData.resources);
        }
        setProfile(profileData);
        setNeedsMainQuest(!profileData.mbti || !profileData.enneagram);
      }
      const { data: questsData } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id);
      if (questsData) {
        setQuests(questsData);
        localStorage.setItem('quests', JSON.stringify(questsData));
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && typeof e.detail.resource === 'number') {
        setResource(e.detail.resource);
      }
    };
    window.addEventListener('resourceChange', handler);
    return () => window.removeEventListener('resourceChange', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('resourceR', resource);
    if (userId && navigator.onLine) {
      supabase.from('profiles').update({ resources: resource }).eq('id', userId);
    }
  }, [resource, userId]);

  useEffect(() => {
    localStorage.setItem('quests', JSON.stringify(quests));
    window.dispatchEvent(new Event('questsChange'));
    if (userId && navigator.onLine) {
      quests.forEach((q) =>
        supabase.from('quests').upsert({ ...q, user_id: userId })
      );
    }
  }, [quests, userId]);

  const addQuest = (q) => {
    setQuests([...quests, q]);
    if (userId && navigator.onLine) {
      supabase.from('quests').insert({ ...q, user_id: userId });
    }
  };

  const acceptQuest = (id) => {
    setQuests(
      quests.map((q) => (q.id === id ? { ...q, accepted: true } : q))
    );
    if (userId && navigator.onLine) {
      supabase
        .from('quests')
        .update({ accepted: true })
        .eq('user_id', userId)
        .eq('id', id);
    }
  };

  return (
    <div className="world-container">
      <h3 className="quest-header">
        Quest
        <button className="add-quest" onClick={() => setShowModal(true)}>+
        </button>
      </h3>
      <div className="quest-list">
        {needsMainQuest && (
          <div
            className="quest-banner main-quest-banner"
            onClick={() => setShowMainQuest(true)}
          >
            Main Quest
          </div>
        )}
        {quests.filter((q) => !q.accepted && !q.completed).map((q) => (
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
            <button
              className="accept-button"
              onClick={() => acceptQuest(q.id)}
            >
              ✔
            </button>
          </div>
        ))}
      </div>
      {showModal && (
        <QuestModal onAdd={addQuest} onClose={() => setShowModal(false)} />
      )}
      {showMainQuest && (
        <MainQuestModal
          onClose={() => setShowMainQuest(false)}
          onSaved={(p) => {
            setProfile({ ...profile, ...p });
            setNeedsMainQuest(false);
          }}
          initialMbti={profile.mbti || ''}
          initialEnneagram={profile.enneagram || ''}
          initialInstinct={profile.instinct || ''}
        />
      )}
      <div className="resource-box">{resource} R</div>
    </div>
  );
}
