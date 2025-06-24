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

  const clusterThreshold = 3000;
  const clustered = [];
  if (session) {
    session.presses.forEach((t) => {
      if (!clustered.length || t - clustered[clustered.length - 1] > clusterThreshold) {
        clustered.push(t);
      }
    });
  }
  const clusterIntervals = clustered.map((t, i) => (i === 0 ? t - session.start : t - clustered[i - 1]));
  const clusterAvg = clusterIntervals.length
    ? clusterIntervals.reduce((a, b) => a + b, 0) / clusterIntervals.length
    : 0;
  const clusterLongest = clusterIntervals.length ? Math.max(...clusterIntervals) : 0;
  const clusterTpm = elapsed > 0 ? clustered.length / (elapsed / 60000) : 0;

  const segments = [
    { label: '0-15m', start: 0, end: 15 },
    { label: '15-30m', start: 15, end: 30 },
    { label: '30-45m', start: 30, end: 45 },
    { label: '45-60m', start: 45, end: 60 },
  ];
  const [segIndex, setSegIndex] = useState(0);

  const segmentStats = () => {
    if (!session) return { count: 0, avg: 0, longest: 0, tpm: 0 };
    const seg = segments[segIndex];
    const startMs = seg.start * 60000;
    const endMs = seg.end * 60000;
    const filtered = session.presses.filter((t) => {
      const rel = t - session.start;
      return rel >= startMs && rel < endMs;
    });
    const relTimes = filtered.map((t) => t - session.start);
    const inter = relTimes.map((t, i) => (i === 0 ? t - startMs : t - relTimes[i - 1]));
    const avgInt = inter.length ? inter.reduce((a, b) => a + b, 0) / inter.length : 0;
    const longInt = inter.length ? Math.max(...inter) : 0;
    const segDur = Math.min(Math.max(elapsed - startMs, 0), endMs - startMs);
    const segTpm = segDur > 0 ? filtered.length / (segDur / 60000) : 0;
    return { count: filtered.length, avg: avgInt, longest: longInt, tpm: segTpm };
  };

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
          <div className="stats-container">
            <div className="stats">
              <div><strong>Raw Stats</strong></div>
              <div>Total Presses: {session.presses.length}</div>
              <div>Avg Interval: {(avg / 1000).toFixed(1)}s</div>
              <div>Longest Interval: {(longest / 1000).toFixed(1)}s</div>
              <div>TPM: {tpm.toFixed(2)}</div>
            </div>
            <div className="stats">
              <div><strong>Clustered Stats</strong></div>
              <div>Total Events: {clustered.length}</div>
              <div>Avg Interval: {(clusterAvg / 1000).toFixed(1)}s</div>
              <div>Longest Interval: {(clusterLongest / 1000).toFixed(1)}s</div>
              <div>TPM: {clusterTpm.toFixed(2)}</div>
            </div>
          </div>
          <div className="segment-tabs">
            {segments.map((seg, idx) => (
              <button
                key={seg.label}
                className={idx === segIndex ? 'active' : ''}
                onClick={() => setSegIndex(idx)}
              >
                {seg.label}
              </button>
            ))}
          </div>
          <div className="stats">
            {(() => {
              const s = segmentStats();
              return (
                <>
                  <div><strong>Segment Stats</strong></div>
                  <div>Total Presses: {s.count}</div>
                  <div>Avg Interval: {(s.avg / 1000).toFixed(1)}s</div>
                  <div>Longest Interval: {(s.longest / 1000).toFixed(1)}s</div>
                  <div>TPM: {s.tpm.toFixed(2)}</div>
                </>
              );
            })()}
          </div>
          <svg className="chart" width={chartWidth} height={chartHeight}>
            <path d={path} fill="none" stroke="lime" strokeWidth="2" />
          </svg>
        </>
      )}
    </div>
  );
}
