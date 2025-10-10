import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ensureActivityBlogPost,
  loadRegisteredActivityNames,
  recordActivitySessionInBlog,
  sanitizeActivityName,
} from './ToolsBlog.jsx';
import './placeholder-app.css';
import './activity-log.css';

const ENTRIES_KEY = 'activityLogEntries';
const CURRENT_KEY = 'activityLogCurrent';

const safeParse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const formatDuration = (ms) => {
  if (!ms || ms <= 0) return '0m 00s';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${hours > 0 ? String(minutes).padStart(2, '0') : minutes}m`);
  parts.push(String(seconds).padStart(2, '0') + 's');
  return parts.join(' ');
};

const formatDateTime = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
};

const finalizeSession = (session, endTime = new Date()) => {
  if (!session) return null;
  const end = endTime instanceof Date ? endTime : new Date(endTime);
  const segments = Array.isArray(session.segments) ? [...session.segments] : [];
  let elapsed = session.elapsed || 0;

  if (session.activeSegmentStart) {
    const startMs = new Date(session.activeSegmentStart).getTime();
    const endMs = end.getTime();
    if (!Number.isNaN(startMs) && endMs > startMs) {
      elapsed += endMs - startMs;
      segments.push({
        start: session.activeSegmentStart,
        end: end.toISOString(),
      });
    }
  }

  if (elapsed <= 0) {
    return null;
  }

  return {
    id: session.id || end.getTime(),
    name: session.name,
    startedAt: session.startedAt,
    endedAt: end.toISOString(),
    durationMs: elapsed,
    segments,
  };
};

const DEFAULT_ACTIVITIES = ['Singing', 'Writing'];

export default function ActivityLog({ onBack }) {
  const [entries, setEntries] = useState(() =>
    safeParse(localStorage.getItem(ENTRIES_KEY), [])
  );
  const [current, setCurrent] = useState(() =>
    safeParse(localStorage.getItem(CURRENT_KEY), null)
  );
  const [activityName, setActivityName] = useState(() => current?.name || '');
  const [activityOptions, setActivityOptions] = useState(() =>
    loadRegisteredActivityNames()
  );
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [tick, setTick] = useState(() => Date.now());

  const refreshActivityOptions = useCallback(() => {
    setActivityOptions(loadRegisteredActivityNames());
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    if (current) {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(current));
    } else {
      localStorage.removeItem(CURRENT_KEY);
    }
  }, [current]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    DEFAULT_ACTIVITIES.forEach((name) => ensureActivityBlogPost(name));
    refreshActivityOptions();
  }, [refreshActivityOptions]);

  useEffect(() => {
    const sanitizedCurrent = sanitizeActivityName(activityName);
    if (
      !isAddingActivity &&
      !sanitizedCurrent &&
      activityOptions.length > 0
    ) {
      setActivityName(activityOptions[0]);
    }
  }, [activityOptions, activityName, isAddingActivity]);

  const currentElapsed = useMemo(() => {
    if (!current) return 0;
    const activeStart = current.activeSegmentStart
      ? new Date(current.activeSegmentStart).getTime()
      : null;
    if (!activeStart) {
      return current.elapsed || 0;
    }
    const now = tick;
    if (Number.isNaN(activeStart) || now <= activeStart) {
      return current.elapsed || 0;
    }
    return (current.elapsed || 0) + (now - activeStart);
  }, [current, tick]);

  const totals = useMemo(() => {
    const map = new Map();
    entries.forEach((entry) => {
      const sanitizedName = sanitizeActivityName(entry?.name);
      if (!sanitizedName || !entry?.durationMs) return;
      const prev = map.get(sanitizedName) || 0;
      map.set(sanitizedName, prev + entry.durationMs);
    });
    if (current?.name) {
      const sanitizedName = sanitizeActivityName(current.name);
      const prev = map.get(sanitizedName) || 0;
      map.set(sanitizedName, prev + currentElapsed);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [entries, current, currentElapsed]);

  const sortedHistory = useMemo(() => {
    return [...entries].sort((a, b) => {
      const aDate = new Date(a.endedAt || a.startedAt || 0).getTime();
      const bDate = new Date(b.endedAt || b.startedAt || 0).getTime();
      return bDate - aDate;
    });
  }, [entries]);

  const isRunning = Boolean(current?.activeSegmentStart);
  const sanitizedSelectedName = sanitizeActivityName(activityName);
  const sanitizedCurrentName = sanitizeActivityName(current?.name);
  const isSameActivity =
    Boolean(sanitizedSelectedName) && sanitizedSelectedName === sanitizedCurrentName;
  const startDisabled = !sanitizedSelectedName || (isSameActivity && isRunning);
  const startLabel = !sanitizedSelectedName
    ? 'Start Activity'
    : isSameActivity
      ? isRunning
        ? 'Running'
        : 'Resume Activity'
      : current
        ? 'Switch Activity'
        : 'Start Activity';

  const persistEntries = (next) => {
    setEntries(next);
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(next));
  };

  const persistCurrent = (next) => {
    setCurrent(next);
    if (next) {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(CURRENT_KEY);
    }
  };

  const handleStart = () => {
    if (startDisabled) return;
    const now = new Date();
    ensureActivityBlogPost(sanitizedSelectedName);

    if (current && sanitizeActivityName(current.name) !== sanitizedSelectedName) {
      const finished = finalizeSession(current, now);
      if (finished) {
        persistEntries([...entries, finished]);
        recordActivitySessionInBlog(finished);
      }
    }

    if (current && sanitizeActivityName(current.name) === sanitizedSelectedName) {
      if (current.activeSegmentStart) return;
      const resumed = {
        ...current,
        activeSegmentStart: now.toISOString(),
      };
      persistCurrent(resumed);
    } else {
      const nextSession = {
        id: now.getTime(),
        name: sanitizedSelectedName,
        startedAt: now.toISOString(),
        elapsed: 0,
        segments: [],
        activeSegmentStart: now.toISOString(),
      };
      persistCurrent(nextSession);
      setActivityName(sanitizedSelectedName);
    }
  };

  const handlePause = () => {
    if (!current?.activeSegmentStart) return;
    const now = new Date();
    const startMs = new Date(current.activeSegmentStart).getTime();
    if (Number.isNaN(startMs)) {
      persistCurrent({ ...current, activeSegmentStart: null });
      return;
    }
    const endIso = now.toISOString();
    const duration = now.getTime() - startMs;
    const next = {
      ...current,
      elapsed: (current.elapsed || 0) + Math.max(0, duration),
      segments: [
        ...(Array.isArray(current.segments) ? current.segments : []),
        { start: current.activeSegmentStart, end: endIso },
      ],
      activeSegmentStart: null,
    };
    persistCurrent(next);
  };

  const handleStop = () => {
    if (!current) return;
    const finished = finalizeSession(current, new Date());
    if (finished) {
      persistEntries([...entries, finished]);
      recordActivitySessionInBlog(finished);
    }
    persistCurrent(null);
  };

  const handleClear = () => {
    if (!entries.length && !current) return;
    if (window.confirm('Clear all logged activities? This cannot be undone.')) {
      persistEntries([]);
      persistCurrent(null);
      setActivityName('');
    }
  };

  const handleSelectActivity = (event) => {
    setActivityName(event.target.value);
  };

  const handleStartAdding = () => {
    setIsAddingActivity(true);
    setNewActivityName('');
  };

  const handleCancelAdding = () => {
    setIsAddingActivity(false);
    setNewActivityName('');
  };

  const handleCreateActivity = (event) => {
    event.preventDefault();
    const sanitizedName = sanitizeActivityName(newActivityName);
    if (!sanitizedName) {
      return;
    }

    const existingMatch = activityOptions.find(
      (option) => option.toLowerCase() === sanitizedName.toLowerCase()
    );

    if (existingMatch) {
      setActivityName(existingMatch);
      setIsAddingActivity(false);
      setNewActivityName('');
      return;
    }

    ensureActivityBlogPost(sanitizedName);
    refreshActivityOptions();
    setActivityName(sanitizedName);
    setIsAddingActivity(false);
    setNewActivityName('');
  };

  return (
    <div className="placeholder-app activity-log">
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      <div className="current-activity-card">
        <div>
          <h2>Activity Tracker</h2>
          <p className="current-activity-label">
            {current ? (
              <>
                <span className="pill running">{current.name}</span>
                <span className="separator">•</span>
                {isRunning ? 'Tracking now' : 'Paused'}
              </>
            ) : (
              'No activity running'
            )}
          </p>
        </div>
        <div className="current-activity-time">
          {formatDuration(currentElapsed)}
        </div>
      </div>

      <section className="activity-log-controls">
        <label htmlFor="activity-input" className="activity-input-label">
          What are you doing right now?
        </label>
        <div className="activity-picker">
          <select
            id="activity-input"
            className="activity-select"
            value={activityOptions.includes(activityName) ? activityName : ''}
            onChange={handleSelectActivity}
          >
            <option value="" disabled>
              Select a tracked activity
            </option>
            {activityOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <div className="activity-picker-actions">
            {isAddingActivity ? (
              <form className="activity-picker-new" onSubmit={handleCreateActivity}>
                <input
                  type="text"
                  className="activity-input"
                  placeholder="Name the new activity"
                  value={newActivityName}
                  onChange={(event) => setNewActivityName(event.target.value)}
                />
                <div className="activity-picker-buttons">
                  <button type="submit" className="primary">
                    Save activity
                  </button>
                  <button type="button" onClick={handleCancelAdding}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button type="button" className="secondary" onClick={handleStartAdding}>
                Add a new activity
              </button>
            )}
          </div>
        </div>
        <p className="activity-picker-hint">
          Each activity in this list has a dedicated blog page where moments from across the app are collected.
        </p>
        <div className="control-buttons">
          <button
            type="button"
            className="primary"
            onClick={handleStart}
            disabled={startDisabled}
          >
            {startLabel}
          </button>
          <button
            type="button"
            onClick={handlePause}
            disabled={!isRunning}
          >
            Pause
          </button>
          <button type="button" onClick={handleStop} disabled={!current}>
            Stop &amp; Save
          </button>
          <button
            type="button"
            className="secondary"
            onClick={handleClear}
            disabled={!entries.length && !current}
          >
            Clear Log
          </button>
        </div>
      </section>

      <section className="activity-summary">
        <h3>Total time by activity</h3>
        {totals.length === 0 ? (
          <p className="empty">You have not logged any activity yet.</p>
        ) : (
          <ul>
            {totals.map(([name, duration]) => (
              <li key={name}>
                <span>{name}</span>
                <span>
                  {formatDuration(duration)}
                  <span className="hours">({(duration / 3600000).toFixed(2)} h)</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="activity-history">
        <h3>Session history</h3>
        {sortedHistory.length === 0 ? (
          <p className="empty">No sessions saved yet.</p>
        ) : (
          <ul>
            {sortedHistory.map((entry) => (
              <li key={entry.id}>
                <div className="history-header">
                  <span className="history-activity">{entry.name}</span>
                  <span className="history-duration">
                    {formatDuration(entry.durationMs)}
                  </span>
                </div>
                <div className="history-meta">
                  {formatDateTime(entry.startedAt)} → {formatDateTime(entry.endedAt)}
                </div>
                {entry.segments && entry.segments.length > 1 && (
                  <div className="history-meta muted">
                    {entry.segments.length} segments logged
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
