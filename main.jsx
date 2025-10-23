import React from 'react';
import ReactDOM from 'react-dom/client';
import PageRouter from './PageRouter.jsx';
import ActivityOverlay from './src/ActivityOverlay.jsx';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
const params = new URLSearchParams(window.location.search);
const overlayMode = params.get('overlay');

if (overlayMode === 'activity') {
  root.render(<ActivityOverlay />);
} else {
  if (window.electronAPI && window.electronAPI.setWindowSize) {
    window.electronAPI.setWindowSize(1600, 900);
  }
  root.render(<PageRouter />);
}
