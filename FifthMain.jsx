import React, { useState } from 'react';
import NoteModal from './NoteModal.jsx';
import NotesListModal from './NotesListModal.jsx';
import './main-page.css';
import QuadrantMenu from './QuadrantMenu.jsx';

export default function FifthMain({ onSelectQuadrant }) {
  const MIN_WIDTH = 253;
  const MAX_WIDTH = 523;

  const [leftWidth, setLeftWidth] = useState(MIN_WIDTH);
  const [rightWidth, setRightWidth] = useState(MIN_WIDTH);
  const [showModal, setShowModal] = useState(false);
  const [showList, setShowList] = useState(false);

  const startLeftDrag = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMouseMove = (ev) => {
      let newWidth = startWidth + (ev.clientX - startX);
      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
      setLeftWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const startRightDrag = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;

    const onMouseMove = (ev) => {
      let newWidth = startWidth - (ev.clientX - startX);
      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
      setRightWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="main-page">
      <div className="side left" style={{ width: leftWidth }}>
        <div className="drag-handle" onMouseDown={startLeftDrag}></div>
      </div>
      <div className="content-area" />
      <div className="side right" style={{ width: rightWidth }}>
        <div className="drag-handle" onMouseDown={startRightDrag}></div>
      </div>
      <div className="bottom-menu">
        <button className="side-button" onClick={() => setShowList(true)}>
          <svg width="27" height="27" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1L12 17M12 1H4.2002C3.08009 1 2.51962 1 2.0918 1.21799C1.71547 1.40973 1.40973 1.71547 1.21799 2.0918C1 2.51962 1 3.08009 1 4.2002V13.8002C1 14.9203 1 15.4796 1.21799 15.9074C1.40973 16.2837 1.71547 16.5905 2.0918 16.7822C2.51921 17 3.07901 17 4.19694 17L12 17M12 1H13.8002C14.9203 1 15.4796 1 15.9074 1.21799C16.2837 1.40973 16.5905 1.71547 16.7822 2.0918C17 2.5192 17 3.079 17 4.19691L17 13.8031C17 14.921 17 15.48 16.7822 15.9074C16.5905 16.2837 16.2837 16.5905 15.9074 16.7822C15.48 17 14.921 17 13.8031 17H12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="side-button" onClick={() => setShowModal(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.5 19H17.5C17.9647 19 18.197 18.9999 18.3902 18.9614C19.1836 18.8036 19.8036 18.1836 19.9614 17.3902C19.9999 17.197 19.9999 16.9647 19.9999 16.5C19.9999 16.0353 19.9999 15.8031 19.9614 15.6099C19.8036 14.8165 19.1836 14.1962 18.3902 14.0384C18.197 14 17.9647 14 17.5 14H6.5C6.03534 14 5.80306 14 5.60986 14.0384C4.81648 14.1962 4.19624 14.8165 4.03843 15.6099C4 15.8031 4 16.0354 4 16.5C4 16.9647 4 17.1969 4.03843 17.3901C4.19624 18.1835 4.81648 18.8036 5.60986 18.9614C5.80306 18.9999 6.03535 19 6.5 19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5 10H17.5C17.9647 10 18.197 9.99986 18.3902 9.96143C19.1836 9.80361 19.8036 9.18356 19.9614 8.39018C19.9999 8.19698 19.9999 7.96465 19.9999 7.5C19.9999 7.03535 19.9999 6.80306 19.9614 6.60986C19.8036 5.81648 19.1836 5.19624 18.3902 5.03843C18.197 5 17.9647 5 17.5 5H6.5C6.03534 5 5.80306 5 5.60986 5.03843C4.81648 5.19624 4.19624 5.81648 4.03843 6.60986C4 6.80306 4 7.03539 4 7.50004C4 7.9647 4 8.19694 4.03843 8.39014C4.19624 9.18352 4.81648 9.80361 5.60986 9.96143C5.80306 9.99986 6.03535 10 6.5 10Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <QuadrantMenu onSelect={onSelectQuadrant} />
      </div>
      {showModal && <NoteModal onClose={() => setShowModal(false)} />}
      {showList && <NotesListModal onClose={() => setShowList(false)} />}
    </div>
  );
}
