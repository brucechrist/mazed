import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './note-modal.css';

export default function MainQuestModal({ onClose, onSaved, initialMbti = '', initialEnneagram = '', initialInstinct = '' }) {
  const [mbti, setMbti] = useState(initialMbti);
  const [enneagram, setEnneagram] = useState(initialEnneagram);
  const [instinct, setInstinct] = useState(initialInstinct);

  const mbtiTypes = [
    'INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
    'ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'
  ];

  const enneagramTypes = [
    '1w9','1w2','2w1','2w3','3w2','3w4','4w3','4w5','5w4','5w6',
    '6w5','6w7','7w6','7w8','8w7','8w9','9w8','9w1'
  ];

  const instincts = ['sx', 'sp', 'so'];

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ mbti, enneagram, instinct })
      .eq('id', user.id);
    if (onSaved) onSaved({ mbti, enneagram, instinct });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <p>
          As the tests arent ready for enneagram and MBTI, please do the following tests
          <br />
          <a href="https://www.16personalities.com/fr/test-de-personnalite" target="_blank" rel="noopener noreferrer">16personalities.com</a>
          <br />
          <a href="https://www.eclecticenergies.com/enneagram/test-2" target="_blank" rel="noopener noreferrer">eclecticenergies.com</a>
        </p>
        <label>
          MBTI
          <select className="note-tag" value={mbti} onChange={(e) => setMbti(e.target.value)}>
            <option value="">Select</option>
            {mbtiTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Enneagram
          <select className="note-tag" value={enneagram} onChange={(e) => setEnneagram(e.target.value)}>
            <option value="">Select</option>
            {enneagramTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Instinct
          <select className="note-tag" value={instinct} onChange={(e) => setInstinct(e.target.value)}>
            <option value="">Select</option>
            {instincts.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <div className="actions">
          <button className="save-button" onClick={onClose}>Cancel</button>
          <button className="save-button" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
