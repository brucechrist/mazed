import React from 'react';
import './placeholder-app.css';

export default function Timeline({ onBack }) {
  return (
    <div className="placeholder-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <p>Timeline coming soon...</p>
    </div>
  );
}
