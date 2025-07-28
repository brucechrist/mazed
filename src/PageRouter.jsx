import React, { useEffect, useRef, useState } from 'react';
import FifthMain from './FifthMain.jsx';
import IImain from './IImain.jsx';
import IEmain from './IEmain.jsx';
import EImain from './EImain.jsx';
import EEmain from './EEmain.jsx';
import Auth from './Auth.jsx';
import { supabaseClient } from './supabaseClient';
import ActivityTimer from './ActivityTimer.jsx';
import ExitVideo from './ExitVideo.jsx';

export default function PageRouter() {
  const [page, setPage] = useState('5th');
  const [user, setUser] = useState(null);
  const [showExitVideo, setShowExitVideo] = useState(false);
  const prevUser = useRef(null);

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
      localStorage.setItem('windowWidth', '1920');
      localStorage.setItem('windowHeight', '1080');
      window.electronAPI.setWindowSize(1920, 1080);
    } else if (!user && prevUser.current) {
      localStorage.setItem('windowWidth', '1600');
      localStorage.setItem('windowHeight', '900');
      window.electronAPI.setWindowSize(1600, 900);
    }

    if (!user) {
      setShowExitVideo(false);
    }

    prevUser.current = user;
  }, [user]);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onGoHome) {
      window.electronAPI.onGoHome(() => setPage('5th'));
    }
    if (window.electronAPI && window.electronAPI.onDisconnect) {
      window.electronAPI.onDisconnect(async () => {
        if (window.electronAPI.setWindowSize) {
          localStorage.setItem('windowWidth', '1600');
          localStorage.setItem('windowHeight', '900');
          window.electronAPI.setWindowSize(1600, 900);
        }
        await supabaseClient.auth.signOut();
      });
    }
  }, []);

  if (!user) {
    return <Auth />;
  }

  if (showExitVideo) {
    return <ExitVideo onEnded={() => setShowExitVideo(false)} />;
  }

  let content;
  switch (page) {
    case 'II':
      content = <IImain />;
      break;
    case 'IE':
      content = <IEmain />;
      break;
    case 'EI':
      content = <EImain />;
      break;
    case 'EE':
      content = <EEmain />;
      break;
    default:
      content = <FifthMain onSelectQuadrant={(label) => setPage(label)} />;
  }

  return (
    <>
      <ActivityTimer />
      {content}
    </>
  );
}
