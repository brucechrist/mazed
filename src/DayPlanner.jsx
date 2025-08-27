import React, { useState, useEffect } from 'react';
import Calendar from './Calendar.jsx';
import './day-planner.css';

export default function DayPlanner({ onComplete }) {
  const [goals, setGoals] = useState({
    transcendent: '',
    jackpot: '',
    rainbow: '',
    mirror: '',
  });

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

  return (
    <div className="day-planner-overlay">
      <div className="day-planner">
        <div className="planner-calendar">
          <Calendar onBack={onComplete} backLabel="Start Day" />
        </div>
        <div className="planner-goals">
          <h2>Big Goals</h2>
          <ul>
            <li><strong>Transcendent:</strong> {goals.transcendent}</li>
            <li><strong>Jackpot:</strong> {goals.jackpot}</li>
            <li><strong>Rainbow:</strong> {goals.rainbow}</li>
            <li><strong>Mirror:</strong> {goals.mirror}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
