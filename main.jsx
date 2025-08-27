import React from 'react';
import ReactDOM from 'react-dom/client';
import PageRouter from './PageRouter.jsx';

if (window.electronAPI && window.electronAPI.setWindowSize) {
  window.electronAPI.setWindowSize(1600, 900);
}

ReactDOM.createRoot(document.getElementById('root')).render(<PageRouter />);
