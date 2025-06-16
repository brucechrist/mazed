import React, { useState, useEffect } from 'react';
import './world.css';

export default function World() {
  const [resource, setResource] = useState(() => {
    const stored = localStorage.getItem('resourceR');
    return stored ? parseInt(stored, 10) : 0;
  });

  useEffect(() => {
    const id = setInterval(() => {
      setResource((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem('resourceR', resource);
  }, [resource]);

  return (
    <div className="world-container">
      <div className="resource-box">{resource} R</div>
    </div>
  );
}
