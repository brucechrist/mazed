import React from 'react';
import './placeholder-app.css';

export default function Moodtracker({ onBack }) {
  return (
    <div className="placeholder-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <p>Moodtracker coming soon...</p>
    </div>
  );
}
