import React, { useState, useEffect } from 'react';
import './whoami.css';

export default function WhoAmI({ onBack }) {
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem('whoamiSession');
    return stored ? JSON.parse(stored) : null;
  });
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [shortcut, setShortcut] = useState(() => {
    return localStorage.getItem('whoamiShortcut') || 't';
  });

  useEffect(() => {
    localStorage.setItem('whoamiShortcut', shortcut);
  }, [shortcut]);

  useEffect(() => {
    if (session) {
      localStorage.setItem('whoamiSession', JSON.stringify(session));
    } else {
      localStorage.removeItem('whoamiSession');
    }
  }, [session]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    const handler = (e) => {
      if (session && running && e.key.toLowerCase() === shortcut.toLowerCase()) {
        recordPress();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [session, running, shortcut]);

  const startSession = () => {
    setSession({ start: Date.now(), presses: [], paused: 0, pauseStarted: null });
    setRunning(true);
    setNow(Date.now());
  };

  const recordPress = () => {
    if (!session) return;
    setSession((s) => ({ ...s, presses: [...s.presses, Date.now()] }));
  };

  const toggleRunning = () => {
    if (!session) return;
    if (running) {
      setRunning(false);
      setSession((s) => ({ ...s, pauseStarted: Date.now() }));
    } else {
      setRunning(true);
      setSession((s) => ({
        ...s,
        paused: s.paused + (Date.now() - (s.pauseStarted || Date.now())),
        pauseStarted: null,
      }));
    }
  };

  const elapsed = session
    ? (running ? now : session.pauseStarted || now) - session.start - session.paused
    : 0;
  const intervals = session
    ? session.presses.map((t, i) => (i === 0 ? t - session.start : t - session.presses[i - 1]))
    : [];
  const avg = intervals.length ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
  const longest = intervals.length ? Math.max(...intervals) : 0;
  const tpm = elapsed > 0 ? (session.presses.length / (elapsed / 60000)) : 0;

  const chartWidth = 300;
  const chartHeight = 100;
  let path = '';
  if (intervals.length > 1) {
    const max = Math.max(...intervals);
    intervals.forEach((intv, idx) => {
      const x = (idx / (intervals.length - 1)) * chartWidth;
      const y = chartHeight - (intv / max) * chartHeight;
      path += `${idx === 0 ? 'M' : 'L'}${x},${y} `;
    });
  }

  return (
    <div className="whoami">
      <button className="back-button" onClick={onBack}>Back</button>
      {!session ? (
        <button className="action-button" onClick={startSession}>Start Session</button>
      ) : (
        <>
          <div className="controls">
            <button className="action-button" onClick={recordPress}>Thought</button>
            <label className="switch">
              <input type="checkbox" checked={running} onChange={toggleRunning} />
              <span className="slider" />
            </label>
            <div className="time">{(elapsed / 1000).toFixed(0)}s</div>
          </div>
          <div className="shortcut-input">
            Shortcut key:
            <input
              value={shortcut}
              onChange={(e) => setShortcut(e.target.value)}
              maxLength={1}
            />
          </div>
          <div className="stats">
            <div>Total Presses: {session.presses.length}</div>
            <div>Avg Interval: {(avg / 1000).toFixed(1)}s</div>
            <div>Longest Interval: {(longest / 1000).toFixed(1)}s</div>
            <div>TPM: {tpm.toFixed(2)}</div>
          </div>
          <svg className="chart" width={chartWidth} height={chartHeight}>
            <path d={path} fill="none" stroke="lime" strokeWidth="2" />
          </svg>
        </>
      )}
    </div>
  );
}
