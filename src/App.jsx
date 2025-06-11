import React, { useState } from 'react';
import './styles.css';
import QuadrantMenu from './QuadrantMenu.jsx';

const tabs = [
  { label: 'Training', icon: '🧠' },
  { label: 'Character', icon: '👤' },
  { label: 'World', icon: '🌍' },
  { label: 'Friends', icon: '🤝' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(tabs[0].label);
  const [showMenu, setShowMenu] = useState(true);

  const handleSelect = (label) => {
    setActiveTab(label);
    setShowMenu(false);
  };

  if (showMenu) {
    return <QuadrantMenu onSelect={handleSelect} />;
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
