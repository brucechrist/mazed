import React, { useState } from 'react';
 Alpha
import './styles.css';

const tabs = [
  { label: 'Training', icon: '🧠' },
  { label: 'Character', icon: '👤' },
  { label: 'World', icon: '🌍' },
  { label: 'Friends', icon: '🤝' },
];
 q3788v-codex/créer-une-barre-de-navigation-latérale-avec-icônes

 hnmdo6-codex/créer-une-barre-de-navigation-latérale-avec-icônes
 Alpha

function Landing({ onSelect }) {
  return (
    <div className="landing">
      <div className="main">
        <div className="up">
          <button className="card card1" onClick={() => onSelect('Training')}>🧠</button>
          <button className="card card2" onClick={() => onSelect('Character')}>👤</button>
        </div>
        <div className="down">
          <button className="card card3" onClick={() => onSelect('World')}>🌍</button>
          <button className="card card4" onClick={() => onSelect('Friends')}>🤝</button>
        </div>
      </div>
    </div>
  );
}
 q3788v-codex/créer-une-barre-de-navigation-latérale-avec-icônes

export default function App() {
  const [activeTab, setActiveTab] = useState(null);

  if (!activeTab) {
    return <Landing onSelect={setActiveTab} />;
  }


export default function App() {
  const [activeTab, setActiveTab] = useState(null);

  if (!activeTab) {
    return <Landing onSelect={setActiveTab} />;
  }


export default function App() {
  const [activeTab, setActiveTab] = useState(tabs[0].label);
 Alpha
 Alpha

  return (
    <div className="app-container">
      <aside className="sidebar">
        {tabs.map((tab) => (
          <div
            key={tab.label}
            className={`tab ${activeTab === tab.label ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.label)}
 q3788v-codex/créer-une-barre-de-navigation-latérale-avec-icônes
          >
            <span className="icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </div>
        ))}
      </aside>
      <div className="content">
        <h1>{activeTab}</h1>
      </div>

 hnmdo6-codex/créer-une-barre-de-navigation-latérale-avec-icônes
          >
            <span className="icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </div>
        ))}
      </aside>
      <div className="content">
        <h1>{activeTab}</h1>
      </div>

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
Alpha
 Alpha
    </div>
  );
}

export default App;
  main
