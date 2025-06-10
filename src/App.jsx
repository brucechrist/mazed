import React, { useState } from 'react';
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
