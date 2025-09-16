import React, { useCallback, useEffect, useRef, useState } from 'react';
import FifthMain from './FifthMain.jsx';
import IImain from './IImain.jsx';
import IEmain from './IEmain.jsx';
import EImain from './EImain.jsx';
import EEmain from './EEmain.jsx';
import Auth from './Auth.jsx';
import { supabaseClient } from './supabaseClient';
import ActivityTimer from './ActivityTimer.jsx';
import ExitVideo from './ExitVideo.jsx';
import Library from './Library.jsx';
import LoadingScreen from './LoadingScreen.jsx';
import DockLayout from './DockLayout.jsx';
import ToolsBlog from './ToolsBlog.jsx';
import { getAppDefinition } from './config/appRegistry.jsx';

export default function PageRouter() {
  const [page, setPage] = useState('5th');
  const history = useRef(['5th']);
  const [user, setUser] = useState(null);
  const [showExitVideo, setShowExitVideo] = useState(false);
  const [pendingResize, setPendingResize] = useState(false);
  const prevUser = useRef(null);
  const defaultMenuBg = './assets/backgrounds/background_EI.jpg';
  const [menuBg, setMenuBg] = useState(
    () => localStorage.getItem('menuBg') || defaultMenuBg
  );
  const [isLoading, setIsLoading] = useState(true);
  const [dockApp, setDockApp] = useState(null);
  const [isDocked, setIsDocked] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabaseClient.auth.getUser();
      setUser(data.user);
    };
    fetchUser();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!window.electronAPI || !window.electronAPI.setWindowSize) return;

    if (user && !prevUser.current) {
      setShowExitVideo(true);
      setPendingResize(true);
    } else if (!user && prevUser.current) {
      window.electronAPI.setWindowSize(1600, 900);
    }

    if (!user) {
      setShowExitVideo(false);
    }

    prevUser.current = user;
  }, [user]);

  const navigate = useCallback((newPage) => {
    if (newPage === 'dock') {
      setIsDocked(true);
      if (!dockApp) {
        setDockApp('nofap');
      }
      return;
    }
    setIsLoading(true);
    if (newPage === '5th') {
      history.current = ['5th'];
    } else {
      const current = history.current[history.current.length - 1];
      if (current !== newPage) {
        history.current = [...history.current, newPage];
      }
    }
    setPage(newPage);
  }, [dockApp]);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'OPEN_SPLIT') {
        setDockApp(e.data.appId);
        setIsDocked(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const goBack = useCallback(() => {
    if (isDocked) {
      setIsDocked(false);
      setDockApp(null);
    } else if (history.current.length > 1) {
      history.current = history.current.slice(0, -1);
      setPage(history.current[history.current.length - 1]);
    }
  }, [isDocked]);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onGoHome) {
      window.electronAPI.onGoHome(() => {
        setIsDocked(false);
        setDockApp(null);
        navigate('5th');
      });
    }
    if (window.electronAPI && window.electronAPI.onDisconnect) {
      window.electronAPI.onDisconnect(async () => {
        if (window.electronAPI.setWindowSize) {
          window.electronAPI.setWindowSize(1600, 900);
        }
        await supabaseClient.auth.signOut();
      });
    }
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        goBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack]);

  useEffect(() => {
    document.body.style.setProperty('--menu-bg-url', `url("${menuBg}")`);
    localStorage.setItem('menuBg', menuBg);
  }, [menuBg]);

  useEffect(() => {
    if (page === '5th') {
      document.body.classList.add('menu-page');
    } else {
      document.body.classList.remove('menu-page');
    }
  }, [page]);

  useEffect(() => {
    if (page !== '5th') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    let isCancelled = false;
    const img = new Image();

    const markComplete = () => {
      if (!isCancelled) {
        setIsLoading(false);
      }
    };

    img.onload = markComplete;
    img.onerror = markComplete;
    img.src = menuBg;

    if (img.complete) {
      markComplete();
    }

    return () => {
      isCancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [menuBg, page]);

  const renderDockApp = useCallback(
    (id) => {
      if (!id) return null;
      const definition = getAppDefinition(id);
      return definition ? definition.render({ onClose: goBack }) : null;
    },
    [goBack]
  );

  const renderInlineApp = useCallback(
    (id, onClose) => {
      const definition = getAppDefinition(id);
      return definition ? definition.render({ onClose }) : null;
    },
    []
  );

  if (!user) {
    return <Auth />;
  }

  if (showExitVideo) {
    return (
      <ExitVideo
        onEnded={() => {
          if (pendingResize && window.electronAPI?.setWindowSize) {
            window.electronAPI.setWindowSize(1920, 1080);
          }
          setPendingResize(false);
          setShowExitVideo(false);
        }}
      />
    );
  }

  let leftContent;
  switch (page) {
    case 'II':
      leftContent = <IImain menuBg={menuBg} onChangeMenuBg={setMenuBg} />;
      break;
    case 'IE':
      leftContent = <IEmain menuBg={menuBg} onChangeMenuBg={setMenuBg} />;
      break;
    case 'EI':
      leftContent = <EImain menuBg={menuBg} onChangeMenuBg={setMenuBg} />;
      break;
    case 'EE':
      leftContent = <EEmain menuBg={menuBg} onChangeMenuBg={setMenuBg} />;
      break;
    case 'library':
      leftContent = <Library onBack={() => navigate('5th')} />;
      break;
    case 'blog':
      leftContent =
        renderInlineApp('blog', () => navigate('5th')) ?? (
          <ToolsBlog onBack={() => navigate('5th')} />
        );
      break;
    default:
      leftContent = <FifthMain onSelectQuadrant={(label) => navigate(label)} />;
  }

  const content = isDocked ? (
    <DockLayout onExit={goBack} left={leftContent} right={renderDockApp(dockApp)} />
  ) : (
    leftContent
  );

  return (
    <>
      {isLoading && <LoadingScreen />}
      <ActivityTimer />
      {content}
    </>
  );
}
