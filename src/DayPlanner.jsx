import React, { useState, useEffect } from 'react';
import Calendar from './Calendar.jsx';
import './day-planner.css';

export default function DayPlanner({ onComplete, backLabel = 'Start Day' }) {
  const [goals, setGoals] = useState({
    transcendent: '',
    jackpot: '',
    rainbow: '',
    mirror: '',
  });
  const [activities, setActivities] = useState([]);
  const [counts, setCounts] = useState({});
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('todoBigGoals') || '{}');
      setGoals({
        transcendent: stored.transcendent || '',
        jackpot: stored.jackpot || '',
        rainbow: stored.rainbow || '',
        mirror: stored.mirror || '',
      });
    } catch {}
  }, []);

  const loadActivities = () => {
    try {
      const data = JSON.parse(localStorage.getItem('activities') || '[]');
      setActivities(data.filter((a) => a.planner));
    } catch {
      setActivities([]);
    }
  };

  useEffect(() => {
    loadActivities();
    const onUpdate = () => loadActivities();
    window.addEventListener('activities-updated', onUpdate);
    return () => window.removeEventListener('activities-updated', onUpdate);
  }, []);

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
    const c = {};
    events
      .filter((e) => e.kind === 'planned')
      .forEach((e) => {
        c[e.title] = (c[e.title] || 0) + 1;
      });
    setCounts(c);
  }, [activities]);

  const handleDrop = (ev) => {
    setCounts((prev) => ({
      ...prev,
      [ev.title]: (prev[ev.title] || 0) + 1,
    }));
  };

  const canStart = activities.every(
    (a) => (counts[a.title] || 0) >= (a.timesPerDay || 0)
  );

  const handleStart = () => {
    if (canStart) onComplete();
  };

  return (
    <div className="day-planner-overlay">
      <div className="day-planner">
        <div className="planner-calendar">
          <Calendar
            onBack={handleStart}
            backLabel={backLabel}
            defaultView="day"
            externalActivity={dragging}
            onExternalDrop={handleDrop}
            backDisabled={!canStart}
          />
        </div>
        <div className="planner-goals">
          <h2>Big Goals</h2>
          <ul>
            <li><strong>Transcendent:</strong> {goals.transcendent}</li>
            <li><strong>Jackpot:</strong> {goals.jackpot}</li>
            <li><strong>Rainbow:</strong> {goals.rainbow}</li>
            <li><strong>Mirror:</strong> {goals.mirror}</li>
          </ul>
          {activities.length > 0 && (
            <>
              <h2>Activities</h2>
              <div className="planner-activities">
                {activities.map((a) => {
                  const done = counts[a.title] || 0;
                  return (
                    <div
                      key={a.title}
                      className="planner-activity"
                      draggable
                      onDragStart={() => setDragging(a)}
                      onDragEnd={() => setDragging(null)}
                    >
                      <span>{a.title}</span>
                      <span className="planner-count">
                        {done}/{a.timesPerDay}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
