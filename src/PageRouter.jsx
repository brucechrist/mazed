import React, { useEffect, useState } from 'react';
import FifthMain from './FifthMain.jsx';
import IImain from './IImain.jsx';
import IEmain from './IEmain.jsx';
import EImain from './EImain.jsx';
import EEmain from './EEmain.jsx';
import AuthPage from './AuthPage.jsx';
import { supabase } from './supabaseClient.js';

export default function PageRouter() {
  const [page, setPage] = useState('5th');
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onGoHome) {
      window.electronAPI.onGoHome(() => setPage('5th'));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <AuthPage />;
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
