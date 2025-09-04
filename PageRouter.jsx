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
import DockLayout from './src/DockLayout.jsx';
import NofapCalendar from './src/NofapCalendar.jsx';

export default function PageRouter() {
  const [page, setPage] = useState('5th');
  const history = useRef(['5th']);
  const [user, setUser] = useState(null);
  const [showExitVideo, setShowExitVideo] = useState(false);
  const [pendingResize, setPendingResize] = useState(false);
  const prevUser = useRef(null);
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
      return;
    }
    if (newPage === '5th') {
      history.current = ['5th'];
    } else {
      const current = history.current[history.current.length - 1];
      if (current !== newPage) {
        history.current = [...history.current, newPage];
      }
    }
    setPage(newPage);
  }, []);

  const goBack = useCallback(() => {
    if (isDocked) {
      setIsDocked(false);
    } else if (history.current.length > 1) {
      history.current = history.current.slice(0, -1);
      setPage(history.current[history.current.length - 1]);
    }
  }, [isDocked]);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onGoHome) {
      window.electronAPI.onGoHome(() => {
        setIsDocked(false);
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
      leftContent = <IImain />;
      break;
    case 'IE':
      leftContent = <IEmain />;
      break;
    case 'EI':
      leftContent = <EImain />;
      break;
    case 'EE':
      leftContent = <EEmain />;
      break;
    default:
      leftContent = <FifthMain onSelectQuadrant={(label) => navigate(label)} />;
  }

  const exitDock = useCallback(() => setIsDocked(false), []);

  const content = isDocked ? (
    <DockLayout
      onExit={() => {
        exitDock();
        navigate('5th');
      }}
      left={leftContent}
      right={<NofapCalendar onBack={() => { exitDock(); navigate('5th'); }} />}
    />
  ) : (
    leftContent
  );

  return (
    <>
      <ActivityTimer />
      {content}
    </>
  );
}
