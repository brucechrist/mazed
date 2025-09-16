import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './styles.css';
import StatsQuadrant from './StatsQuadrant.jsx';
import World from './World.jsx';
import FriendsList from './FriendsList.jsx';
import ProfileModal from './ProfileModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import SemiFormlessCharacter from './SemiFormlessCharacter.jsx';
import FormlessCharacter from './FormlessCharacter.jsx';
import VersionLabel from './VersionLabel.jsx';
import { QuestProvider } from './QuestContext.jsx';
import ActivityLogger from './ActivityLogger.jsx';
import { supabaseClient } from './supabaseClient.js';
import {
  toolApps,
  pinnedToolApps,
  getAppDefinition,
  getToolAppDefinition,
  createDefaultAppLayers,
  isDockableApp,
} from './config/appRegistry.jsx';
import {
  usePersistentState,
  stringStorage,
  booleanStorage,
  jsonStorage,
} from './hooks/usePersistentState.js';

const placeholderImg =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'50'%20height%3D'50'%3E%3Crect%20width%3D'50'%20height%3D'50'%20rx%3D'25'%20fill%3D'%23444'%2F%3E%3Ctext%20x%3D'25'%20y%3D'33'%20font-size%3D'26'%20text-anchor%3D'middle'%20fill%3D'%23aaa'%3E%3F%3C%2Ftext%3E%3C%2Fsvg%3E";

const tabs = [
  { label: 'Tools', icon: '🧠' },
  { label: 'Character', icon: '👤' },
  { label: 'World', icon: '🌍' },
  { label: 'Friends', icon: '🤝' },
];

const layers = [
  { label: 'Form', color: 'red' },
  { label: 'Semi-Formless', color: 'blue' },
  { label: 'Formless', color: 'green' },
];

const defaultMainBg = './assets/backgrounds/background_EI.jpg';
const defaultCharBg = './assets/backgrounds/Viego_0.jpg';

const pinnedAppIds = new Set(pinnedToolApps.map((app) => app.id));

export default function QuadrantPage({ initialTab, menuBg, onChangeMenuBg }) {
  const defaultAppLayers = useMemo(() => createDefaultAppLayers(), []);
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0].label);
  const [activeLayer, setActiveLayer] = useState(layers[0].label);
  const [activeAppId, setActiveAppId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedAppIndex, setSelectedAppIndex] = useState(-1);
  const [sidebarIndex, setSidebarIndex] = useState(() =>
    tabs.findIndex((tab) => tab.label === (initialTab || tabs[0].label))
  );
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(placeholderImg);

  const [theme, setTheme] = usePersistentState(
    'theme',
    () => 'dark',
    stringStorage()
  );
  const [mainBg, setMainBg] = usePersistentState(
    'mainBg',
    () => defaultMainBg,
    stringStorage()
  );
  const [charBg, setCharBg] = usePersistentState(
    'charBg',
    () => defaultCharBg,
    stringStorage()
  );
  const [autoLog, setAutoLog] = usePersistentState(
    'autoLog',
    () => false,
    booleanStorage()
  );
  const [rawAppLayers, setRawAppLayers] = usePersistentState(
    'appLayers',
    () => ({ ...defaultAppLayers }),
    jsonStorage()
  );

  const appLayers = useMemo(
    () => ({ ...defaultAppLayers, ...rawAppLayers }),
    [defaultAppLayers, rawAppLayers]
  );

  useEffect(() => {
    const merged = { ...defaultAppLayers, ...rawAppLayers };
    const differs =
      Object.keys(merged).length !== Object.keys(rawAppLayers).length ||
      Object.keys(merged).some((key) => merged[key] !== rawAppLayers[key]);
    if (differs) {
      setRawAppLayers(merged);
    }
  }, [defaultAppLayers, rawAppLayers, setRawAppLayers]);

  const cardRefs = useRef([]);

  const handleCloseActiveApp = useCallback(() => {
    setActiveAppId(null);
  }, []);

  const closeOpenApp = useCallback(() => {
    setShowProfile(false);
    setShowSettings(false);
    setContextMenu(null);
    handleCloseActiveApp();
  }, [handleCloseActiveApp]);

  const handleOpenApp = useCallback((appId) => {
    setActiveAppId(appId);
    setSelectedAppIndex(-1);
    setContextMenu(null);
  }, []);

  const handleDragStart = useCallback((event, appId) => {
    event.dataTransfer.setData('text/plain', appId);
  }, []);

  const moveAppToLayer = useCallback(
    (appId, layerLabel) => {
      if (!getToolAppDefinition(appId)) {
        return;
      }
      setRawAppLayers((prev) => ({ ...prev, [appId]: layerLabel }));
    },
    [setRawAppLayers]
  );

  const handleDropOnLayer = useCallback(
    (event, layerLabel) => {
      event.preventDefault();
      const appId = event.dataTransfer.getData('text/plain');
      if (appId) {
        moveAppToLayer(appId, layerLabel);
      }
    },
    [moveAppToLayer]
  );

  const handleContextMenu = useCallback((event, appId) => {
    event.preventDefault();
    if (!getToolAppDefinition(appId)) {
      return;
    }
    setContextMenu({
      appId,
      x: event.clientX,
      y: event.clientY,
      supportsDock: isDockableApp(appId),
    });
  }, []);

  const handleOpenSplit = useCallback(() => {
    if (contextMenu?.appId) {
      window.postMessage(
        { type: 'OPEN_SPLIT', appId: contextMenu.appId },
        '*'
      );
      setContextMenu(null);
    }
  }, [contextMenu]);

  const anyAppOpen = Boolean(activeAppId || showProfile || showSettings);

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  useEffect(() => {
    document.body.style.setProperty('--main-bg-url', `url("${mainBg}")`);
  }, [mainBg]);

  useEffect(() => {
    document.body.style.setProperty('--char-bg-url', `url("${charBg}")`);
  }, [charBg]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAvatar = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user || !isMounted) return;

      const storedPath = localStorage.getItem(`avatarPath_${user.id}`);
      if (storedPath) {
        const { data } = supabaseClient.storage
          .from('avatars')
          .getPublicUrl(storedPath);
        if (data?.publicUrl && isMounted) {
          setAvatarUrl(data.publicUrl);
        }
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
        if (data?.publicUrl && isMounted) {
          setAvatarUrl(data.publicUrl);
          localStorage.setItem(`avatarPath_${user.id}`, profile.avatar_url);
          localStorage.setItem(`avatarUrl_${user.id}`, data.publicUrl);
        }
      }
    };

    loadAvatar();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'Tools') {
      setSelectedAppIndex(-1);
    }
  }, [activeTab]);

  useEffect(() => {
    if (anyAppOpen && selectedAppIndex !== -1) {
      setSelectedAppIndex(-1);
    }
  }, [anyAppOpen, selectedAppIndex]);

  useEffect(() => {
    if (sidebarIndex < tabs.length) {
      setActiveTab(tabs[sidebarIndex].label);
    }
  }, [sidebarIndex]);

  const displayedCards = useMemo(() => {
    const cards = toolApps
      .filter((app) => appLayers[app.id] === activeLayer)
      .map((app) => ({
        id: app.id,
        title: app.title,
        icon: app.icon,
        draggable: true,
      }));

    pinnedToolApps.forEach((app) => {
      if (
        app.layer === activeLayer &&
        (!app.hideWhenActive || activeAppId !== app.id)
      ) {
        cards.push({
          id: app.id,
          title: app.title,
          icon: app.icon,
          draggable: false,
        });
      }
    });

    return cards;
  }, [activeLayer, activeAppId, appLayers]);

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, displayedCards.length);
  }, [displayedCards.length]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (anyAppOpen) {
        if (key === 'escape') {
          event.preventDefault();
          closeOpenApp();
        }
        return;
      }

      const totalSidebarItems = tabs.length + 3;

      if (selectedAppIndex === -1) {
        if (key === 'a') {
          setActiveLayer((prev) => {
            const index = layers.findIndex((layer) => layer.label === prev);
            return layers[Math.max(0, index - 1)].label;
          });
        } else if (key === 'd') {
          setActiveLayer((prev) => {
            const index = layers.findIndex((layer) => layer.label === prev);
            return layers[Math.min(layers.length - 1, index + 1)].label;
          });
        } else if (key === 'w') {
          setSidebarIndex((prev) => Math.max(0, prev - 1));
        } else if (key === 's') {
          setSidebarIndex((prev) => Math.min(totalSidebarItems - 1, prev + 1));
        } else if (key === 'enter') {
          if (sidebarIndex < tabs.length) {
            if (
              tabs[sidebarIndex].label === 'Tools' &&
              displayedCards.length > 0
            ) {
              setSelectedAppIndex(0);
            }
          } else {
            const actionIdx = sidebarIndex - tabs.length;
            if (actionIdx === 0) {
              setShowSettings(true);
            } else if (actionIdx === 1) {
              setShowProfile(true);
            } else if (actionIdx === 2) {
              window.location.reload();
            }
          }
        }
        return;
      }

      const cards = cardRefs.current.filter(Boolean);
      if (!cards.length) {
        setSelectedAppIndex(-1);
        return;
      }

      const clampedIndex = Math.min(selectedAppIndex, cards.length - 1);
      if (clampedIndex !== selectedAppIndex) {
        setSelectedAppIndex(clampedIndex);
      }

      const currentCard = cards[clampedIndex];
      if (!currentCard) {
        setSelectedAppIndex(-1);
        return;
      }

      const currentRect = currentCard.getBoundingClientRect();
      const cx = currentRect.left + currentRect.width / 2;
      const cy = currentRect.top + currentRect.height / 2;

      const findNearest = (direction) => {
        let bestIndex = clampedIndex;
        let bestDistance = Infinity;

        cards.forEach((card, index) => {
          if (index === clampedIndex) return;
          const rect = card.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;

          let isCandidate = false;
          if (direction === 'left') isCandidate = x < cx - 5;
          if (direction === 'right') isCandidate = x > cx + 5;
          if (direction === 'up') isCandidate = y < cy - 5;
          if (direction === 'down') isCandidate = y > cy + 5;

          if (isCandidate) {
            const dx = cx - x;
            const dy = cy - y;
            const distance = dx * dx + dy * dy;
            if (distance < bestDistance) {
              bestDistance = distance;
              bestIndex = index;
            }
          }
        });

        return bestIndex;
      };

      if (key === 'a') {
        setSelectedAppIndex(findNearest('left'));
      } else if (key === 'd') {
        setSelectedAppIndex(findNearest('right'));
      } else if (key === 'w') {
        setSelectedAppIndex(findNearest('up'));
      } else if (key === 's') {
        setSelectedAppIndex(findNearest('down'));
      } else if (key === 'enter') {
        const card = displayedCards[clampedIndex];
        if (card) {
          handleOpenApp(card.id);
        }
      } else if (key === 'escape') {
        event.preventDefault();
        setSelectedAppIndex(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    anyAppOpen,
    closeOpenApp,
    displayedCards,
    handleOpenApp,
    selectedAppIndex,
    sidebarIndex,
  ]);

  useEffect(() => {
    if (selectedAppIndex >= displayedCards.length) {
      setSelectedAppIndex(displayedCards.length ? displayedCards.length - 1 : -1);
    }
  }, [displayedCards.length, selectedAppIndex]);

  const activeDefinition = useMemo(
    () => (activeAppId ? getAppDefinition(activeAppId) : null),
    [activeAppId]
  );

  const activeAppElement = useMemo(() => {
    if (!activeDefinition) {
      return null;
    }
    return activeDefinition.render({ onClose: handleCloseActiveApp });
  }, [activeDefinition, handleCloseActiveApp]);

  const isInlineApp =
    activeAppId &&
    (getToolAppDefinition(activeAppId) !== null || pinnedAppIds.has(activeAppId));

  const inlineAppContent = isInlineApp ? activeAppElement : null;
  const floatingAppContent = !isInlineApp ? activeAppElement : null;

  const handleAvatarUpdated = useCallback((_path, url) => {
    setAvatarUrl(url);
  }, []);

  const renderCard = (card, index) => {
    const Icon = card.icon;
    const isSelected = selectedAppIndex === index;
    const isToolApp = getToolAppDefinition(card.id) !== null;

    return (
      <div
        key={card.id}
        ref={(element) => {
          cardRefs.current[index] = element;
        }}
        className={`app-card ${isSelected ? 'selected' : ''}`}
        onClick={() => handleOpenApp(card.id)}
        onContextMenu={
          isToolApp ? (event) => handleContextMenu(event, card.id) : undefined
        }
        draggable={isToolApp}
        onDragStart={
          isToolApp ? (event) => handleDragStart(event, card.id) : undefined
        }
      >
        <Icon />
        <span>{card.title}</span>
      </div>
    );
  };

  return (
    <QuestProvider>
      <ActivityLogger enabled={autoLog} />
      <div className="app-container">
        <aside className="sidebar">
          <div className="layer-buttons">
            {layers.map((layer) => (
              <div
                key={layer.label}
                title={layer.label}
                className={`layer-button ${
                  activeLayer === layer.label ? 'active' : ''
                }`}
                style={{ backgroundColor: layer.color }}
                onClick={() => setActiveLayer(layer.label)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDropOnLayer(event, layer.label)}
              />
            ))}
          </div>
          <div className="bottom-buttons">
            <div
              className={`settings-button ${
                sidebarIndex === tabs.length ? 'selected' : ''
              }`}
              onClick={() => {
                setShowSettings(true);
                setSidebarIndex(tabs.length);
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.6006 21.0761L19.0608 17.9236C19.6437 17.5871 19.9346 17.4188 20.1465 17.1834C20.3341 16.9751 20.4759 16.7297 20.5625 16.4632C20.6602 16.1626 20.6602 15.8267 20.6602 15.1568V8.84268C20.6602 8.17277 20.6602 7.83694 20.5625 7.53638C20.4759 7.26982 20.3341 7.02428 20.1465 6.816C19.9355 6.58161 19.6453 6.41405 19.0674 6.08043L13.5996 2.92359C13.0167 2.58706 12.7259 2.41913 12.416 2.35328C12.1419 2.295 11.8584 2.295 11.5843 2.35328C11.2744 2.41914 10.9826 2.58706 10.3997 2.92359L4.93843 6.07666C4.35623 6.41279 4.06535 6.58073 3.85352 6.816C3.66597 7.02428 3.52434 7.26982 3.43773 7.53638C3.33984 7.83765 3.33984 8.17436 3.33984 8.84742V15.1524C3.33984 15.8254 3.33984 16.1619 3.43773 16.4632C3.52434 16.7297 3.66597 16.9751 3.85352 17.1834C4.06548 17.4188 4.35657 17.5871 4.93945 17.9236L10.3997 21.0761C10.9826 21.4126 11.2744 21.5806 11.5843 21.6465C11.8584 21.7047 12.1419 21.7047 12.416 21.6465C12.7259 21.5806 13.0177 21.4126 13.6006 21.0761Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 11.9998C9 13.6566 10.3431 14.9998 12 14.9998C13.6569 14.9998 15 13.6566 15 11.9998C15 10.3429 13.6569 8.99976 12 8.99976C10.3431 8.99976 9 10.3429 9 11.9998Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div
              className={`profile-button ${
                sidebarIndex === tabs.length + 1 ? 'selected' : ''
              }`}
              onClick={() => {
                setShowProfile(true);
                setSidebarIndex(tabs.length + 1);
              }}
            >
              <img className="sidebar-avatar" src={avatarUrl} alt="Profile" />
            </div>
            <div
              className={`home-button ${
                sidebarIndex === tabs.length + 2 ? 'selected' : ''
              }`}
              onClick={() => {
                window.location.reload();
                setSidebarIndex(tabs.length + 2);
              }}
            >
              🏠
            </div>
          </div>
        </aside>
        <div className="content">
          <h1>{activeTab}</h1>
          {activeTab === 'Character' && (
            activeLayer === 'Semi-Formless' ? (
              <SemiFormlessCharacter />
            ) : activeLayer === 'Formless' ? (
              <FormlessCharacter />
            ) : (
              <StatsQuadrant />
            )
          )}
          {activeTab === 'Tools' && (
            <div className="tools-layout">
              {inlineAppContent || (
                <div className="feature-cards">
                  {displayedCards.map((card, index) => renderCard(card, index))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'World' && <World />}
          {activeTab === 'Friends' && <FriendsList />}
        </div>
        <div className="bottom-nav">
          {tabs.map((tab, idx) => (
            <div
              key={tab.label}
              className={`tab ${
                activeTab === tab.label ? 'active' : ''
              } ${sidebarIndex === idx ? 'selected' : ''}`}
              onClick={() => {
                setActiveTab(tab.label);
                setSidebarIndex(idx);
              }}
            >
              <span className="icon">{tab.icon}</span>
            </div>
          ))}
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
              setTheme((value) => (value === 'dark' ? 'light' : 'dark'))
            }
            onOpenAkashicRecords={() => {
              setShowSettings(false);
              handleOpenApp('akashicRecords');
            }}
            mainBg={mainBg}
            onChangeMainBg={setMainBg}
            charBg={charBg}
            onChangeCharBg={setCharBg}
            menuBg={menuBg}
            onChangeMenuBg={onChangeMenuBg}
          />
        )}
        {contextMenu && (
          <ul
            className="layer-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {[
              ...(contextMenu.supportsDock
                ? [{ label: 'Open in Split Screen', action: handleOpenSplit }]
                : []),
              ...layers.map((layer) => ({
                label: layer.label,
                action: () => moveAppToLayer(contextMenu.appId, layer.label),
              })),
            ].map((option) => (
              <li key={option.label} onClick={option.action}>
                {option.label}
              </li>
            ))}
          </ul>
        )}
        <VersionLabel />
      </div>
      {floatingAppContent}
    </QuestProvider>
  );
}
