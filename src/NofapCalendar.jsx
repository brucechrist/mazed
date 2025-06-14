import React, { useState, useEffect } from 'react';
import './nofap-calendar.css';

export default function NofapCalendar({ onBack }) {
  const [run, setRun] = useState(() => {
    const stored = localStorage.getItem('nofapRun');
    return stored ? JSON.parse(stored) : null;
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 60 * 1000);
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

  const startRun = () => {
    saveRun({ start: Date.now() });
  };

  const endRun = () => {
    saveRun(null);
  };

  const daysSinceStart = run
    ? Math.floor((now - run.start) / (1000 * 60 * 60 * 24))
    : 0;
  const hoursSinceStart = run
    ? Math.floor((now - run.start) / (1000 * 60 * 60)) % 24
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

  const getDayClass = (date) => {
    if (!run) return '';
    const dayIndex = Math.floor((date - run.start) / (1000 * 60 * 60 * 24));
    if (dayIndex < 0) return '';
    const nowDiff = now - (run.start + dayIndex * 24 * 60 * 60 * 1000);
    if (nowDiff >= 24 * 60 * 60 * 1000) {
      return 'done';
    }
    if (nowDiff < 0) return '';
    const hours = nowDiff / (1000 * 60 * 60);
    if (hours < 8) return 'progress1';
    if (hours < 16) return 'progress2';
    if (hours < 24) return 'progress3';
    return 'done';
  };

  return (
    <div className="nofap-calendar">
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      {run ? (
        <>
          <div className="streak">
            Streak: {daysSinceStart}d {hoursSinceStart}h
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
            <button className="action-button" onClick={endRun}>
              End Run
            </button>
          </div>
        </>
      ) : (
        <button className="action-button" onClick={startRun}>
          Start Run
        </button>
      )}
    </div>
  );
}
