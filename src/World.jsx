import React, { useState, useEffect } from 'react';
import QuestModal from './QuestModal.jsx';
import './world.css';
import { supabase } from './supabaseClient.js';

export default function World() {
  const [resource, setResource] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quests, setQuests] = useState(() => {
    const stored = localStorage.getItem('quests');
    return stored ? JSON.parse(stored) : [];
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('resources')
          .eq('id', user.id)
          .single();
        if (data && typeof data.resources === 'number') {
          setResource(data.resources);
        }
      }
      setLoading(false);
    };
    load();
    const id = setInterval(() => {
      setResource((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(id);
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
    if (loading) return;
    const save = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ resources: resource })
          .eq('id', user.id);
        window.dispatchEvent(new CustomEvent('resourceChange', { detail: { resource } }));
      }
    };
    save();
  }, [resource, loading]);

  useEffect(() => {
    localStorage.setItem('quests', JSON.stringify(quests));
    window.dispatchEvent(new Event('questsChange'));
  }, [quests]);

  const addQuest = (q) => {
    setQuests([...quests, q]);
  };

  const acceptQuest = (id) => {
    setQuests(
      quests.map((q) => (q.id === id ? { ...q, accepted: true } : q))
    );
  };

  return (
    <div className="world-container">
      <h3 className="quest-header">
        Quest
        <button className="add-quest" onClick={() => setShowModal(true)}>+
        </button>
      </h3>
      <div className="quest-list">
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
      <div className="resource-box">{resource} R</div>
    </div>
  );
}
