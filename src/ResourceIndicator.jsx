import React from 'react';
import { useResource } from './ResourceContext.jsx';
import './resource-indicator.css';

export default function ResourceIndicator() {
  const { resource, xResource } = useResource();

  return (
    <div className="resource-box">
      <div className="resource-circle">{resource} R</div>
      <div className="resource-circle">{xResource} X</div>
    </div>
  );
}
