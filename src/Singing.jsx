import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './music-search.css';

export default function Singing({ onBack }) {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('sing_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      if (!error && data) setRecords(data);
    };
    load();
  }, []);

  return (
    <div className="music-search">
      <button className="back-button" onClick={onBack}>Back</button>
      <h3>Singing History</h3>
      <div className="results">
        {records.map((r) => (
          <div key={r.id} className="music-card">
            <div className="music-info">
              <div className="music-title">{r.title}</div>
              <div className="music-artist">{new Date(r.timestamp).toLocaleString()}</div>
            </div>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="action-button">Open</a>
          </div>
        ))}
      </div>
    </div>
  );
}
