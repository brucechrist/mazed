import React, { useState } from 'react';
import './styles.css';
import StatsQuadrant from './StatsQuadrant.jsx';
import NofapCalendar from './NofapCalendar.jsx';


const tabs = [
  { label: 'Training', icon: '🧠' },
  { label: 'Character', icon: '👤' },
  { label: 'World', icon: '🌍' },
  { label: 'Friends', icon: '🤝' },
];

export default function QuadrantPage({ initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0].label);
  const [showNofap, setShowNofap] = useState(false);

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
        {activeTab === 'Character' && <StatsQuadrant />}
        {activeTab === 'Training' && (
          showNofap ? (
            <NofapCalendar onBack={() => setShowNofap(false)} />
          ) : (
            <div className="app-card" onClick={() => setShowNofap(true)}>
              <div className="calendar-preview" />
              <span>NoFap Calendar</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
