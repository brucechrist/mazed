import React from 'react';
import { useResource } from './ResourceContext.jsx';
import { RIcon, XIcon } from './ResourceIcons.jsx';
import './resource-indicator.css';

export default function ResourceIndicator() {
  const { resource, xResource } = useResource();

  return (
    <div className="resource-box">
      <div className="resource-circle">
        {resource} <RIcon />
      </div>
      <div className="resource-circle">
        {xResource} <XIcon />
      </div>
    </div>
  );
}
