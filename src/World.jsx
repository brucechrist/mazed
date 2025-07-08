import React, { useState, useEffect } from 'react';
import QuestModal from './QuestModal.jsx';
import MainQuestModal from './MainQuestModal.jsx';
import { supabaseClient } from './supabaseClient';
import { useQuests } from './QuestContext.jsx';
import './world.css';

export default function World() {
  const [resource, setResource] = useState(() => {
    const stored = localStorage.getItem('resourceR');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [xResource, setXResource] = useState(() => {
    const stored = localStorage.getItem('resourceX');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [userId, setUserId] = useState(null);
  const { quests, addQuest, acceptQuest } = useQuests();
  const [showModal, setShowModal] = useState(false);
  const [profile, setProfile] = useState({});
  const [needsMainQuest, setNeedsMainQuest] = useState(false);
  const [showMainQuest, setShowMainQuest] = useState(false);
  const [showPublished, setShowPublished] = useState(false);

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
      } = await supabaseClient.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profileData } = await supabaseClient
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
      // quests are loaded via QuestProvider
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
      supabaseClient.from('profiles').update({ resources: resource }).eq('id', userId);
    }
  }, [resource, userId]);

  useEffect(() => {
    localStorage.setItem('resourceX', xResource);
  }, [xResource]);

  const handleQuestAdd = (q) => {
    addQuest(q);
    setShowPublished(true);
    setTimeout(() => setShowPublished(false), 1500);
  };

  // quests are managed via QuestProvider

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
        <QuestModal onAdd={handleQuestAdd} onClose={() => setShowModal(false)} />
      )}
      {showMainQuest && (
        <MainQuestModal
          onClose={() => setShowMainQuest(false)}
          onSaved={(p) => {
            setProfile({ ...profile, ...p });
            setNeedsMainQuest(false);
            addQuest({
              id: Date.now(),
              name: 'MBTI & Enneagram',
              description:
                `MBTI: ${p.mbti}\nEnneagram: ${p.enneagram}` +
                (p.instinct ? `\nInstinct: ${p.instinct}` : ''),
              quadrant: 'II',
              resource: 0,
              rarity: 'A',
              urgent: true,
              accepted: true,
              completed: true,
              type: 'main',
            });
          }}
          initialMbti={profile.mbti || ''}
          initialEnneagram={profile.enneagram || ''}
          initialInstinct={profile.instinct || ''}
        />
      )}
      <h3 className="contracts-header">Contracts</h3>
      <div className="contracts-grid">
        <div className="contracts-tall-column">
          <div className="contract-box tall" id="contract-tall-1" />
          <div className="contract-box tall" id="contract-tall-2" />
        </div>
        <div className="contracts-wide-column">
          <div className="contract-box wide" id="contract-wide-top" />
          <div className="contract-box wide" id="contract-wide-bottom" />
        </div>
        <div className="contracts-small-grid">
          <div className="contract-box small" id="contract-small-1" />
          <div className="contract-box small" id="contract-small-2" />
          <div className="contract-box small" id="contract-small-3" />
          <div className="contract-box small" id="contract-small-4" />
        </div>
      </div>
      <div className="resource-box">{resource} R | {xResource} X</div>
      {showPublished && (
        <div className="published-popup">
          <span className="checkmark">✔</span> Quest published
        </div>
      )}
    </div>
  );
}
