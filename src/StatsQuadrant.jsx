import React, { useState, useEffect } from 'react';
import { supabaseClient } from './supabaseClient';
import IdentityCard from './IdentityCard.jsx';
import './stats-quadrant.css';

export default function StatsQuadrant({ initialStats = [5, 5, 5, 5] }) {
  const [stats, setStats] = useState(() => {
    const stored = localStorage.getItem('characterStats');
    return stored ? JSON.parse(stored) : initialStats;
  });
  const [bonus, setBonus] = useState(() => {
    const stored = localStorage.getItem('characterBonus');
    if (!stored) return 0;
    const parsed = Number(JSON.parse(stored));
    return Number.isFinite(parsed) ? parsed : 0;
  });
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState({});
  const [editing, setEditing] = useState(null);

  const total =
    stats.reduce((sum, val) => sum + Number(val), 0) + Number(bonus || 0);
  const starsUnlocked = Math.min(5, Math.floor(total / 100));

  useEffect(() => {
    localStorage.setItem('characterStats', JSON.stringify(stats));
    if (userId) {
      supabaseClient.from('profiles').update({ stats }).eq('id', userId);
    }
  }, [stats, userId]);

  useEffect(() => {
    localStorage.setItem('characterBonus', JSON.stringify(bonus));
  }, [bonus]);

  useEffect(() => {
    document.body.classList.add('character-page');
    return () => {
      document.body.classList.remove('character-page');
    };
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabaseClient
        .from('profiles')
        .select('stats, mbti, enneagram, username')
        .eq('id', user.id)
        .single();
      if (data) {
        if (data.stats) setStats(data.stats);
        setProfile(data);
      }
    };
    fetchStats();
  }, []);

  const handleChange = (index, value) => {
    const updated = [...stats];
    updated[index] = value;
    setStats(updated);
  };

  const handleBonusChange = (value) => {
    if (Number.isNaN(value)) {
      setBonus(0);
      return;
    }
    setBonus(value);
  };

  return (
    <div className="character-scroll">
      <section className="header-section">
        <h2 className="character-title">Character</h2>
      </section>
      <section className="stats-section">
        <div className="stats-quadrant-wrapper">
          <div
            className="side-value"
            onClick={() => setEditing('bonus')}
          >
            {editing === 'bonus' ? (
              <input
                type="number"
                autoFocus
                value={bonus}
                onChange={(e) =>
                  handleBonusChange(parseInt(e.target.value, 10))
                }
                onBlur={() => setEditing(null)}
              />
            ) : (
              <span>{bonus}</span>
            )}
          </div>
          <div className="stats-quadrant">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`quadrant ${[
                  'top-left',
                  'top-right',
                  'bottom-left',
                  'bottom-right',
                ][i]}`}
                onClick={() => setEditing(i)}
              >
                {editing === i ? (
                  <input
                    type="number"
                    autoFocus
                    value={stat}
                    onChange={(e) =>
                      handleChange(i, parseInt(e.target.value, 10))
                    }
                    onBlur={() => setEditing(null)}
                  />
                ) : (
                  <span>{stat}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="total-display">
        <div className="power-label">POWER LEVEL</div>
        <div className="stars">
          {[...Array(5)].map((_, idx) => (
            <svg
              key={idx}
              viewBox="0 0 24 24"
              width="40"
              height="40"
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
      </section>
      <section className="identity-section">
        <IdentityCard
          mbti={profile.mbti}
          enneagram={profile.enneagram}
          quadrants={stats.join(' / ')}
          name={profile.username}
        />
      </section>
    </div>
  );
}
