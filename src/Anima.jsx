import React from 'react';
import './placeholder-app.css';

export default function Anima({ onBack }) {
  return (
    <div className="placeholder-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <p>Anima coming soon...</p>
    </div>
  );
}
