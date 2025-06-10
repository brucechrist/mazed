import React, { useState } from 'react';
import './styles.css';
import QuadrantButton from './QuadrantButton.jsx';

const tabs = [
  { label: 'Training', icon: '🧠' },
  { label: 'Character', icon: '👤' },
  { label: 'World', icon: '🌍' },
  { label: 'Friends', icon: '🤝' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(tabs[0].label);
  const [showLanding, setShowLanding] = useState(true);

  if (showLanding) {
    return (
      <div className="landing-container">
        <QuadrantButton
          onSelect={(tab) => {
            setActiveTab(tab);
            setShowLanding(false);
          }}
        />
      </div>
    );
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
