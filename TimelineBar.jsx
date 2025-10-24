import React from 'react';
import './timeline-bar.css';

export default function TimelineBar({
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
  const [isInsightsOpen, setIsInsightsOpen] = React.useState(false);

  const toggleInsightsPanel = () => {
    setIsInsightsOpen((prev) => !prev);
  };

  const closeInsightsPanel = () => {
    setIsInsightsOpen(false);
  };

  const insightsPanelId = 'timeline-insights-panel';

  return (
    <>
      <div className="timeline-bar" role="contentinfo" aria-label="Timeline">
        <div className="timeline-bar__section timeline-bar__section--panel-toggle">
          <button
            type="button"
            className={`timeline-bar__panel-toggle${
              isInsightsOpen ? ' is-open' : ''
            }`}
            onClick={toggleInsightsPanel}
            aria-controls={insightsPanelId}
            aria-expanded={isInsightsOpen}
            aria-label={`${isInsightsOpen ? 'Hide' : 'Show'} timeline insights`}
          >
            <span
              aria-hidden="true"
              className="timeline-bar__panel-toggle-icon"
            >
              {isInsightsOpen ? (
                <svg viewBox="0 0 16 16" className="timeline-bar__panel-toggle-icon-close">
                  <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 16 16"
                  className="timeline-bar__panel-toggle-icon-chevron"
                >
                  <path d="M6.5 4l4 4-4 4" />
                </svg>
              )}
            </span>
          </button>
        </div>
        <div className="timeline-bar__section timeline-bar__section--focus">
          <div className="timeline-bar__label">Current Focus</div>
          <div className="timeline-bar__focus" aria-live="polite">
            {focusLabel}
          </div>
          <div
            className={`timeline-bar__status${
              isAnyAppOpen ? ' timeline-bar__status--active' : ''
            }`}
          >
            {isAnyAppOpen ? 'App Active' : 'Exploring'}
          </div>
        </div>
        <div className="timeline-bar__section timeline-bar__section--actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`timeline-bar__action${
                action.active ? ' is-active' : ''
              }`}
              onClick={() => action.onClick && action.onClick()}
              disabled={!action.onClick}
              aria-pressed={action.active}
              title={action.label}
            >
              <span className="timeline-bar__action-icon" aria-hidden="true">
                {action.icon}
              </span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        <div className="timeline-bar__section timeline-bar__section--toggles">
          <button
            type="button"
            className="timeline-bar__pill"
            onClick={onToggleAutoLog}
          >
            <span className="timeline-bar__pill-label">Auto Log</span>
            <span className="timeline-bar__pill-value">{autoLog ? 'On' : 'Off'}</span>
          </button>
          <button
            type="button"
            className="timeline-bar__pill"
            onClick={onToggleTheme}
          >
            <span className="timeline-bar__pill-label">Theme</span>
            <span className="timeline-bar__pill-value">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
        </div>
        <div className="timeline-bar__section timeline-bar__section--secondary">
          <button
            type="button"
            className="timeline-bar__ghost"
            onClick={onOpenSettings}
          >
            Settings
          </button>
          <button
            type="button"
            className="timeline-bar__ghost"
            onClick={onOpenProfile}
          >
            Profile
          </button>
          <button
            type="button"
            className="timeline-bar__ghost"
            onClick={onOpenAkashicRecords}
          >
            Akashic Records
          </button>
        </div>
      </div>
      <aside
        id={insightsPanelId}
        className={`timeline-insights${isInsightsOpen ? ' is-open' : ''}`}
        role="complementary"
        aria-label="Timeline insights"
      >
        <div className="timeline-insights__dialog" role="document">
          <div className="timeline-insights__header">
            <h2 className="timeline-insights__title">Insights Panel</h2>
            <button
              type="button"
              className="timeline-insights__close"
              onClick={closeInsightsPanel}
              aria-label="Close insights panel"
            >
              ×
            </button>
          </div>
          <div className="timeline-insights__body">
            <p className="timeline-insights__placeholder">
              Lightweight charts and metrics will appear here.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
