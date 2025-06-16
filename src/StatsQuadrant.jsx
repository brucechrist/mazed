import React, { useState, useEffect } from 'react';
import './stats-quadrant.css';
import { supabase } from './supabaseClient.js';

export default function StatsQuadrant({ initialStats = [5, 5, 5, 5] }) {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const total = stats.reduce((sum, val) => sum + Number(val), 0);
  const starsUnlocked = Math.min(5, Math.floor(total / 100));

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('stats')
          .eq('id', user.id)
          .single();
        if (data && data.stats) {
          setStats(data.stats);
        }
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (loading) return;
    const saveStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ stats })
          .eq('id', user.id);
      }
    };
    saveStats();
  }, [stats, loading]);

    useEffect(() => {
    document.body.classList.add('character-page');
    return () => {
      document.body.classList.remove('character-page');
    };
  }, []);

  const handleChange = (index, value) => {
    const updated = [...stats];
    updated[index] = value;
    setStats(updated);
  };

  return (
    <>
      <div className="stats-quadrant">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`quadrant ${['top-left', 'top-right', 'bottom-left', 'bottom-right'][i]}`}
            onClick={() => setEditing(i)}
          >
            {editing === i ? (
              <input
                type="number"
                autoFocus
                value={stat}
                onChange={(e) => handleChange(i, parseInt(e.target.value, 10))}
                onBlur={() => setEditing(null)}
              />
            ) : (
              <span>{stat}</span>
            )}
          </div>
        ))}
      </div>
      <div className="total-display">
        <div className="power-label">POWER LEVEL</div>
        <div className="stars">
          {[...Array(5)].map((_, idx) => (
            <svg
              key={idx}
              viewBox="0 0 24 24"
              width="66"
              height="66"
              style={{ opacity: idx < starsUnlocked ? 1 : 0.3 }}
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
            </svg>
          ))}
        </div>
        <div className="total-number">{total}</div>
      </div>
           <div className="extra-buttons">
        <button className="square" />
        <button className="round" />
      </div>
    </>
  );
}
