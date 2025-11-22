import React from 'react';
import ReactDOM from 'react-dom/client';
import { ResourceProvider } from './ResourceContext.jsx';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
const params = new URLSearchParams(window.location.search);
const overlayMode = params.get('overlay');

const renderOverlay = async () => {
  const { default: ActivityOverlay } = await import('./ActivityOverlay.jsx');
  root.render(<ActivityOverlay />);
};

const renderApp = async () => {
  if (window.electronAPI && window.electronAPI.setWindowSize) {
    window.electronAPI.setWindowSize(1600, 900);
  }
  const { default: PageRouter } = await import('./PageRouter.jsx');
  root.render(
    <ResourceProvider>
      <PageRouter />
    </ResourceProvider>
  );
};

const bootstrap = async () => {
  try {
    if (overlayMode === 'activity') {
      await renderOverlay();
    } else {
      await renderApp();
    }
  } catch (error) {
    console.error('Failed to start renderer', error);
    root.render(
      <div className="renderer-error">
        <p>Failed to load Mazed. Please restart the app.</p>
      </div>
    );
  }
};

bootstrap();
