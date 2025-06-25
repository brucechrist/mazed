import React, { useState, useEffect } from 'react';
import './identity-card.css';

export default function IdentityCard() {
  const [flipped, setFlipped] = useState(false);
  const [moon, setMoon] = useState({ mbti: '', enneagram: '', quadrants: '', photo: null });
  const [sun, setSun] = useState({ name: '', age: '', place: '', photo: null });

  useEffect(() => {
    const stored = localStorage.getItem('identityCard');
    if (stored) {
      const { moon: m, sun: s } = JSON.parse(stored);
      if (m) setMoon(m);
      if (s) setSun(s);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('identityCard', JSON.stringify({ moon, sun }));
  }, [moon, sun]);

  const handleImage = (side, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (side === 'moon') setMoon({ ...moon, photo: reader.result });
      else setSun({ ...sun, photo: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="identity-card-wrapper" onClick={() => setFlipped(!flipped)}>
      <div className={`identity-card ${flipped ? 'flipped' : ''}`}>
        <div className="identity-face moon-face">
          <div className="face-label">Moon</div>
          {moon.photo && <img className="id-photo" src={moon.photo} alt="moon" />}
          <input
            type="text"
            placeholder="MBTI"
            value={moon.mbti}
            onChange={(e) => setMoon({ ...moon, mbti: e.target.value })}
          />
          <input
            type="text"
            placeholder="Enneagram"
            value={moon.enneagram}
            onChange={(e) => setMoon({ ...moon, enneagram: e.target.value })}
          />
          <input
            type="text"
            placeholder="Quadrants frequencies"
            value={moon.quadrants}
            onChange={(e) => setMoon({ ...moon, quadrants: e.target.value })}
          />
          <input type="file" accept="image/*" onChange={(e) => handleImage('moon', e)} />
        </div>
        <div className="identity-face sun-face">
          <div className="face-label">Sun</div>
          {sun.photo && <img className="id-photo" src={sun.photo} alt="sun" />}
          <input
            type="text"
            placeholder="Name"
            value={sun.name}
            onChange={(e) => setSun({ ...sun, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Age"
            value={sun.age}
            onChange={(e) => setSun({ ...sun, age: e.target.value })}
          />
          <input
            type="text"
            placeholder="City / Place born"
            value={sun.place}
            onChange={(e) => setSun({ ...sun, place: e.target.value })}
          />
          <input type="file" accept="image/*" onChange={(e) => handleImage('sun', e)} />
        </div>
      </div>
    </div>
  );
}
