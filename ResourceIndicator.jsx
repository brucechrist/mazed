import React from 'react';
import { useResource } from './ResourceContext.jsx';
import './resource-indicator.css';

export default function ResourceIndicator() {
  const { resource } = useResource();

  return (
    <div className="resource-box">
      <div className="resource-circle">{resource}</div>
    </div>
  );
}
