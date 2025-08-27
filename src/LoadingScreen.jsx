import React from 'react';
import './loading-screen.css';

export default function LoadingScreen() {
  return (
    <div className="loading-overlay">
      <div className="loading-bar">
        <div className="loading-bar-progress" />
      </div>
    </div>
  );
}
