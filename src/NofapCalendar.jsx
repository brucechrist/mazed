import React, { useState } from 'react';
import './nofap-calendar.css';

export default function NofapCalendar({ onBack }) {
  const [run, setRun] = useState(() => {
    const stored = localStorage.getItem('nofapRun');
    return stored ? JSON.parse(stored) : null;
  });

  const saveRun = (r) => {
    if (r) {
      localStorage.setItem('nofapRun', JSON.stringify(r));
    } else {
      localStorage.removeItem('nofapRun');
    }
    setRun(r);
  };

  const startRun = () => {
    saveRun({ start: Date.now(), days: [] });
  };

  const endRun = () => {
    saveRun(null);
  };

  const addDay = () => {
    if (!run) return;
    const today = new Date().toISOString().split('T')[0];
    if (!run.days.includes(today)) {
      const updated = { ...run, days: [...run.days, today] };
      saveRun(updated);
    }
  };

  const daysSinceStart = run
    ? Math.floor((Date.now() - run.start) / (1000 * 60 * 60 * 24))
    : 0;
  const hoursSinceStart = run
    ? Math.floor((Date.now() - run.start) / (1000 * 60 * 60)) % 24
    : 0;

  const generateDates = (num) => {
    const dates = [];
    for (let i = num - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const allDates = generateDates(70); // last 10 weeks
  const weeks = [];
  for (let i = 0; i < allDates.length; i += 7) {
    weeks.push(allDates.slice(i, i + 7));
  }

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
          <div className="calendar-grid">
            {weeks.map((week, wi) => (
              <div key={wi} className="week">
                {week.map((date) => (
                  <div
                    key={date}
                    className={`day ${run.days.includes(date) ? 'done' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="actions">
            <button className="action-button" onClick={addDay}>
              Add Day
            </button>
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
