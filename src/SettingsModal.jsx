import React, { useState } from 'react';
import './note-modal.css';
import BackgroundUploadModal from './BackgroundUploadModal.jsx';

export default function SettingsModal({
  onClose,
  autoLog,
  onToggleAutoLog,
  onOpenAkashicRecords,
  theme,
  onToggleTheme,
  mainBg,
  onChangeMainBg,
  charBg,
  onChangeCharBg,
  menuBg,
  onChangeMenuBg,
}) {
  const resolutions = ['800x600', '1024x768', '1280x720', '1600x900', '1920x1080'];
  const [resolution, setResolution] = useState(() => {
    const w = localStorage.getItem('windowWidth') || '1600';
    const h = localStorage.getItem('windowHeight') || '900';
    return `${w}x${h}`;
  });

  const changeRes = (e) => {
    setResolution(e.target.value);
  };

  const applyResolution = () => {
    const [w, h] = resolution.split('x').map(Number);
    localStorage.setItem('windowWidth', w);
    localStorage.setItem('windowHeight', h);
    if (window.electronAPI && window.electronAPI.setWindowSize) {
      window.electronAPI.setWindowSize(w, h);
    }
  };

  const openAdminConsole = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<!DOCTYPE html><html><head><title>Admin Console</title></head><body style="background:white;color:black;font-family:sans-serif;padding:20px;"><h1>Admin Console</h1><button id="reopen">Reopen Day Planner</button><script>document.getElementById('reopen').onclick=function(){try{window.opener?.localStorage.removeItem('plannerDate');window.opener?.postMessage({type:'OPEN_DAY_PLANNER'},'*');}catch(e){console.error(e);}};</script></body></html>`
    );
    w.document.close();
  };

  const [bgType, setBgType] = useState(null); // 'main', 'character', or 'menu'
  const [showBgChoice, setShowBgChoice] = useState(false);

  const openBgModal = (type) => {
    setBgType(type);
    setShowBgChoice(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={autoLog}
            onChange={e => onToggleAutoLog(e.target.checked)}
          />
          Auto log calendar
        </label>
        <label className="note-label">
          Resolution
          <select value={resolution} onChange={changeRes}>
            {resolutions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button className="save-button" onClick={applyResolution}>Validate</button>
        </label>
        <button className="save-button" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button className="save-button" onClick={openAdminConsole}>
          Admin Console
        </button>
        <button
          className="save-button"
          onClick={() => setShowBgChoice((s) => !s)}
        >
          Change Background
        </button>
        {showBgChoice && (
          <div className="bg-selection">
            <div className="bg-option" onClick={() => openBgModal('character')}>
              <img src={charBg} className="bg-option-preview" />
              Character
            </div>
            <div className="bg-option" onClick={() => openBgModal('main')}>
              <img src={mainBg} className="bg-option-preview" />
              App
            </div>
            <div className="bg-option" onClick={() => openBgModal('menu')}>
              <img src={menuBg} className="bg-option-preview" />
              Main Menu
            </div>

          </div>
        )}
        <button
          className="akashic-button"
          onClick={() => {
            onClose();
            if (onOpenAkashicRecords) onOpenAkashicRecords();
          }}
          title="Akashic Records"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {bgType && (
        <BackgroundUploadModal
          type={bgType}
          current={
            bgType === 'main'
              ? mainBg
              : bgType === 'character'
              ? charBg
              : menuBg
          }
          onApply={(url) => {
            if (bgType === 'main') onChangeMainBg(url);
            else if (bgType === 'character') onChangeCharBg(url);
            else onChangeMenuBg(url);
          }}
          onClose={() => setBgType(null)}
        />
      )}
    </div>
  );
}
