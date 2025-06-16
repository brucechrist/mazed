import React from 'react';
import ReactDOM from 'react-dom/client';
import PageRouter from './PageRouter.jsx';
import { ResourceProvider } from './ResourceContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ResourceProvider>
    <PageRouter />
  </ResourceProvider>
);
