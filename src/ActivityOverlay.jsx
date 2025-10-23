import React, { useEffect, useMemo, useState } from 'react';
import './activity-overlay.css';

const CURRENT_SESSION_KEY = 'activityLogCurrent';

const sanitizeOverlaySession = (session) => {
  if (!session || typeof session !== 'object') {
    return null;
  }

  const name = typeof session.name === 'string' ? session.name.trim() : '';
  if (!name) {
    return null;
  }

  const parseDate = (value) =>
    typeof value === 'string' && value.trim() !== '' ? value : null;

  const elapsedValue = Number(session.elapsed);
  const elapsed = Number.isFinite(elapsedValue) && elapsedValue > 0 ? elapsedValue : 0;

  return {
    id: session.id != null ? String(session.id) : null,
    name,
    startedAt: parseDate(session.startedAt),
    activeSegmentStart: parseDate(session.activeSegmentStart),
    elapsed,
  };
};

const readStoredSession = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(CURRENT_SESSION_KEY);
    if (!raw) {
      return null;
    }
    return sanitizeOverlaySession(JSON.parse(raw));
  } catch {
    return null;
  }
};

const computeElapsed = (session, nowMs) => {
  if (!session) {
    return 0;
  }
  const base = Number.isFinite(session.elapsed) ? session.elapsed : 0;
  if (!session.activeSegmentStart) {
    return base;
  }
  const startMs = new Date(session.activeSegmentStart).getTime();
  if (Number.isNaN(startMs) || nowMs <= startMs) {
    return base;
  }
  return base + (nowMs - startMs);
};

const formatDuration = (ms) => {
  if (!ms || ms <= 0) {
    return '0m 00s';
  }
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  parts.push(`${hours > 0 ? String(minutes).padStart(2, '0') : minutes}m`);
  parts.push(String(seconds).padStart(2, '0') + 's');
  return parts.join(' ');
};

export default function ActivityOverlay() {
  const [session, setSession] = useState(() => readStoredSession());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    document.body.classList.add('activity-overlay-body');
    return () => {
      document.body.classList.remove('activity-overlay-body');
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!window || !window.addEventListener) {
      return undefined;
    }
    const handleStorage = (event) => {
      if (event && event.key && event.key !== CURRENT_SESSION_KEY) {
        return;
      }
      setSession(readStoredSession());
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    if (window.electronAPI?.requestActivityOverlayState) {
      window.electronAPI
        .requestActivityOverlayState()
        .then((state) => {
          if (disposed) return;
          if (state && state.session) {
            setSession(sanitizeOverlaySession(state.session));
          } else {
            setSession(null);
          }
        })
        .catch(() => {
          if (!disposed) {
            setSession((prev) => prev);
          }
        });
    }
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!window.electronAPI?.onActivityOverlayUpdate) {
      return undefined;
    }
    const unsubscribe = window.electronAPI.onActivityOverlayUpdate((next) => {
      if (next) {
        setSession(sanitizeOverlaySession(next));
      } else {
        setSession(null);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const elapsed = useMemo(() => computeElapsed(session, now), [session, now]);
  const formattedElapsed = formatDuration(elapsed);
  const activityLabel = session ? session.name : 'No activity';
  const timerLabel = session ? formattedElapsed : '0m 00s';

  return (
    <div className={`activity-overlay ${session ? 'active' : 'inactive'}`}>
      <div className="overlay-activity" aria-live="polite">
        {activityLabel}
      </div>
      <div className="overlay-timer" aria-live="polite">
        {timerLabel}
      </div>
    </div>
  );
}
