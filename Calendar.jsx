import React from 'react';
import './placeholder-app.css';

export default function Calendar({ onBack }) {
  return (
    <div className="placeholder-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <p>Calendar coming soon...</p>
    </div>
  );
}
