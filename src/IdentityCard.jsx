import React, { useState, useEffect } from 'react';
import './identity-card.css';

export default function IdentityCard({ mbti, enneagram, quadrants, name, age, place }) {
  const [flipped, setFlipped] = useState(false);
  const [moonPhoto, setMoonPhoto] = useState(null);
  const [sunPhoto, setSunPhoto] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('identityCard');
    if (stored) {
      const { moonPhoto: mp, sunPhoto: sp } = JSON.parse(stored);
      if (mp) setMoonPhoto(mp);
      if (sp) setSunPhoto(sp);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('identityCard', JSON.stringify({ moonPhoto, sunPhoto }));
  }, [moonPhoto, sunPhoto]);

  const handleImage = (side, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (side === 'moon') setMoonPhoto(reader.result);
      else setSunPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="identity-card-wrapper" onClick={() => setFlipped(!flipped)}>
      <div className={`identity-card ${flipped ? 'flipped' : ''}`}>
        <div className="identity-face moon-face">
          <div className="face-label">Moon</div>
          {moonPhoto && <img className="id-photo" src={moonPhoto} alt="moon" />}
          <div className="info-line"><span className="label">MBTI:</span> {mbti || '???'}</div>
          <div className="info-line"><span className="label">Enneagram:</span> {enneagram || '???'}</div>
          <div className="info-line"><span className="label">Quadrants:</span> {quadrants}</div>
          <input type="file" accept="image/*" onChange={(e) => handleImage('moon', e)} />
        </div>
        <div className="identity-face sun-face">
          <div className="face-label">Sun</div>
          {sunPhoto && <img className="id-photo" src={sunPhoto} alt="sun" />}
          <div className="info-line"><span className="label">Name:</span> {name || '???'}</div>
          <div className="info-line"><span className="label">Age:</span> {age || '???'}</div>
          <div className="info-line"><span className="label">Place:</span> {place || '???'}</div>
          <input type="file" accept="image/*" onChange={(e) => handleImage('sun', e)} />
        </div>
      </div>
    </div>
  );
}
