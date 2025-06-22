import React, { useState } from 'react';
import './styles.css';
import StatsQuadrant from './StatsQuadrant.jsx';
import NofapCalendar from './NofapCalendar.jsx';
import VersionRating from './VersionRating.jsx';
import QuestJournal from './QuestJournal.jsx';
import World from './World.jsx';
import FriendsList from './FriendsList.jsx';
import ProfileModal from './ProfileModal.jsx';
import VersionLabel from './VersionLabel.jsx';

const tabs = [
  { label: 'Training', icon: '🧠' },
  { label: 'Character', icon: '👤' },
  { label: 'World', icon: '🌍' },
  { label: 'Friends', icon: '🤝' },
];

export default function QuadrantPage({ initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0].label);
  const [showJournal, setShowJournal] = useState(false);
  const [showNofap, setShowNofap] = useState(false);
  const [showRatings, setShowRatings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

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
        <div className="bottom-buttons">
          <div className="profile-button" onClick={() => setShowProfile(true)}>
            👤
          </div>
          <div className="home-button" onClick={() => window.location.reload()}>
            🏠
          </div>
        </div>
      </aside>
      <div className="content">
        <h1>{activeTab}</h1>
        {activeTab === 'Character' && <StatsQuadrant />}
        {activeTab === 'Training' && (
          <div className="training-layout">
            {showJournal ? (
              <QuestJournal onBack={() => setShowJournal(false)} />
            ) : showNofap ? (
              <NofapCalendar onBack={() => setShowNofap(false)} />
            ) : showRatings ? (
              <VersionRating onBack={() => setShowRatings(false)} />
            ) : (
              <div className="feature-cards">
                <div className="app-card" onClick={() => setShowJournal(true)}>
                  <div className="journal-icon">📓</div>
                  <span>Quest Journal</span>
                </div>
                <div className="app-card" onClick={() => setShowNofap(true)}>
                  <div className="calendar-preview" />
                  <span>NoFap Calendar</span>
                </div>
                <div className="app-card" onClick={() => setShowRatings(true)}>
                  <div className="star-icon">⭐⭐⭐⭐⭐</div>
                  <span>Version Ratings</span>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'World' && <World />}
        {activeTab === 'Friends' && <FriendsList />}
      </div>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      <VersionLabel />
    </div>
  );
}
