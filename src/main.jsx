import React from 'react';
import ReactDOM from 'react-dom/client';
import PageRouter from './PageRouter.jsx';

const width = localStorage.getItem('windowWidth');
const height = localStorage.getItem('windowHeight');
if (width && height && window.electronAPI && window.electronAPI.setWindowSize) {
  window.electronAPI.setWindowSize(Number(width), Number(height));
}

ReactDOM.createRoot(document.getElementById('root')).render(<PageRouter />);
