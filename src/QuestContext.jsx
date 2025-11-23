import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from './supabaseClient';

export const QuestContext = createContext();

export function QuestProvider({ children }) {
  const [quests, setQuests] = useState(() => {
    const stored = localStorage.getItem('quests');
    return stored ? JSON.parse(stored) : [];
  });
  const [userId, setUserId] = useState(null);

  const normalizeQuest = (quest) => ({
    ...quest,
    resource_r:
      typeof quest.resource_r === 'number'
        ? quest.resource_r
        : typeof quest.resource === 'number'
          ? quest.resource
          : 0,
    resource_x: typeof quest.resource_x === 'number' ? quest.resource_x : 0,
    resource:
      typeof quest.resource === 'number'
        ? quest.resource
        : typeof quest.resource_r === 'number'
          ? quest.resource_r
          : 0,
  });

  const buildQuestPayload = (quest) => ({
    id: quest.id,
    user_id: userId,
    type: quest.type || 'user',
    name: quest.name,
    description: quest.description,
    quadrant: quest.quadrant,
    resource_r: quest.resource_r,
    resource_x: quest.resource_x,
    rarity: quest.rarity,
    urgent: quest.urgent,
    accepted: quest.accepted,
    completed: quest.completed,
  });

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
        const normalized = data.map(normalizeQuest);
        setQuests(normalized);
        localStorage.setItem('quests', JSON.stringify(normalized));
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
          supabaseClient.from('quests').upsert(buildQuestPayload(q));
        }
      });
    }
  }, [quests, userId]);

  const addQuest = (q) => {
    const quest = normalizeQuest({
      rarity: 'C',
      urgent: false,
      ...q,
    });
    setQuests((prev) => [...prev, quest]);
    if (userId && navigator.onLine && (quest.type === 'main' || quest.urgent)) {
      supabaseClient.from('quests').insert(buildQuestPayload(quest));
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
    const quest = quests.find((q) => q.id === id);
    const rewardR = quest?.resource || 0;
    const rewardX = quest?.xResource || quest?.x_resource || 0;
    const currentR = parseInt(localStorage.getItem('resourceR') || '0', 10);
    const currentX = parseInt(localStorage.getItem('resourceX') || '0', 10);
    const newResource = currentR + rewardR;
    const newXResource = currentX + rewardX;

    localStorage.setItem('resourceR', newResource);
    localStorage.setItem('resourceX', newXResource);
    if (userId && navigator.onLine) {
      supabaseClient
        .from('profiles')
        .update({ resources: newResource, x_resources: newXResource })
        .eq('id', userId);
    }
    window.dispatchEvent(
      new CustomEvent('resourceChange', {
        detail: { resource: newResource, xResource: newXResource },
      })
    );

    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          return { ...q, completed: true };
        }
        return q;
      })
    );
    if (userId && navigator.onLine) {
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
