import React, { useState } from 'react';
import AcceptedQuestList from './AcceptedQuestList.jsx';
import NofapCalendar from './NofapCalendar.jsx';
import VersionRating from './VersionRating.jsx';
import './styles.css';

export default function QuestJournal() {
  const [active, setActive] = useState('quests');

  return (
    <div className="quest-journal">
      <div className="journal-tabs">
        <button
          className={active === 'quests' ? 'active' : ''}
          onClick={() => setActive('quests')}
        >
          Accepted Quests
        </button>
        <button
          className={active === 'nofap' ? 'active' : ''}
          onClick={() => setActive('nofap')}
        >
          NoFap Calendar
        </button>
        <button
          className={active === 'ratings' ? 'active' : ''}
          onClick={() => setActive('ratings')}
        >
          Version Ratings
        </button>
      </div>
      <div className="journal-content">
        {active === 'quests' && <AcceptedQuestList />}
        {active === 'nofap' && (
          <NofapCalendar onBack={() => setActive('quests')} />
        )}
        {active === 'ratings' && (
          <VersionRating onBack={() => setActive('quests')} />
        )}
      </div>
    </div>
  );
}
