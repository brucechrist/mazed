import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  loadActivityBlogIndex,
  loadBlogPostsFromStorage,
  loadRegisteredActivityNames,
  persistActivityBlogIndex,
  persistBlogPostsToStorage,
  sanitizeBlogPostRecord,
} from './ToolsBlog.jsx';
import './placeholder-app.css';
import './activity-log.css';

const ENTRIES_KEY = 'activityLogEntries';
const CURRENT_KEY = 'activityLogCurrent';

const DEFAULT_ACTIVITIES = [
  'Meditation - Vipassana',
  'Meditation - Ramana',
  'Yoga',
  'Workout',
  'Reading',
];

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

const sanitizeActivityName = (name) => {
  if (typeof name !== 'string') {
    return '';
  }

  return name.trim();
};

const loadSanitizedBlogPosts = () => {
  if (typeof loadBlogPostsFromStorage !== 'function') {
    return [];
  }

  try {
    const storedPosts = loadBlogPostsFromStorage();
    if (!Array.isArray(storedPosts)) {
      return [];
    }

    return storedPosts
      .map((post) => safeSanitizeBlogPostRecord(post))
      .filter(Boolean);
  } catch (error) {
    console.error('Failed to load blog posts from storage', error);
    return [];
  }
};

const generatePostId = (posts) => {
  const usedIds = new Set(posts.map((post) => post.id));
  let candidate = Date.now();

  while (usedIds.has(candidate)) {
    candidate += 1;
  }

  return candidate;
};

const sanitizeSessionForBlog = (session) => {
  if (session == null || typeof session !== 'object') {
    return null;
  }

  const durationMs = Number(session.durationMs);
  const sanitizedDuration = Number.isFinite(durationMs) && durationMs >= 0 ? durationMs : 0;

  const sanitizedSession = {
    id: Number.isInteger(Number(session.id)) ? Number(session.id) : Date.now(),
    startedAt: typeof session.startedAt === 'string' ? session.startedAt : null,
    endedAt: typeof session.endedAt === 'string' ? session.endedAt : null,
    durationMs: sanitizedDuration,
  };

  if (!sanitizedSession.startedAt && !sanitizedSession.endedAt && sanitizedSession.durationMs === 0) {
    return null;
  }

  return sanitizedSession;
};

const safeSanitizeBlogPostRecord = (post) => {
  if (typeof sanitizeBlogPostRecord === 'function') {
    try {
      return sanitizeBlogPostRecord(post);
    } catch (error) {
      console.error('Failed to sanitize blog post record', error);
      return null;
    }
  }

  if (post && typeof post === 'object') {
    return { ...post };
  }

  return null;
};

const buildActivityOptions = (names) => {
  if (!Array.isArray(names)) {
    return [];
  }

  const byKey = new Map();
  names.forEach((name) => {
    const sanitized = sanitizeActivityName(name);
    if (!sanitized) {
      return;
    }

    const key = sanitized.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, sanitized);
    }
  });

  return Array.from(byKey.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
};

const withActivityBlogPost = (activityName, updater) => {
  const trimmedName = sanitizeActivityName(activityName);
  if (!trimmedName || typeof window === 'undefined') {
    return null;
  }

  const posts = loadSanitizedBlogPosts();
  const index =
    typeof loadActivityBlogIndex === 'function'
      ? loadActivityBlogIndex() || {}
      : {};
  const mappedId = Number(index[trimmedName]);
  const hasMappedId = Number.isInteger(mappedId);
  let postId = hasMappedId ? mappedId : null;
  let postIndex = posts.findIndex((post) => post.id === postId);

  if (postIndex === -1) {
    const matchedIndex = posts.findIndex((post) => {
      const candidate = sanitizeActivityName(post?.activityName ?? post?.title);
      return (
        !!candidate &&
        candidate.localeCompare(trimmedName, undefined, { sensitivity: 'base' }) === 0
      );
    });

    if (matchedIndex !== -1) {
      postIndex = matchedIndex;
      postId = posts[matchedIndex].id;
    }
  }

  if (postIndex === -1) {
    postId = generatePostId(posts);
    const newPost = safeSanitizeBlogPostRecord({
      id: postId,
      title: `${trimmedName} activity stream`,
      status: 'Draft',
      excerpt: `Automatically collecting moments linked to ${trimmedName}.`,
      stream: 'training-layer',
      mood: 'listening',
      images: [],
      link: '',
      activityName: trimmedName,
      activitySessions: [],
    });

    if (newPost) {
      posts.unshift(newPost);
      postIndex = 0;
    }
  }

  if (postIndex === -1) {
    return null;
  }

  index[trimmedName] = postId;
  const post = posts[postIndex];
  const updatedPost = updater ? updater(post) ?? post : post;
  const sanitizedPost = safeSanitizeBlogPostRecord({
    ...updatedPost,
    id: postId,
    activityName: updatedPost.activityName || trimmedName,
  });

  if (!sanitizedPost) {
    return null;
  }

  posts[postIndex] = sanitizedPost;
  if (typeof persistBlogPostsToStorage === 'function') {
    try {
      persistBlogPostsToStorage(posts);
    } catch (error) {
      console.error('Failed to persist blog posts to storage', error);
    }
  }
  if (typeof persistActivityBlogIndex === 'function') {
    try {
      persistActivityBlogIndex(index);
    } catch (error) {
      console.error('Failed to persist activity blog index', error);
    }
  }

  return sanitizedPost;
};

const ensureActivityBlogPost = (activityName) =>
  withActivityBlogPost(activityName, (post) => post);

const recordSessionInBlog = (session) => {
  const sanitizedSession = sanitizeSessionForBlog(session);
  const activityName = sanitizeActivityName(session?.name);

  if (!sanitizedSession || !activityName) {
    return;
  }

  withActivityBlogPost(activityName, (post) => {
    const existingSessions = Array.isArray(post.activitySessions)
      ? post.activitySessions
      : [];

    const hasExistingSession = existingSessions.some(
      (item) => Number(item?.id) === Number(sanitizedSession.id)
    );

    if (hasExistingSession) {
      return {
        ...post,
        activitySessions: existingSessions.map((item) =>
          Number(item?.id) === Number(sanitizedSession.id) ? sanitizedSession : item
        ),
      };
    }

    return {
      ...post,
      activitySessions: [...existingSessions, sanitizedSession],
    };
  });
};

export default function ActivityLog({ onBack }) {
  const buildOptionsFromStorage = useCallback(() => {
    let storedNames = [];
    try {
      storedNames =
        typeof loadRegisteredActivityNames === 'function'
          ? loadRegisteredActivityNames()
          : [];
    } catch (error) {
      console.error('Failed to load registered activity names', error);
      storedNames = [];
    }
    const sanitizedStored = Array.isArray(storedNames)
      ? buildActivityOptions(storedNames)
      : [];
    if (sanitizedStored.length > 0) {
      return sanitizedStored;
    }
    return buildActivityOptions(DEFAULT_ACTIVITIES);
  }, []);

  const [entries, setEntries] = useState(() =>
    safeParse(localStorage.getItem(ENTRIES_KEY), [])
  );
  const [current, setCurrent] = useState(() =>
    safeParse(localStorage.getItem(CURRENT_KEY), null)
  );
  const [activityName, setActivityName] = useState(() => current?.name || '');
  const [activityOptions, setActivityOptions] = useState(() =>
    buildOptionsFromStorage()
  );
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [tick, setTick] = useState(() => Date.now());

  const refreshActivityOptions = useCallback(() => {
    setActivityOptions(buildOptionsFromStorage());
  }, [buildOptionsFromStorage]);

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to persist activity log entries', error);
    }
  }, [entries]);

  useEffect(() => {
    try {
      if (current) {
        localStorage.setItem(CURRENT_KEY, JSON.stringify(current));
      } else {
        localStorage.removeItem(CURRENT_KEY);
      }
    } catch (error) {
      console.error('Failed to persist current activity session', error);
    }
  }, [current]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const ensureRegistered = (names) => {
      names.forEach((name) => ensureActivityBlogPost(name));
    };

    const syncActivityNetwork = (overrideNames) => {
      const names = overrideNames || buildOptionsFromStorage();
      setActivityOptions(names);
      ensureRegistered(names);
    };

    syncActivityNetwork();

    const handleActivitiesUpdated = (event) => {
      const detailNames = Array.isArray(event?.detail)
        ? event.detail
            .map((item) =>
              typeof item === 'string' ? item : sanitizeActivityName(item?.title)
            )
            .filter(Boolean)
        : [];
      const merged = buildActivityOptions([
        ...detailNames,
        ...buildOptionsFromStorage(),
      ]);
      syncActivityNetwork(merged);
    };

    const handleStorage = (event) => {
      if (
        !event ||
        event.key === 'activities' ||
        event.key === ENTRIES_KEY ||
        event.key === CURRENT_KEY
      ) {
        syncActivityNetwork();
      }
    };

    window.addEventListener('activities-updated', handleActivitiesUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('activities-updated', handleActivitiesUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, [buildOptionsFromStorage]);

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
  };

  const persistCurrent = (next) => {
    setCurrent(next);
  };

  const handleStart = () => {
    if (startDisabled) return;
    const now = new Date();
    ensureActivityBlogPost(sanitizedSelectedName);

    if (current && sanitizeActivityName(current.name) !== sanitizedSelectedName) {
      const finished = finalizeSession(current, now);
      if (finished) {
        persistEntries([...entries, finished]);
        recordSessionInBlog(finished);
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
      recordSessionInBlog(finished);
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
