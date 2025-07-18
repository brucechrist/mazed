import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from './supabaseClient';

export const QuestContext = createContext();

export function QuestProvider({ children }) {
  const [quests, setQuests] = useState(() => {
    const stored = localStorage.getItem('quests');
    return stored ? JSON.parse(stored) : [];
  });
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!navigator.onLine) return;
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabaseClient
        .from('quests')
        .select('*')
        .eq('user_id', user.id);
      if (data) {
        setQuests(data);
        localStorage.setItem('quests', JSON.stringify(data));
      }
    };
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem('quests', JSON.stringify(quests));
    window.dispatchEvent(new Event('questsChange'));
    if (userId && navigator.onLine) {
      quests.forEach((q) => {
        if (q.type === 'main' || q.urgent) {
          supabaseClient.from('quests').upsert({ ...q, user_id: userId });
        }
      });
    }
  }, [quests, userId]);

  const addQuest = (q) => {
    const quest = {
      rarity: 'C',
      urgent: false,
      ...q,
    };
    setQuests((prev) => [...prev, quest]);
    if (userId && navigator.onLine && (quest.type === 'main' || quest.urgent)) {
      supabaseClient.from('quests').insert({ ...quest, user_id: userId });
    }
  };

  const acceptQuest = (id) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, accepted: true } : q))
    );
    if (userId && navigator.onLine) {
      const quest = quests.find((q) => q.id === id);
      if (quest && (quest.type === 'main' || quest.urgent)) {
        supabaseClient
          .from('quests')
          .update({ accepted: true })
          .eq('user_id', userId)
          .eq('id', id);
      }
    }
  };

  const completeQuest = (id) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const newResource =
            parseInt(localStorage.getItem('resourceR') || '0', 10) +
            (q.resource || 0);
          localStorage.setItem('resourceR', newResource);
          if (userId && navigator.onLine) {
            supabaseClient.from('profiles').update({ resources: newResource }).eq('id', userId);
          }
          window.dispatchEvent(
            new CustomEvent('resourceChange', { detail: { resource: newResource } })
          );
          return { ...q, completed: true };
        }
        return q;
      })
    );
    if (userId && navigator.onLine) {
      const quest = quests.find((q) => q.id === id);
      if (quest && (quest.type === 'main' || quest.urgent)) {
        supabaseClient
          .from('quests')
          .update({ completed: true })
          .eq('user_id', userId)
          .eq('id', id);
      }
    }
  };

  return (
    <QuestContext.Provider value={{ quests, addQuest, acceptQuest, completeQuest }}>
      {children}
    </QuestContext.Provider>
  );
}

export function useQuests() {
  return useContext(QuestContext);
}
