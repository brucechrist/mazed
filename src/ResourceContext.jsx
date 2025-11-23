import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from './supabaseClient';

const ResourceContext = createContext();

export function ResourceProvider({ children }) {
  const [resource, setResource] = useState(() => {
    const stored = localStorage.getItem('worldResource');
    return stored ? parseInt(stored, 10) : 0;
  });

  const [xResource, setXResource] = useState(() => {
    const stored = localStorage.getItem('worldXResource');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setResource((r) => r + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!navigator.onLine) return;
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabaseClient
        .from('profiles')
        .select('resources, x_resources')
        .eq('id', user.id)
        .single();
      if (data) {
        if (typeof data.resources === 'number') {
          setResource(data.resources);
        }
        if (typeof data.x_resources === 'number') {
          setXResource(data.x_resources);
        }
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (event.detail && typeof event.detail.resource === 'number') {
        setResource(event.detail.resource);
      }
      if (event.detail && typeof event.detail.xResource === 'number') {
        setXResource(event.detail.xResource);
      }
    };
    window.addEventListener('resourceChange', handler);
    return () => window.removeEventListener('resourceChange', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('worldResource', resource);
    localStorage.setItem('worldXResource', xResource);
    if (userId && navigator.onLine) {
      supabaseClient
        .from('profiles')
        .update({ resources: resource, x_resources: xResource })
        .eq('id', userId);
    }
  }, [resource, xResource, userId]);

  const add = (amount) => setResource((r) => r + amount);
  const spend = (amount) => setResource((r) => Math.max(0, r - amount));

  const addX = (amount) => setXResource((r) => r + amount);
  const spendX = (amount) => setXResource((r) => Math.max(0, r - amount));

  return (
    <ResourceContext.Provider value={{ resource, xResource, add, spend, addX, spendX }}>
      {children}
    </ResourceContext.Provider>
  );
}

export function useResource() {
  return useContext(ResourceContext);
}
