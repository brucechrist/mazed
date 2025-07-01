import React, { useState } from 'react';
import './placeholder-app.css';
import NoteModal from './NoteModal.jsx';
import NotesListModal from './NotesListModal.jsx';

export default function Anima({ onBack }) {
  const [showModal, setShowModal] = useState(false);
  const [showList, setShowList] = useState(false);

  return (
    <div className="placeholder-app">
      <button className="back-button" onClick={onBack}>Back</button>
      <button onClick={() => setShowModal(true)}>New Note</button>
      <button onClick={() => setShowList(true)}>View Notes</button>
      {showModal && <NoteModal onClose={() => setShowModal(false)} />}
      {showList && <NotesListModal onClose={() => setShowList(false)} />}
    </div>
  );
}
