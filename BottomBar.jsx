import React from 'react';
import './bottom-bar.css';

export default function BottomBar({
  focusLabel = 'Tools',
  quickActions = [],
  autoLog = false,
  onToggleAutoLog = () => {},
  theme = 'dark',
  onToggleTheme = () => {},
  onOpenSettings = () => {},
  onOpenProfile = () => {},
  onOpenAkashicRecords = () => {},
  isAnyAppOpen = false,
}) {
  const actions = quickActions.filter(Boolean);

  return (
    <div className="bottom-command-bar" role="contentinfo" aria-label="Command bar">
      <div className="bottom-command-bar__section bottom-command-bar__section--focus">
        <div className="bottom-command-bar__label">Current Focus</div>
        <div className="bottom-command-bar__focus" aria-live="polite">
          {focusLabel}
        </div>
        <div
          className={`bottom-command-bar__status${
            isAnyAppOpen ? ' bottom-command-bar__status--active' : ''
          }`}
        >
          {isAnyAppOpen ? 'App Active' : 'Exploring'}
        </div>
      </div>
      <div className="bottom-command-bar__section bottom-command-bar__section--actions">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={`bottom-command-bar__action${
              action.active ? ' is-active' : ''
            }`}
            onClick={() => action.onClick && action.onClick()}
            disabled={!action.onClick}
            aria-pressed={action.active}
            title={action.label}
          >
            <span className="bottom-command-bar__action-icon" aria-hidden="true">
              {action.icon}
            </span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
      <div className="bottom-command-bar__section bottom-command-bar__section--toggles">
        <button
          type="button"
          className="bottom-command-bar__pill"
          onClick={onToggleAutoLog}
        >
          <span className="bottom-command-bar__pill-label">Auto Log</span>
          <span className="bottom-command-bar__pill-value">{autoLog ? 'On' : 'Off'}</span>
        </button>
        <button
          type="button"
          className="bottom-command-bar__pill"
          onClick={onToggleTheme}
        >
          <span className="bottom-command-bar__pill-label">Theme</span>
          <span className="bottom-command-bar__pill-value">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>
      <div className="bottom-command-bar__section bottom-command-bar__section--secondary">
        <button type="button" className="bottom-command-bar__ghost" onClick={onOpenSettings}>
          Settings
        </button>
        <button type="button" className="bottom-command-bar__ghost" onClick={onOpenProfile}>
          Profile
        </button>
        <button
          type="button"
          className="bottom-command-bar__ghost"
          onClick={onOpenAkashicRecords}
        >
          Akashic Records
        </button>
      </div>
    </div>
  );
}
