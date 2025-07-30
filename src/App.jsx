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
import Timeline from './Timeline.jsx';
import Typomancy from './Typomancy.jsx';
import Moodtracker from './Moodtracker.jsx';
import Anima from './Anima.jsx';
import TrainingBlog from './TrainingBlog.jsx';
import QuadrantCombinaisons from './QuadrantCombinaisons.jsx';
import World from './World.jsx';
import FriendsList from './FriendsList.jsx';
import ProfileModal from './ProfileModal.jsx';
import TodoGoals from './TodoGoals.jsx';
import ActivityApp from './ActivityApp.jsx';
import Orb from '../Orb.jsx';
import IdeaBoard from './IdeaBoard.jsx';
import ImplementationIdeas from './ImplementationIdeas.jsx';
import CharacterEvolve from './CharacterEvolve.jsx';
import SettingsModal from './SettingsModal.jsx';
import AkashicRecords from './AkashicRecords.jsx';
import { supabaseClient } from './supabaseClient';
import VersionLabel from './VersionLabel.jsx';
import { QuestProvider } from './QuestContext.jsx';
import ActivityLogger from './ActivityLogger.jsx';

const placeholderImg =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'50'%20height%3D'50'%3E%3Crect%20width%3D'50'%20height%3D'50'%20rx%3D'25'%20fill%3D'%23444'%2F%3E%3Ctext%20x%3D'25'%20y%3D'33'%20font-size%3D'26'%20text-anchor%3D'middle'%20fill%3D'%23aaa'%3E%3F%3C%2Ftext%3E%3C%2Fsvg%3E";

const tabs = [
  { label: 'Training', icon: '🧠' },
  { label: 'Character', icon: '👤' },
  { label: 'World', icon: '🌍' },
  { label: 'Friends', icon: '🤝' },
];

const layers = [
  { label: 'Form', color: 'orange' },
  { label: 'Semi-Formless', color: 'purple' },
  { label: 'Formless', color: 'white' },
];

export default function QuadrantPage({ initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0].label);
  const [activeLayer, setActiveLayer] = useState(layers[0].label);
  const [showJournal, setShowJournal] = useState(false);
  const [showNofap, setShowNofap] = useState(false);
  const [showRatings, setShowRatings] = useState(false);
  const [showWhoAmI, setShowWhoAmI] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [showSinging, setShowSinging] = useState(false);
  const [showShadowWork, setShowShadowWork] = useState(false);
  const [showCalendarApp, setShowCalendarApp] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showTypomancy, setShowTypomancy] = useState(false);
  const [showMoodtracker, setShowMoodtracker] = useState(false);
  // Blog visibility starts hidden and becomes visible when on the Form layer.
  // Use a unique name to avoid clashes with the top-level App component.
  const [showTrainingBlog, setShowTrainingBlog] = useState(false);
  const [showAnima, setShowAnima] = useState(false);
  const [showQuadrantComb, setShowQuadrantComb] = useState(false);
  const [showTodoGoals, setShowTodoGoals] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showCharacterEvolve, setShowCharacterEvolve] = useState(false);
  const [showIdeaBoard, setShowIdeaBoard] = useState(false);
  const [showImplementationIdeas, setShowImplementationIdeas] = useState(false);
  const [showOrb, setShowOrb] = useState(false);
  const [showAkashicRecords, setShowAkashicRecords] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(placeholderImg);

  const initialAppLayers = () => {
    const stored = localStorage.getItem('appLayers');
    if (stored) return JSON.parse(stored);
    return {
      journal: 'Form',
      nofap: 'Form',
      ratings: 'Form',
      whoami: 'Form',
      music: 'Form',
      singing: 'Form',
      shadow: 'Form',
      calendar: 'Form',
      timeline: 'Form',
      typomancy: 'Form',
      moodtracker: 'Form',
      quadrantComb: 'Form',
      anima: 'Form',
      todoGoals: 'Form',
      activity: 'Form',
      characterEvolve: 'Form',
      ideaBoard: 'Form',
      implementationIdeas: 'Form',
      orb: 'Form',
    };
  };

  const [appLayers, setAppLayers] = useState(initialAppLayers);
  const [contextMenu, setContextMenu] = useState(null);
  const [autoLog, setAutoLog] = useState(
    () => localStorage.getItem('autoLog') === 'true'
  );

  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  );

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (activeLayer === 'Form') setShowBlog(true);
  }, [activeLayer]);

  useEffect(() => {
    localStorage.setItem('appLayers', JSON.stringify(appLayers));
  }, [appLayers]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  useEffect(() => {
    localStorage.setItem('autoLog', autoLog ? 'true' : 'false');
  }, [autoLog]);

  useEffect(() => {
    const loadAvatar = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) return;

      const storedPath = localStorage.getItem(`avatarPath_${user.id}`);
      if (storedPath) {
        const { data } = supabaseClient.storage.from('avatars').getPublicUrl(storedPath);
        setAvatarUrl(data.publicUrl);
      }

      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (profile?.avatar_url) {
        const { data } = supabaseClient.storage
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

  const moveAppToLayer = (appId, layerLabel) => {
    setAppLayers((prev) => ({ ...prev, [appId]: layerLabel }));
  };

  const handleDragStart = (e, appId) => {
    e.dataTransfer.setData('text/plain', appId);
  };

  const handleDropOnLayer = (e, layerLabel) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain');
    if (appId) moveAppToLayer(appId, layerLabel);
  };

  const handleContextMenu = (e, appId) => {
    e.preventDefault();
    setContextMenu({ appId, x: e.clientX, y: e.clientY });
  };

  if (showCalendarApp) {
    return (
      <QuestProvider>
        <ActivityLogger enabled={autoLog} />
        <Calendar onBack={() => setShowCalendarApp(false)} />
      </QuestProvider>
    );
  }

  if (showAkashicRecords) {
    return (
      <QuestProvider>
        <ActivityLogger enabled={autoLog} />
        <AkashicRecords onBack={() => setShowAkashicRecords(false)} />
      </QuestProvider>
    );
  }

  return (
    <QuestProvider>
      <ActivityLogger enabled={autoLog} />
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
          <div className="settings-button" onClick={() => setShowSettings(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.6006 21.0761L19.0608 17.9236C19.6437 17.5871 19.9346 17.4188 20.1465 17.1834C20.3341 16.9751 20.4759 16.7297 20.5625 16.4632C20.6602 16.1626 20.6602 15.8267 20.6602 15.1568V8.84268C20.6602 8.17277 20.6602 7.83694 20.5625 7.53638C20.4759 7.26982 20.3341 7.02428 20.1465 6.816C19.9355 6.58161 19.6453 6.41405 19.0674 6.08043L13.5996 2.92359C13.0167 2.58706 12.7259 2.41913 12.416 2.35328C12.1419 2.295 11.8584 2.295 11.5843 2.35328C11.2744 2.41914 10.9826 2.58706 10.3997 2.92359L4.93843 6.07666C4.35623 6.41279 4.06535 6.58073 3.85352 6.816C3.66597 7.02428 3.52434 7.26982 3.43773 7.53638C3.33984 7.83765 3.33984 8.17436 3.33984 8.84742V15.1524C3.33984 15.8254 3.33984 16.1619 3.43773 16.4632C3.52434 16.7297 3.66597 16.9751 3.85352 17.1834C4.06548 17.4188 4.35657 17.5871 4.93945 17.9236L10.3997 21.0761C10.9826 21.4126 11.2744 21.5806 11.5843 21.6465C11.8584 21.7047 12.1419 21.7047 12.416 21.6465C12.7259 21.5806 13.0177 21.4126 13.6006 21.0761Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 11.9998C9 13.6566 10.3431 14.9998 12 14.9998C13.6569 14.9998 15 13.6566 15 11.9998C15 10.3429 13.6569 8.99976 12 8.99976C10.3431 8.99976 9 10.3429 9 11.9998Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div className="profile-button" onClick={() => setShowProfile(true)}>
            <img className="sidebar-avatar" src={avatarUrl} alt="Profile" />
          </div>
          <div className="home-button" onClick={() => window.location.reload()}>
            🏠
          </div>
        </div>
      </aside>
      <div className="layer-bar">
        {layers.map((layer) => (
          <div
            key={layer.label}
            className={`layer-dot ${activeLayer === layer.label ? 'active' : ''}`}
            style={{ backgroundColor: layer.color }}
            onClick={() => setActiveLayer(layer.label)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDropOnLayer(e, layer.label)}
          />
        ))}
      </div>
      <div className="content">
        <h1>{activeTab}</h1>
        <h2 className="layer-title">{activeLayer}</h2>
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
            ) : showTimeline ? (
              <Timeline onBack={() => setShowTimeline(false)} />
            ) : showTypomancy ? (
              <Typomancy onBack={() => setShowTypomancy(false)} />
            ) : showMoodtracker ? (
              <Moodtracker onBack={() => setShowMoodtracker(false)} />
            ) : showQuadrantComb ? (
              <QuadrantCombinaisons onBack={() => setShowQuadrantComb(false)} />
            ) : showAnima ? (
              <Anima onBack={() => setShowAnima(false)} />
            ) : showTodoGoals ? (
              <TodoGoals onBack={() => setShowTodoGoals(false)} />
            ) : showActivity ? (
              <ActivityApp onBack={() => setShowActivity(false)} />
            ) : showCharacterEvolve ? (
              <CharacterEvolve onBack={() => setShowCharacterEvolve(false)} />
            ) : showIdeaBoard ? (
              <IdeaBoard onBack={() => setShowIdeaBoard(false)} />
            ) : showImplementationIdeas ? (
              <ImplementationIdeas onBack={() => setShowImplementationIdeas(false)} />
            ) : showOrb ? (
              <Orb onBack={() => setShowOrb(false)} />
            ) : activeLayer === 'Form' && showTrainingBlog ? (
              <TrainingBlog onBack={() => setShowTrainingBlog(false)} />
            ) : (
              <div className="feature-cards">
                {appLayers.journal === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowJournal(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'journal')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'journal')}
                  >
                    <div className="journal-icon">📓</div>
                    <span>Quest Journal</span>
                  </div>
                )}
                {appLayers.nofap === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowNofap(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'nofap')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'nofap')}
                  >
                    <div className="calendar-preview" />
                    <span>NoFap Calendar</span>
                  </div>
                )}
                {appLayers.ratings === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowRatings(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'ratings')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'ratings')}
                  >
                    <div className="star-icon">⭐⭐⭐⭐⭐</div>
                    <span>Version Ratings</span>
                  </div>
                )}
                {appLayers.whoami === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowWhoAmI(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'whoami')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'whoami')}
                  >
                    <div className="question-icon">❓</div>
                    <span>Who Am I?</span>
                  </div>
                )}
                {appLayers.music === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowMusic(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'music')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'music')}
                  >
                    <div className="star-icon">🎵</div>
                    <span>Music Search</span>
                  </div>
                )}
                {appLayers.singing === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowSinging(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'singing')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'singing')}
                  >
                    <div className="star-icon">🎤</div>
                    <span>Singing</span>
                  </div>
                )}
                {appLayers.shadow === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowShadowWork(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'shadow')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'shadow')}
                  >
                    <div className="star-icon">🌑</div>
                    <span>Shadow Work</span>
                  </div>
                )}
                {appLayers.calendar === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowCalendarApp(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'calendar')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'calendar')}
                  >
                    <div className="star-icon">📅</div>
                    <span>Calendar</span>
                  </div>
                )}
                {appLayers.timeline === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowTimeline(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'timeline')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'timeline')}
                  >
                    <div className="star-icon">🕒</div>
                    <span>Timeline</span>
                  </div>
                )}
                {appLayers.typomancy === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowTypomancy(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'typomancy')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'typomancy')}
                  >
                    <div className="star-icon">⌨️</div>
                    <span>Typomancy</span>
                  </div>
                )}
                {appLayers.moodtracker === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowMoodtracker(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'moodtracker')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'moodtracker')}
                  >
                    <div className="star-icon">😊</div>
                    <span>Moodtracker</span>
                  </div>
                )}
                {appLayers.quadrantComb === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowQuadrantComb(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'quadrantComb')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'quadrantComb')}
                  >
                    <div className="star-icon">🔀</div>
                    <span>Quadrant combinaisons</span>
                  </div>
                )}
                {appLayers.anima === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowAnima(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'anima')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'anima')}
                  >
                    <div className="star-icon">💃</div>
                    <span>Anima</span>
                  </div>
                )}
                {appLayers.todoGoals === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowTodoGoals(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'todoGoals')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'todoGoals')}
                  >
                    <div className="star-icon">✅</div>
                    <span>Todo & Goals</span>
                  </div>
                )}
                {appLayers.activity === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowActivity(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'activity')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'activity')}
                  >
                    <div className="star-icon">🏃</div>
                    <span>Activity</span>
                  </div>
                )}
                {appLayers.characterEvolve === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowCharacterEvolve(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'characterEvolve')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'characterEvolve')}
                  >
                    <div className="star-icon">🌱</div>
                    <span>Character Evolve</span>
                  </div>
                )}
                {appLayers.ideaBoard === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowIdeaBoard(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'ideaBoard')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'ideaBoard')}
                  >
                    <div className="star-icon">📝</div>
                    <span>Idea Board</span>
                  </div>
                )}
                {appLayers.implementationIdeas === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowImplementationIdeas(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'implementationIdeas')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'implementationIdeas')}
                  >
                    <div className="star-icon">📑</div>
                    <span>Implementation Ideas</span>
                  </div>
                )}
                {!showTrainingBlog && activeLayer === 'Form' && (
                  <div className="app-card" onClick={() => setShowTrainingBlog(true)}>
                    <div className="star-icon">📝</div>
                    <span>Blog</span>
                  </div>
                )}
                {appLayers.orb === activeLayer && (
                  <div
                    className="app-card"
                    onClick={() => setShowOrb(true)}
                    onContextMenu={(e) => handleContextMenu(e, 'orb')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'orb')}
                  >
                    <div className="star-icon">🧿</div>
                    <span>Orb</span>
                  </div>
                )}
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
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          autoLog={autoLog}
          onToggleAutoLog={setAutoLog}
          theme={theme}
          onToggleTheme={() =>
            setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
          }
          onOpenAkashicRecords={() => setShowAkashicRecords(true)}
        />
      )}
      {contextMenu && (
        <ul
          className="layer-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {layers.map((layer) => (
            <li key={layer.label} onClick={() => moveAppToLayer(contextMenu.appId, layer.label)}>
              {layer.label}
            </li>
          ))}
        </ul>
      )}
      <VersionLabel />
      </div>
    </QuestProvider>
  );
}
