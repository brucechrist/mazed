import React, { useState } from 'react';
 Alpha
import './styles.css';

const tabs = [
  { label: 'Training', icon: '🧠' },
  { label: 'Character', icon: '👤' },
  { label: 'World', icon: '🌍' },
  { label: 'Friends', icon: '🤝' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(tabs[0].label);

  return (
    <div className="app-container">
      <aside className="sidebar">
        {tabs.map((tab) => (
          <div
            key={tab.label}
            className={`tab ${activeTab === tab.label ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.label)}
          >
            <span className="icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </div>
        ))}
      </aside>
      <div className="content">
        <h1>{activeTab}</h1>
      </div>
    </div>
  );
}

import './App.css';

const tabs = ['Character', 'Training', 'World', 'Friends'];

function App() {
  const [activeTab, setActiveTab] = useState('Character');

  const renderContent = () => {
    switch (activeTab) {
      case 'Character':
        return <div className="content">Character content</div>;
      case 'Training':
        return <div className="content">Training content</div>;
      case 'World':
        return <div className="content">World content</div>;
      case 'Friends':
        return <div className="content">Friends content</div>;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <nav className="tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      {renderContent()}
    </div>
  );
}

export default App;
  main
