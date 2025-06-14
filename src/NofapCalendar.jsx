import React, { useState, useEffect } from 'react';
import './nofap-calendar.css';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function NofapCalendar({ onBack }) {
  const [run, setRun] = useState(() => {
    const stored = localStorage.getItem('nofapRun');
    return stored ? JSON.parse(stored) : null;
  });
  const [statuses, setStatuses] = useState(() => {
    const stored = localStorage.getItem('nofapStatuses');
    return stored ? JSON.parse(stored) : {};
  });
  const [stats, setStats] = useState(() => {
    const stored = localStorage.getItem('nofapStats');
    return stored ? JSON.parse(stored) : { runCount: 0, longest: 0 };
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const saveRun = (r) => {
    if (r) {
      localStorage.setItem('nofapRun', JSON.stringify(r));
    } else {
      localStorage.removeItem('nofapRun');
    }
    setRun(r);
  };

  const saveStatuses = (s) => {
    setStatuses(s);
    localStorage.setItem('nofapStatuses', JSON.stringify(s));
  };

  const saveStats = (s) => {
    setStats(s);
    localStorage.setItem('nofapStats', JSON.stringify(s));
  };

  const startRun = () => {
    saveRun({ start: Date.now() });
  };

  const finishRun = (relapsed) => {
    if (!run) return;
    const nowTime = Date.now();
    const startDay = new Date(run.start);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(nowTime);
    endDay.setHours(0, 0, 0, 0);
    const updated = { ...statuses };
    for (let d = new Date(startDay); d <= endDay; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      if (relapsed && d.getTime() === endDay.getTime()) {
        updated[key] = 'relapse';
      } else {
        updated[key] = 'done';
      }
    }
    saveStatuses(updated);
    const streakMs = nowTime - run.start;
    const newStats = {
      runCount: stats.runCount + 1,
      longest: Math.max(stats.longest, streakMs),
    };
    saveStats(newStats);
    saveRun(null);
  };

  const daysSinceStart = run
    ? Math.max(0, Math.floor((now - run.start) / DAY_MS))
    : 0;
  const hoursSinceStart = run
    ? Math.max(0, Math.floor((now - run.start) / (1000 * 60 * 60)) % 24)
    : 0;
  const minutesSinceStart = run
    ? Math.max(0, Math.floor((now - run.start) / (1000 * 60)) % 60)
    : 0;

  const generateDates = (num) => {
    const dates = [];
    const start = new Date();
    start.setDate(start.getDate() - (num - 1));
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < num; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const allDates = generateDates(365); // last year
  const weeks = [];
  for (let i = 0; i < allDates.length; i += 7) {
    weeks.push(allDates.slice(i, i + 7));
  }

  const monthLabels = weeks.map((week, idx) => {
    const month = week[0].toLocaleString('default', { month: 'short' });
    if (idx === 0) return month;
    const prev = weeks[idx - 1][0].toLocaleString('default', { month: 'short' });
    return month === prev ? '' : month;
  });

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const startOfDay = (t) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const getDayClass = (date) => {
    const key = date.toISOString().slice(0, 10);
    if (statuses[key]) return statuses[key];
    if (!run) return '';
    const runStartDay = startOfDay(run.start);
    const dateDay = startOfDay(date);
    const currentDay = startOfDay(now);
    if (dateDay < runStartDay || dateDay > currentDay) return '';
    const dayIndex = Math.floor((dateDay - runStartDay) / DAY_MS);
    const startTime = run.start + dayIndex * DAY_MS;
    const diff = now - startTime;
    if (diff >= DAY_MS) return 'done';
    if (diff < 0) return '';
    const hours = diff / (1000 * 60 * 60);
    if (hours < 8) return 'progress1';
    if (hours < 16) return 'progress2';
    return 'progress3';
  };

  return (
    <div className="nofap-calendar">
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      {run ? (
        <>
          <div className="streak">
            Streak: {daysSinceStart}d {hoursSinceStart}h {minutesSinceStart}m
          </div>
          <div className="stats-line">
            Runs: {stats.runCount} | Longest: {Math.floor(stats.longest / DAY_MS)}d {Math.floor(stats.longest / (1000 * 60 * 60)) % 24}h {Math.floor(stats.longest / (1000 * 60)) % 60}m
          </div>
          <div className="month-labels">
            {monthLabels.map((m, idx) => (
              <span key={idx} className="month-label">
                {m}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex' }}>
            <div className="day-labels">
              {dayLabels.map((d, idx) => (
                <span key={idx}>{[1,3,5].includes(idx) ? d.slice(0,3) : ''}</span>
              ))}
            </div>
            <div className="calendar-grid">
              {weeks.map((week, wi) => (
                <div key={wi} className="week">
                  {week.map((date) => (
                    <div
                      key={date.toISOString()}
                      className={`day ${getDayClass(date)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="actions">
            <button className="action-button" onClick={() => finishRun(false)}>
              End Run
            </button>
            <button className="action-button" onClick={() => finishRun(true)}>
              Relapse
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="stats-line">
            Runs: {stats.runCount} | Longest: {Math.floor(stats.longest / DAY_MS)}d {Math.floor(stats.longest / (1000 * 60 * 60)) % 24}h {Math.floor(stats.longest / (1000 * 60)) % 60}m
          </div>
          <button className="action-button" onClick={startRun}>
            Start Run
          </button>
        </>
      )}
    </div>
  );
}
