import React from 'react';
import './placeholder-app.css';

export default function Typomancy({ onBack }) {
  return (
    <div className="placeholder-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <p>Typomancy coming soon...</p>
    </div>
  );
}
