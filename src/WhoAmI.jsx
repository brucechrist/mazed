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
  const [duration, setDuration] = useState(() => {
    const d = localStorage.getItem('whoamiDuration');
    return d ? parseInt(d, 10) : 60;
  });

  useEffect(() => {
    localStorage.setItem('whoamiShortcut', shortcut);
  }, [shortcut]);

  useEffect(() => {
    localStorage.setItem('whoamiDuration', duration);
  }, [duration]);

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
    setSession({
      start: Date.now(),
      presses: [],
      paused: 0,
      pauseStarted: null,
      duration,
      beeped: false,
    });
    setRunning(true);
    setNow(Date.now());
  };

  const recordPress = () => {
    if (!session) return;
    setSession((s) => ({ ...s, presses: [...s.presses, Date.now()] }));
  };

  const resetTimer = () => {
    if (!session) return;
    setRunning(false);
    setSession({
      start: Date.now(),
      presses: [],
      paused: 0,
      pauseStarted: null,
      duration,
      beeped: false,
    });
    setNow(Date.now());
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

  const timeLeft = session ? Math.max(0, session.duration * 60000 - elapsed) : 0;

  useEffect(() => {
    if (!session || !running) return;
    if (timeLeft <= 0 && !session.beeped) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      setSession((s) => ({ ...s, beeped: true }));
    }
  }, [timeLeft, running, session]);

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
        <>
          <div className="duration-input">
            Duration (min):
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <button className="action-button" onClick={startSession}>Start Session</button>
        </>
      ) : (
        <>
          <div className="controls">
            <button className="action-button" onClick={recordPress}>Thought</button>
            <label className="switch">
              <input type="checkbox" checked={running} onChange={toggleRunning} />
              <span className="slider" />
            </label>
            <button className="action-button" onClick={resetTimer}>Reset Timer</button>
            <div className="time">{(elapsed / 1000).toFixed(0)}s</div>
            <div className="time-left">Left: {(timeLeft / 1000).toFixed(0)}s</div>
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
