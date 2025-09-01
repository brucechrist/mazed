import React from 'react';
import './placeholder-app.css';

export default function Watchdog({ onBack }) {
  return (
    <div className="placeholder-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <h2>Watchdog</h2>
      <p>Coming soon...</p>
    </div>
  );
}
