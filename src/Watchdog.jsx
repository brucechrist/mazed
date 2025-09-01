import React, { useEffect, useState } from 'react';
import './placeholder-app.css';

const defaultSettings = {
  hardMode: false,
  blockNetwork: false,
  autoStart: false,
  tamperGuard: false,
  checkInterval: 600,
  blockedApps: ['brave.exe', 'chrome.exe', 'steam.exe'],
};

export default function Watchdog({ onBack }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('watchdogSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [newApp, setNewApp] = useState('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    localStorage.setItem('watchdogSettings', JSON.stringify(settings));
  }, [settings]);

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addBlockedApp = () => {
    const app = newApp.trim();
    if (!app) return;
    setSettings((prev) => ({
      ...prev,
      blockedApps: [...prev.blockedApps, app],
    }));
    setNewApp('');
  };

  const removeBlockedApp = (app) => {
    setSettings((prev) => ({
      ...prev,
      blockedApps: prev.blockedApps.filter((a) => a !== app),
    }));
  };

  return (
    <div className="placeholder-app">
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      <h2>Watchdog Settings</h2>
      <button
        className={`watchdog-start-button${enabled ? ' running' : ''}`}
        onClick={() => setEnabled(!enabled)}
      >
        {enabled ? 'Stop Watchdog' : 'Start Watchdog'}
      </button>
      <p className="watchdog-status">
        Watchdog is {enabled ? 'ACTIVE' : 'INACTIVE'}
      </p>

      <label>
        <input
          type="checkbox"
          checked={settings.hardMode}
          onChange={() => toggleSetting('hardMode')}
        />
        Hard mode (kill blocked apps)
      </label>

      <label>
        <input
          type="checkbox"
          checked={settings.blockNetwork}
          onChange={() => toggleSetting('blockNetwork')}
        />
        Block network for browsers
      </label>

      <label>
        <input
          type="checkbox"
          checked={settings.autoStart}
          onChange={() => toggleSetting('autoStart')}
        />
        Auto-start with system
      </label>

      <label>
        <input
          type="checkbox"
          checked={settings.tamperGuard}
          onChange={() => toggleSetting('tamperGuard')}
        />
        Enable tamper guard
      </label>

      <label>
        Foreground check interval (ms)
        <input
          type="number"
          value={settings.checkInterval}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              checkInterval: Number(e.target.value) || 0,
            }))
          }
        />
      </label>

      <div className="blocked-apps">
        <h3>Blocked Processes</h3>
        <ul>
          {settings.blockedApps.map((app) => (
            <li key={app}>
              <span>{app}</span>
              <button onClick={() => removeBlockedApp(app)}>✕</button>
            </li>
          ))}
        </ul>
        <div className="blocked-apps-input">
          <input
            type="text"
            placeholder="e.g. chrome.exe"
            value={newApp}
            onChange={(e) => setNewApp(e.target.value)}
          />
          <button onClick={addBlockedApp}>Add</button>
        </div>
      </div>
    </div>
  );
}
