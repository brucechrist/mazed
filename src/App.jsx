import React, { useState } from 'react';
import './styles.css';

const tabs = ['Character', 'Training', 'World', 'Friends'];

export default function App() {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div>
      <nav className="nav-container">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </nav>
      <div className="content">
        <h1>{activeTab}</h1>
      </div>
    </div>
  );
}
