import React, { useState, useEffect } from 'react';
import './activity-timer.css';

export default function ActivityTimer() {
  const [activity, setActivity] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('activeActivity')) || null;
    } catch {
      return null;
    }
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!activity) return 0;
    return Math.max(0, Math.floor((new Date(activity.end) - Date.now()) / 1000));
  });

  useEffect(() => {
    const handle = setInterval(() => {
      setActivity((current) => {
        if (!current) return null;
        const remaining = Math.floor((new Date(current.end) - Date.now()) / 1000);
        if (remaining <= 0) {
          localStorage.removeItem('activeActivity');
          return null;
        }
        setTimeLeft(remaining);
        return current;
      });
    }, 1000);
    return () => clearInterval(handle);
  }, []);

  useEffect(() => {
    const onStorage = () => {
      try {
        const data = JSON.parse(localStorage.getItem('activeActivity')) || null;
        setActivity(data);
        if (data) {
          setTimeLeft(Math.max(0, Math.floor((new Date(data.end) - Date.now()) / 1000)));
        }
      } catch {
        setActivity(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!activity) return null;

  return (
    <div className="activity-timer">
      <span className="clock">⏰</span>
      <span className="timer-label">
        {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
      </span>
    </div>
  );
}
