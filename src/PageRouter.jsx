import React, { useEffect, useState } from 'react';
import FifthMain from './FifthMain.jsx';
import IImain from './IImain.jsx';
import IEmain from './IEmain.jsx';
import EImain from './EImain.jsx';
import EEmain from './EEmain.jsx';

export default function PageRouter() {
  const [page, setPage] = useState('5th');

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onGoHome) {
      window.electronAPI.onGoHome(() => setPage('5th'));
    }
  }, []);

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
