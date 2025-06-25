import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

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
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
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
      quests.forEach((q) =>
        supabase.from('quests').upsert({ ...q, user_id: userId })
      );
    }
  }, [quests, userId]);

  const addQuest = (q) => {
    setQuests((prev) => [...prev, q]);
    if (userId && navigator.onLine) {
      supabase.from('quests').insert({ ...q, user_id: userId });
    }
  };

  const acceptQuest = (id) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, accepted: true } : q))
    );
    if (userId && navigator.onLine) {
      supabase
        .from('quests')
        .update({ accepted: true })
        .eq('user_id', userId)
        .eq('id', id);
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
            supabase.from('profiles').update({ resources: newResource }).eq('id', userId);
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
      supabase
        .from('quests')
        .update({ completed: true })
        .eq('user_id', userId)
        .eq('id', id);
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
