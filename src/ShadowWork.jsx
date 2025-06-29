import React from 'react';
import './placeholder-app.css';

export default function ShadowWork({ onBack }) {
  return (
    <div className="placeholder-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <p>Shadow Work coming soon...</p>
    </div>
  );
}
