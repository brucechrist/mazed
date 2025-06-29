import React from 'react';
import AcceptedQuestList from './AcceptedQuestList.jsx';
import CompletedQuestList from './CompletedQuestList.jsx';
import './styles.css';

export default function QuestJournal({ onBack }) {

  return (
    <div className="quest-journal">
      {onBack && (
        <button className="back-button" onClick={onBack}>
          Back
        </button>
      )}
      <AcceptedQuestList />
      <CompletedQuestList />
    </div>
  );
}
