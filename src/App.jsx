import React, { useState, useEffect } from 'react';
import './styles.css';
import StatsQuadrant from './StatsQuadrant.jsx';
import NofapCalendar from './NofapCalendar.jsx';
import VersionRating from './VersionRating.jsx';
import QuestJournal from './QuestJournal.jsx';
import WhoAmI from './WhoAmI.jsx';
import MusicSearch from './MusicSearch.jsx';
import Singing from './Singing.jsx';
import ShadowWork from './ShadowWork.jsx';
import Calendar from './Calendar.jsx';
import Typomancy from './Typomancy.jsx';
import Moodtracker from './Moodtracker.jsx';
import World from './World.jsx';
import FriendsList from './FriendsList.jsx';
import ProfileModal from './ProfileModal.jsx';
import { supabase } from './supabaseClient';
import VersionLabel from './VersionLabel.jsx';
import { QuestProvider } from './QuestContext.jsx';

const placeholderImg =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'50'%20height%3D'50'%3E%3Crect%20width%3D'50'%20height%3D'50'%20rx%3D'25'%20fill%3D'%23444'%2F%3E%3Ctext%20x%3D'25'%20y%3D'33'%20font-size%3D'26'%20text-anchor%3D'middle'%20fill%3D'%23aaa'%3E%3F%3C%2Ftext%3E%3C%2Fsvg%3E";

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
  const [showWhoAmI, setShowWhoAmI] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [showSinging, setShowSinging] = useState(false);
  const [showShadowWork, setShowShadowWork] = useState(false);
  const [showCalendarApp, setShowCalendarApp] = useState(false);
  const [showTypomancy, setShowTypomancy] = useState(false);
  const [showMoodtracker, setShowMoodtracker] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(placeholderImg);

  useEffect(() => {
    const loadAvatar = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const storedPath = localStorage.getItem(`avatarPath_${user.id}`);
      if (storedPath) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(storedPath);
        setAvatarUrl(data.publicUrl);
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (profile?.avatar_url) {
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(profile.avatar_url);
        setAvatarUrl(data.publicUrl);
        localStorage.setItem(`avatarPath_${user.id}`, profile.avatar_url);
        localStorage.setItem(`avatarUrl_${user.id}`, data.publicUrl);
      }
    };
    loadAvatar();
  }, []);

  const handleAvatarUpdated = (_path, url) => {
    setAvatarUrl(url);
  };

  return (
    <QuestProvider>
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
            <img className="sidebar-avatar" src={avatarUrl} alt="Profile" />
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
            ) : showWhoAmI ? (
              <WhoAmI onBack={() => setShowWhoAmI(false)} />
            ) : showMusic ? (
              <MusicSearch onBack={() => setShowMusic(false)} />
            ) : showSinging ? (
              <Singing onBack={() => setShowSinging(false)} />
            ) : showShadowWork ? (
              <ShadowWork onBack={() => setShowShadowWork(false)} />
            ) : showCalendarApp ? (
              <Calendar onBack={() => setShowCalendarApp(false)} />
            ) : showTypomancy ? (
              <Typomancy onBack={() => setShowTypomancy(false)} />
            ) : showMoodtracker ? (
              <Moodtracker onBack={() => setShowMoodtracker(false)} />
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
                <div className="app-card" onClick={() => setShowWhoAmI(true)}>
                  <div className="question-icon">❓</div>
                  <span>Who Am I?</span>
                </div>
                <div className="app-card" onClick={() => setShowMusic(true)}>
                  <div className="star-icon">🎵</div>
                  <span>Music Search</span>
                </div>
                <div className="app-card" onClick={() => setShowSinging(true)}>
                  <div className="star-icon">🎤</div>
                  <span>Singing</span>
                </div>
                <div className="app-card" onClick={() => setShowShadowWork(true)}>
                  <div className="star-icon">🌑</div>
                  <span>Shadow Work</span>
                </div>
                <div className="app-card" onClick={() => setShowCalendarApp(true)}>
                  <div className="star-icon">📅</div>
                  <span>Calendar</span>
                </div>
                <div className="app-card" onClick={() => setShowTypomancy(true)}>
                  <div className="star-icon">⌨️</div>
                  <span>Typomancy</span>
                </div>
                <div className="app-card" onClick={() => setShowMoodtracker(true)}>
                  <div className="star-icon">😊</div>
                  <span>Moodtracker</span>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'World' && <World />}
        {activeTab === 'Friends' && <FriendsList />}
      </div>
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onAvatarUpdated={handleAvatarUpdated}
        />
      )}
        <VersionLabel />
      </div>
    </QuestProvider>
  );
}
