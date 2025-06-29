import React, { createContext, useContext, useEffect, useState } from 'react';

const ResourceContext = createContext();

export function ResourceProvider({ children }) {
  const [resource, setResource] = useState(() => {
    const stored = localStorage.getItem('worldResource');
    return stored ? parseInt(stored, 10) : 0;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setResource((r) => r + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('worldResource', resource);
  }, [resource]);

  const add = (amount) => setResource((r) => r + amount);
  const spend = (amount) => setResource((r) => Math.max(0, r - amount));

  return (
    <ResourceContext.Provider value={{ resource, add, spend }}>
      {children}
    </ResourceContext.Provider>
  );
}

export function useResource() {
  return useContext(ResourceContext);
}
