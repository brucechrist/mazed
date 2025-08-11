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
  const [pendingResize, setPendingResize] = useState(false);
  const prevUser = useRef(null);
  const defaultMenuBg = './assets/backgrounds/background_EI.jpg';
  const [menuBg, setMenuBg] = useState(
    () => localStorage.getItem('menuBg') || defaultMenuBg
  );

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

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onGoHome) {
      window.electronAPI.onGoHome(() => setPage('5th'));
    }
    if (window.electronAPI && window.electronAPI.onDisconnect) {
      window.electronAPI.onDisconnect(async () => {
        if (window.electronAPI.setWindowSize) {
          window.electronAPI.setWindowSize(1600, 900);
        }
        await supabaseClient.auth.signOut();
      });
    }
  }, []);

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

  let content;
  switch (page) {
    case 'II':
      content = <IImain menuBg={menuBg} onChangeMenuBg={setMenuBg} />;
      break;
    case 'IE':
      content = <IEmain menuBg={menuBg} onChangeMenuBg={setMenuBg} />;
      break;
    case 'EI':
      content = <EImain menuBg={menuBg} onChangeMenuBg={setMenuBg} />;
      break;
    case 'EE':
      content = <EEmain menuBg={menuBg} onChangeMenuBg={setMenuBg} />;
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
