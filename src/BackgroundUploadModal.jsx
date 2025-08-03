import React, { useEffect, useRef, useState } from 'react';
import './note-modal.css';
import './background-upload-modal.css';

export default function BackgroundUploadModal({ type, current, onApply, onClose }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [recents, setRecents] = useState([]);

  const storageKey = `${type}BgRecents`;
  const bgKey = type === 'main' ? 'mainBg' : 'charBg';

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) setRecents(JSON.parse(stored));
  }, [storageKey]);

  const saveRecent = (url) => {
    const newRecents = [url, ...recents.filter((r) => r !== url)].slice(0, 5);
    localStorage.setItem(storageKey, JSON.stringify(newRecents));
    setRecents(newRecents);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    inputRef.current.value = '';
  };

  const handleApply = () => {
    if (!preview) return;
    saveRecent(preview);
    localStorage.setItem(bgKey, preview);
    onApply(preview);
    onClose();
  };

  const handleSelectRecent = (url) => {
    localStorage.setItem(bgKey, url);
    onApply(url);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal background-upload-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Change {type === 'main' ? 'App' : 'Character'} Background</h2>
        <div className="preview-grid">
          <div>
            <div className="preview-label">Current</div>
            <img src={current} className="preview-image" />
          </div>
          {preview && (
            <div>
              <div className="preview-label">New</div>
              <img src={preview} className="preview-image" />
            </div>
          )}
        </div>
        <div className="background-drop-area" onClick={() => inputRef.current?.click()}>
          Click to upload image
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {preview && (
          <button className="save-button" onClick={handleApply}>
            Apply
          </button>
        )}
        {recents.length > 0 && (
          <>
            <div className="recents-header">Recents</div>
            <div className="recents-grid">
              {recents.map((r, idx) => (
                <img
                  key={idx}
                  src={r}
                  className="recent-bg"
                  onClick={() => handleSelectRecent(r)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
