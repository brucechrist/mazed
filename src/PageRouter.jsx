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
import ImageGallery from './ImageGallery.jsx';
import LoadingScreen from './LoadingScreen.jsx';
import DockLayout from './DockLayout.jsx';
import NofapCalendar from './NofapCalendar.jsx';
import QuestJournal from './QuestJournal.jsx';
import VersionRating from './VersionRating.jsx';
import WhoAmI from './WhoAmI.jsx';
import MusicSearch from './MusicSearch.jsx';
import Singing from './Singing.jsx';
import ShadowWork from './ShadowWork.jsx';
import Calendar from './Calendar.jsx';
import Timeline from './Timeline.jsx';
import Typomancy from './Typomancy.jsx';
import Moodtracker from './Moodtracker.jsx';
import MomentoMori from './MomentoMori.jsx';
import QuadrantCombinaisons from './QuadrantCombinaisons.jsx';
import Anima from './Anima.jsx';
import ToolsBlog from './ToolsBlog.jsx';
import TodoGoals from './TodoGoals.jsx';
import ActivityApp from './ActivityApp.jsx';
import CharacterEvolve from './CharacterEvolve.jsx';
import SemiFormlessCharacter from './SemiFormlessCharacter.jsx';
import FormlessCharacter from './FormlessCharacter.jsx';
import IdeaBoard from './IdeaBoard.jsx';
import ImplementationIdeas from './ImplementationIdeas.jsx';
import Orb from './Orb.jsx';
import Watchdog from './Watchdog.jsx';

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
    if (page === '5th') {
      setIsLoading(true);
      const img = new Image();
      img.src = menuBg;
      img.onload = () => setIsLoading(false);
      return () => {
        img.onload = null;
      };
    } else {
      setIsLoading(false);
    }
  }, [menuBg, page]);

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
  const renderDockApp = (id) => {
    const props = { onBack: goBack };
    const mapping = {
      journal: <QuestJournal {...props} />,
      nofap: <NofapCalendar {...props} />,
      ratings: <VersionRating {...props} />,
      whoami: <WhoAmI {...props} />,
      music: <MusicSearch {...props} />,
      singing: <Singing {...props} />,
      shadow: <ShadowWork {...props} />,
      calendar: <Calendar {...props} />,
      timeline: <Timeline {...props} />,
      typomancy: <Typomancy {...props} />,
      moodtracker: <Moodtracker {...props} />,
      momentoMori: <MomentoMori {...props} />,
      quadrantComb: <QuadrantCombinaisons onBack={goBack} />,
      anima: <Anima onBack={goBack} />,
      blog: <ToolsBlog onBack={goBack} />,
      todoGoals: <TodoGoals onBack={goBack} />,
      activity: <ActivityApp onBack={goBack} />,
      characterEvolve: <CharacterEvolve onBack={goBack} />,
      semiCharacter: <SemiFormlessCharacter onBack={goBack} />,
      formlessCharacter: <FormlessCharacter onBack={goBack} />,
      ideaBoard: <IdeaBoard onBack={goBack} />,
      implementationIdeas: <ImplementationIdeas onBack={goBack} />,
      orb: <Orb onBack={goBack} />,
      watchdog: <Watchdog onBack={goBack} />,
    };
    return mapping[id] || null;
  };
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
    case 'gallery':
      leftContent = <ImageGallery onBack={() => navigate('5th')} />;
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
