import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './nofap-calendar.css';
import RunEndModal from './RunEndModal.jsx';
import { supabaseClient } from './supabaseClient';

const DAY_MS = 24 * 60 * 60 * 1000;
const HEATMAP_DAYS = 365;

const defaultStats = {
  runCount: 0,
  longest: 0,
  relapses: 0,
  victories: 0,
};

const safeParse = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return parsed ?? fallback;
  } catch (error) {
    console.warn(`Failed to parse ${key} from storage`, error);
    return fallback;
  }
};

const startOfDay = (timestamp) => {
  const d = new Date(Number(timestamp));
  d.setHours(0, 0, 0, 0);
  return d.getTime();
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

const mapRemoteRun = (remote) => ({
  id: remote.id ?? null,
  start: Number(remote.start),
  end: remote.end ? Number(remote.end) : null,
  relapsed: Boolean(remote.relapsed),
  reason: remote.reason ?? '',
  relapseTime: remote.relapse_time ?? '',
});

const formatDuration = (ms) => {
  if (!ms || ms <= 0) {
    return '0d 0h 0m';
  }
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${days}d ${hours}h ${minutes}m`;
};

const formatDateRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const format = (date) =>
    `${date.getDate()} ${date.toLocaleString('default', {
      month: 'long',
    })} ${date.getFullYear()}`;
  return `${format(startDate)} → ${format(endDate)}`;
};

export default function NofapCalendar({ onBack }) {
  const [run, setRun] = useState(() => safeParse('nofapRun', null));
  const [runs, setRuns] = useState(() => safeParse('nofapRuns', []));
  const [statuses, setStatuses] = useState(() => safeParse('nofapStatuses', {}));
  const [stats, setStats] = useState(() => safeParse('nofapStats', defaultStats));
  const [now, setNow] = useState(() => Date.now());
  const [userId, setUserId] = useState(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endType, setEndType] = useState('end');
  const [lastOutcome, setLastOutcome] = useState(null);

  const pendingRunSyncRef = useRef(null);
  const runRef = useRef(run);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const saveRun = useCallback((updater) => {
    setRun((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next) {
        localStorage.setItem('nofapRun', JSON.stringify(next));
      } else {
        localStorage.removeItem('nofapRun');
      }
      return next;
    });
  }, []);

  const saveRuns = useCallback((updater) => {
    setRuns((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('nofapRuns', JSON.stringify(next));
      return next;
    });
  }, []);

  const saveStatuses = useCallback((next) => {
    setStatuses(next);
    localStorage.setItem('nofapStatuses', JSON.stringify(next));
  }, []);

  const saveStats = useCallback((next) => {
    setStats(next);
    localStorage.setItem('nofapStats', JSON.stringify(next));
  }, []);

  useEffect(() => {
    if (!runs.length) {
      saveStatuses({});
      saveStats(defaultStats);
      return;
    }

    const updated = {};
    let longest = 0;
    let relapses = 0;

    const ordered = [...runs].sort((a, b) => a.start - b.start);
    ordered.forEach((entry) => {
      if (!entry.end) return;
      const startDay = startOfDay(entry.start);
      const endDay = startOfDay(entry.end);
      const duration = endDay - startDay + DAY_MS;
      longest = Math.max(longest, duration);
      if (entry.relapsed) relapses += 1;

      let idx = 0;
      for (let ts = startDay; ts <= endDay; ts += DAY_MS, idx += 1) {
        const key = new Date(ts).toISOString().slice(0, 10);
        if (entry.relapsed && ts === endDay) {
          updated[key] = 'relapse';
        } else if (!updated[key]) {
          updated[key] = colorForIndex(idx);
        }
      }
    });

    saveStatuses(updated);
    saveStats({
      runCount: ordered.length,
      longest,
      relapses,
      victories: ordered.length - relapses,
    });
  }, [runs, saveStats, saveStatuses]);

  useEffect(() => {
    let cancelled = false;
    const hydrateFromRemote = async () => {
      if (!navigator.onLine) return;
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user || cancelled) return;
      setUserId(user.id);

      const { data, error } = await supabaseClient
        .from('runs')
        .select('id, start, end, relapsed, reason, relapse_time')
        .eq('user_id', user.id);

      if (error || !data || cancelled) {
        return;
      }

      const completed = [];
      let freshestActive = null;

      data.forEach((remote) => {
        const mapped = mapRemoteRun(remote);
        if (mapped.end) {
          completed.push(mapped);
        } else if (
          !freshestActive ||
          (mapped.start && mapped.start > freshestActive.start)
        ) {
          freshestActive = mapped;
        }
      });

      if (!cancelled && completed.length) {
        saveRuns((prev) => {
          const byKey = new Map();
          [...prev, ...completed].forEach((item) => {
            const key = item.id || item.start;
            const normalized = {
              ...item,
              end: item.end,
            };
            byKey.set(key, normalized);
          });
          return Array.from(byKey.values()).sort((a, b) => a.start - b.start);
        });
      }

      if (cancelled) return;

      if (freshestActive) {
        saveRun((current) => {
          if (current && current.start === freshestActive.start) {
            return { ...current, id: freshestActive.id };
          }
          if (!current || freshestActive.start > (current?.start || 0)) {
            return {
              id: freshestActive.id,
              start: freshestActive.start,
            };
          }
          return current;
        });
      } else {
        saveRun((current) => {
          if (!current) return current;
          const remotelyClosed = completed.some(
            (item) => item.start === current.start && item.end
          );
          return remotelyClosed ? null : current;
        });
      }
    };

    hydrateFromRemote();
    return () => {
      cancelled = true;
    };
  }, [saveRun, saveRuns]);

  const ensureRemoteRunId = useCallback(
    async (candidateRun) => {
      if (!candidateRun || !userId || !navigator.onLine) {
        return null;
      }

      if (candidateRun.id) return candidateRun.id;

      if (pendingRunSyncRef.current) {
        try {
          const { data } = await pendingRunSyncRef.current;
          if (data?.id) {
            saveRun((current) => {
              if (current && current.start === candidateRun.start) {
                return { ...current, id: data.id };
              }
              return current;
            });
            return data.id;
          }
        } catch (error) {
          console.warn('Pending run sync failed', error);
        }
      }

      const { data } = await supabaseClient
        .from('runs')
        .select('id, start')
        .eq('user_id', userId)
        .eq('start', candidateRun.start)
        .limit(1)
        .maybeSingle();

      if (data?.id) {
        saveRun((current) => {
          if (current && current.start === candidateRun.start) {
            return { ...current, id: data.id };
          }
          return current;
        });
        return data.id;
      }

      return null;
    },
    [saveRun, userId]
  );

  const startRun = useCallback(async () => {
    const startTimestamp = Date.now();
    const newRun = { start: startTimestamp };
    saveRun(newRun);

    if (userId && navigator.onLine) {
      const syncPromise = supabaseClient
        .from('runs')
        .insert({ user_id: userId, start: startTimestamp })
        .select()
        .single();

      pendingRunSyncRef.current = syncPromise;

      try {
        const { data } = await syncPromise;
        if (data?.id) {
          saveRun((current) => {
            if (current && current.start === startTimestamp) {
              return { ...current, id: data.id };
            }
            return current;
          });
        }
      } catch (error) {
        console.warn('Failed to sync started run', error);
      } finally {
        pendingRunSyncRef.current = null;
      }
    }
  }, [saveRun, userId]);

  const requestFinish = useCallback((type) => {
    setEndType(type);
    setShowEndModal(true);
  }, []);

  const finishRun = useCallback(
    async (reason, relapseTime) => {
      const activeRun = runRef.current;
      if (!activeRun) return;

      const relapsed = endType === 'relapse';
      const trimmedReason = reason?.trim() ?? '';
      const finishedAt = Date.now();

      let runId = null;
      try {
        runId = await ensureRemoteRunId(activeRun);
      } catch (error) {
        console.warn('Failed to ensure remote run id', error);
      }

      if (userId && navigator.onLine) {
        const payload = {
          end: finishedAt,
          relapsed,
          reason: trimmedReason,
          relapse_time: relapsed ? relapseTime : null,
        };
        try {
          if (runId) {
            await supabaseClient.from('runs').update(payload).eq('id', runId);
          } else {
            await supabaseClient.from('runs').insert({
              user_id: userId,
              start: activeRun.start,
              ...payload,
            });
          }
        } catch (error) {
          console.error('Failed to sync finished run', error);
        }
      }

      const completedEntry = {
        ...activeRun,
        id: runId || activeRun.id || null,
        end: finishedAt,
        relapsed,
        reason: trimmedReason,
        relapseTime: relapsed ? relapseTime : undefined,
      };

      saveRuns((prev) => {
        const filtered = prev.filter((r) => r.start !== activeRun.start);
        const merged = [...filtered, completedEntry].sort(
          (a, b) => a.start - b.start
        );
        return merged;
      });

      saveRun(null);
      setLastOutcome({
        relapsed,
        finishedAt,
      });
      setShowEndModal(false);
    },
    [endType, ensureRemoteRunId, saveRun, saveRuns, userId]
  );

  const daysSinceStart = useMemo(() => {
    if (!run) return 0;
    return Math.max(0, Math.floor((now - run.start) / DAY_MS));
  }, [now, run]);

  const currentStreakMs = useMemo(() => {
    if (!run) return 0;
    return Math.max(0, now - run.start);
  }, [now, run]);

  const longestStreakMs = stats.longest || 0;

  const recentRuns = useMemo(() => {
    if (!runs.length) return [];
    const sorted = [...runs]
      .filter((entry) => entry.end)
      .sort((a, b) => b.end - a.end);
    return sorted.slice(0, 5);
  }, [runs]);

  const lastRelapse = useMemo(() => {
    const relapseRun = [...runs]
      .filter((entry) => entry.relapsed)
      .sort((a, b) => b.end - a.end)[0];
    if (!relapseRun) return null;
    return relapseRun.end;
  }, [runs]);

  const dayLabels = useMemo(
    () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    []
  );

  const heatmapData = useMemo(() => {
    const dates = [];
    const start = new Date();
    start.setDate(start.getDate() - (HEATMAP_DAYS - 1));
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < HEATMAP_DAYS; i += 1) {
      dates.push(new Date(start.getTime() + i * DAY_MS));
    }

    const weeks = [];
    for (let i = 0; i < dates.length; i += 7) {
      weeks.push(dates.slice(i, i + 7));
    }

    const monthLabels = weeks.map((week, idx) => {
      const month = week[0].toLocaleString('default', { month: 'short' });
      if (idx === 0) return month;
      const prev = weeks[idx - 1][0].toLocaleString('default', {
        month: 'short',
      });
      return month === prev ? '' : month;
    });

    return { weeks, monthLabels };
  }, []);

  const getDayClass = useCallback(
    (date) => {
      const key = date.toISOString().slice(0, 10);
      if (statuses[key]) return `day ${statuses[key]}`;

      if (run) {
        const runStartDay = startOfDay(run.start);
        const dateDay = startOfDay(date.getTime());
        const currentDay = startOfDay(now);
        if (dateDay >= runStartDay && dateDay <= currentDay) {
          const dayIndex = Math.floor((dateDay - runStartDay) / DAY_MS);
          if (dayIndex >= 0) return `day active-run ${colorForIndex(dayIndex)}`;
        }
      }

      const today = startOfDay(Date.now());
      if (startOfDay(date.getTime()) === today) {
        return 'day today';
      }

      return 'day';
    },
    [now, run, statuses]
  );

  return (
    <div className="nofap-shell">
      <header className="nofap-header">
        <div className="header-left">
          <button type="button" className="back-button" onClick={onBack}>
            Back
          </button>
          <div>
            <h1>NoFap Lab</h1>
            <p>
              Keep shaping the contribution heart. Every day logged builds a
              stronger baseline.
            </p>
          </div>
        </div>
        <div className="header-metrics">
          <div className="metric-card">
            <span className="metric-label">Current streak</span>
            <strong className="metric-value">
              {formatDuration(currentStreakMs)}
            </strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Best streak</span>
            <strong className="metric-value">
              {formatDuration(longestStreakMs)}
            </strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Runs logged</span>
            <strong className="metric-value">{stats.runCount}</strong>
          </div>
        </div>
      </header>

      {lastOutcome && (
        <div className={`outcome-banner ${lastOutcome.relapsed ? 'relapse' : 'victory'}`}>
          {lastOutcome.relapsed
            ? 'Relapse captured. The slate is clean—start a new run when ready.'
            : 'Run archived as a victory. Celebrate the progress!'}
        </div>
      )}

      <section className="nofap-content">
        <div className="main-column">
          <div className="streak-card">
            <div className="streak-heart" aria-hidden="true">
              ❤️
            </div>
            <div className="streak-details">
              {run ? (
                <>
                  <h2>Active streak</h2>
                  <p>
                    {daysSinceStart} days in. Stay focused—the contribution
                    heart glows brighter with each win.
                  </p>
                  <div className="streak-count">
                    <span>{formatDuration(currentStreakMs)}</span>
                  </div>
                  <div className="streak-actions">
                    <button
                      type="button"
                      className="pill-button"
                      onClick={() => requestFinish('end')}
                    >
                      Mark Completed
                    </button>
                    <button
                      type="button"
                      className="pill-button danger"
                      onClick={() => requestFinish('relapse')}
                    >
                      Log Relapse
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2>No active streak</h2>
                  <p>
                    Press the spark to begin a fresh journey and grow the
                    grid.
                  </p>
                  <button
                    type="button"
                    className="pill-button primary"
                    onClick={startRun}
                  >
                    Start New Run
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="heatmap-card">
            <div className="heatmap-header">
              <div>
                <h2>Contribution Heart</h2>
                <p>
                  A GitHub-style snapshot of the past year. Darker squares
                  represent longer streak segments, while ✕ marks relapses.
                </p>
              </div>
              <div className="legend">
                {['green', 'yellow', 'orange', 'blue', 'purple', 'red', 'white'].map(
                  (color) => (
                    <span key={color} className={`legend-chip ${color}`} />
                  )
                )}
                <span className="legend-label">Intensity</span>
              </div>
            </div>
            <div className="heatmap-grid">
              <div className="month-labels">
                {heatmapData.monthLabels.map((label, idx) => (
                  <span key={idx} className="month-label">
                    {label}
                  </span>
                ))}
              </div>
              <div className="grid-wrapper">
                <div className="day-labels">
                  {dayLabels.map((label, idx) => (
                    <span key={label}>
                      {[1, 3, 5].includes(idx) ? label.slice(0, 3) : ''}
                    </span>
                  ))}
                </div>
                <div className="calendar-grid">
                  {heatmapData.weeks.map((week, wi) => (
                    <div key={`week-${wi}`} className="week">
                      {week.map((date) => (
                        <div
                          key={date.toISOString()}
                          className={getDayClass(date)}
                          title={date.toDateString()}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="runs-card">
            <h2>Recent runs</h2>
            {recentRuns.length ? (
              <ul className="runs-timeline">
                {recentRuns.map((entry) => (
                  <li key={entry.start}>
                    <div className="timeline-header">
                      <span className={`status-dot ${entry.relapsed ? 'relapse' : 'victory'}`} />
                      <strong>{formatDateRange(entry.start, entry.end)}</strong>
                    </div>
                    <div className="timeline-body">
                      <span className="duration">{formatDuration(entry.end - entry.start)}</span>
                      {entry.reason && (
                        <p className="reason">{entry.reason}</p>
                      )}
                      {entry.relapseTime && (
                        <p className="reason subtle">Relapse at {entry.relapseTime}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">
                No runs logged yet. Start one and your history will live here.
              </p>
            )}
          </div>
        </div>

        <aside className="insights-column">
          <div className="insight-card">
            <h3>Momentum</h3>
            <div className="insight-metric">
              <span className="label">Victories</span>
              <strong>{stats.victories}</strong>
            </div>
            <div className="insight-metric">
              <span className="label">Relapses</span>
              <strong>{stats.relapses}</strong>
            </div>
            <div className="insight-meter" role="progressbar" aria-valuemin={0} aria-valuemax={Math.max(stats.victories + stats.relapses, 1)} aria-valuenow={stats.victories}>
              <div
                style={{
                  width: `${Math.min(
                    100,
                    stats.runCount
                      ? Math.round((stats.victories / stats.runCount) * 100)
                      : 0
                  )}%`,
                }}
              />
            </div>
            <p className="insight-footnote">
              {stats.runCount ? (
                <>
                  {Math.round((stats.victories / stats.runCount) * 100)}% of runs ended
                  as victories.
                </>
              ) : (
                'Log your first run to see momentum insights.'
              )}
            </p>
          </div>

          <div className="insight-card">
            <h3>Last relapse</h3>
            {lastRelapse ? (
              <p className="insight-highlight">
                {new Date(lastRelapse).toLocaleString()}
              </p>
            ) : (
              <p className="empty-state">No relapses on record. Keep it going!</p>
            )}
          </div>

          <div className="insight-card focus-card">
            <h3>Keep the heart glowing</h3>
            <ul>
              <li>Stack micro-wins every day to deepen the gradient.</li>
              <li>Journal the reason after each run to spot patterns.</li>
              <li>Use relapses as data—log them immediately, then reset.</li>
            </ul>
          </div>
        </aside>
      </section>

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
