import React, { useEffect, useState } from 'react';
import FifthMain from './FifthMain.jsx';
import IImain from './IImain.jsx';
import IEmain from './IEmain.jsx';
import EImain from './EImain.jsx';
import EEmain from './EEmain.jsx';
import Auth from './Auth.jsx';
import { supabase } from './supabaseClient';

export default function PageRouter() {
  const [page, setPage] = useState('5th');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onGoHome) {
      window.electronAPI.onGoHome(() => setPage('5th'));
    }
  }, []);

  if (!user) {
    return <Auth />;
  }

  switch (page) {
    case 'II':
      return <IImain />;
    case 'IE':
      return <IEmain />;
    case 'EI':
      return <EImain />;
    case 'EE':
      return <EEmain />;
    default:
      return <FifthMain onSelectQuadrant={(label) => setPage(label)} />;
  }
}
