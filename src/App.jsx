import React, { useState } from 'react';
import './styles.css';
import StatsQuadrant from './StatsQuadrant.jsx';
import World from './World.jsx';
import FriendsList from './FriendsList.jsx';
import QuestJournal from './QuestJournal.jsx';


const tabs = [
  { label: 'Training', icon: '🧠' },
  { label: 'Character', icon: '👤' },
  { label: 'World', icon: '🌍' },
  { label: 'Friends', icon: '🤝' },
];

export default function QuadrantPage({ initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0].label);

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
          </div>
        ))}
                <div className="home-button" onClick={() => window.location.reload()}>
          🏠
        </div>
      </aside>
      <div className="content">
        <h1>{activeTab}</h1>
        {activeTab === 'Character' && <StatsQuadrant />}
        {activeTab === 'Training' && <QuestJournal />}
        {activeTab === 'World' && <World />}
        {activeTab === 'Friends' && <FriendsList />}
      </div>
    </div>
  );
}
