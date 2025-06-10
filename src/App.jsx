import React, { useState } from 'react';
import './styles.css';

const tabs = [
  { label: 'Training', icon: '🧠' },
  { label: 'Character', icon: '👤' },
  { label: 'World', icon: '🌍' },
  { label: 'Friends', icon: '🤝' },
];

function Landing({ onSelect }) {
  return (
    <div className="landing">
      <div className="main">
        <div className="up">
          <button className="card card1" onClick={() => onSelect('Training')}>🧠</button>
          <button className="card card2" onClick={() => onSelect('Character')}>👤</button>
        </div>
        <div className="down">
          <button className="card card3" onClick={() => onSelect('World')}>🌍</button>
          <button className="card card4" onClick={() => onSelect('Friends')}>🤝</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState(null);

  if (!activeTab) {
    return <Landing onSelect={setActiveTab} />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        {tabs.map((tab) => (
          <div
            key={tab.label}
            className={`tab ${activeTab === tab.label ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.label)}
          >
            <span className="icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </div>
        ))}
      </aside>
      <div className="content">
        <h1>{activeTab}</h1>
      </div>
    </div>
  );
}
