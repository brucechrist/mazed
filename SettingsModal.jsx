import React, { useState } from 'react';
import './note-modal.css';

export default function SettingsModal({ onClose, autoLog, onToggleAutoLog }) {
  const resolutions = ['800x600', '1024x768', '1280x720', '1600x900', '1920x1080'];
  const [resolution, setResolution] = useState(() => {
    const w = localStorage.getItem('windowWidth') || '1600';
    const h = localStorage.getItem('windowHeight') || '900';
    return `${w}x${h}`;
  });

  const changeRes = (e) => {
    const val = e.target.value;
    setResolution(val);
    const [w, h] = val.split('x').map(Number);
    localStorage.setItem('windowWidth', w);
    localStorage.setItem('windowHeight', h);
    if (window.electronAPI && window.electronAPI.setWindowSize) {
      window.electronAPI.setWindowSize(w, h);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={autoLog}
            onChange={(e) => onToggleAutoLog(e.target.checked)}
          />
          Auto log calendar
        </label>
        <label className="note-label">
          Resolution
          <select value={resolution} onChange={changeRes}>
            {resolutions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
