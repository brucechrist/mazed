import React, { useState, useEffect } from 'react';
import './nofap-calendar.css';
import RunEndModal from './RunEndModal.jsx';
import { supabaseClient } from './supabaseClient';

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
  const [userId, setUserId] = useState(null);
  const [runs, setRuns] = useState(() => {
    const stored = localStorage.getItem('nofapRuns');
    return stored ? JSON.parse(stored) : [];
  });
  const [showEndModal, setShowEndModal] = useState(false);
  const [endType, setEndType] = useState('end');

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchRuns = async () => {
      if (!navigator.onLine) return;
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabaseClient
        .from('runs')
        .select('*')
        .eq('user_id', user.id);
      if (data) {
        const active = data.find((r) => r.end === null);
        const completed = data.filter((r) => r.end !== null);
        if (active) {
          saveRun({ id: active.id, start: active.start });
        }
        if (completed.length) {
          saveRuns(
            completed.map((r) => ({
              id: r.id,
              start: r.start,
              end: r.end,
              relapsed: r.relapsed,
              reason: r.reason,
              relapseTime: r.relapse_time,
            }))
          );
        }
      }
    };
    fetchRuns();
  }, []);

  const saveRun = (r) => {
    if (r) {
      localStorage.setItem('nofapRun', JSON.stringify(r));
    } else {
      localStorage.removeItem('nofapRun');
    }
    setRun(r);
  };

  const saveRuns = (list) => {
    setRuns(list);
    localStorage.setItem('nofapRuns', JSON.stringify(list));
  };

  const saveStatuses = (s) => {
    setStatuses(s);
    localStorage.setItem('nofapStatuses', JSON.stringify(s));
  };

  const saveStats = (s) => {
    setStats(s);
    localStorage.setItem('nofapStats', JSON.stringify(s));
  };

  useEffect(() => {
    const compute = () => {
      const updated = {};
      let longest = 0;
      const ordered = [...runs].sort((a, b) => a.start - b.start);
      ordered.forEach((r) => {
        const startDay = new Date(r.start);
        startDay.setHours(0, 0, 0, 0);
        const endDay = new Date(r.end);
        endDay.setHours(0, 0, 0, 0);
        for (
          let d = new Date(startDay), idx = 0;
          d <= endDay;
          d.setDate(d.getDate() + 1), idx++
        ) {
          const key = d.toISOString().slice(0, 10);
          const isRelapseDay = r.relapsed && d.getTime() === endDay.getTime();
          if (isRelapseDay) {
            updated[key] = 'relapse';
          } else if (!updated[key]) {
            updated[key] = colorForIndex(idx);
          }
        }
        longest = Math.max(longest, r.end - r.start);
      });
      saveStatuses(updated);
      saveStats({ runCount: runs.length, longest });
    };
    compute();
  }, [runs]);

  const startRun = async () => {
    const newRun = { start: Date.now() };
    if (userId && navigator.onLine) {
      const { data } = await supabaseClient
        .from('runs')
        .insert({ user_id: userId, start: newRun.start })
        .select()
        .single();
      if (data) newRun.id = data.id;
    }
    saveRun(newRun);
  };

  const requestFinish = (type) => {
    setEndType(type);
    setShowEndModal(true);
  };

  const colorForIndex = (idx) => {
    const day = idx + 1;
    if (day <= 7) return 'green';
    if (day <= 15) return 'yellow';
    if (day <= 30) return 'orange';
    if (day <= 45) return 'blue';
    if (day <= 60) return 'purple';
    if (day <= 90) return 'red';
    return 'white';
  };

  const finishRun = async (reason, relapseTime) => {
    if (!run) return;
    const relapsed = endType === 'relapse';
    const nowTime = Date.now();
    const entry = { ...run, end: nowTime, relapsed, reason };
    if (relapsed) entry.relapseTime = relapseTime;
    if (userId && navigator.onLine) {
      if (run.id) {
        await supabaseClient
          .from('runs')
          .update({ end: nowTime, relapsed, reason, relapse_time: relapseTime })
          .eq('id', run.id);
      } else {
        await supabaseClient.from('runs').insert({
          user_id: userId,
          start: run.start,
          end: nowTime,
          relapsed,
          reason,
          relapse_time: relapseTime,
        });
      }
    }
    const newRuns = [...runs, entry];
    saveRuns(newRuns);
    saveRun(null);
    setShowEndModal(false);
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
    return colorForIndex(dayIndex);
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
            <button className="action-button" onClick={() => requestFinish('end')}>
              End Run
            </button>
            <button className="action-button" onClick={() => requestFinish('relapse')}>
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
      <h3>Runs</h3>
      <div className="runs-list">
        {runs.map((r, idx) => (
          <div key={idx} className="run-banner">
            <div>
              {new Date(r.start).getDate()} {new Date(r.start).toLocaleString('default', { month: 'long' })} {new Date(r.start).getFullYear()} to {new Date(r.end).getDate()} {new Date(r.end).toLocaleString('default', { month: 'long' })} {new Date(r.end).getFullYear()}, {Math.ceil((r.end - r.start) / DAY_MS)} days
            </div>
            <div>Reason: {r.reason || 'N/A'}</div>
            {r.relapseTime && <div>Relapse at: {r.relapseTime}</div>}
          </div>
        ))}
      </div>
      {showEndModal && (
        <RunEndModal
          type={endType}
          onSave={finishRun}
          onClose={() => setShowEndModal(false)}
        />
      )}
    </div>
  );
}
