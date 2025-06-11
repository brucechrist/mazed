import React, { useState } from 'react';
import NoteModal from './NoteModal.jsx';
import './main-page.css';
import QuadrantMenu from './QuadrantMenu.jsx';

export default function MainPage() {
  const MIN_WIDTH = 253;
  const MAX_WIDTH = 523;

  const [leftWidth, setLeftWidth] = useState(MIN_WIDTH);
  const [rightWidth, setRightWidth] = useState(MIN_WIDTH);
  const [showModal, setShowModal] = useState(false);

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
        <button className="side-button" onClick={() => setShowModal(true)}>
          <svg width="27" height="27" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1L12 17M12 1H4.2002C3.08009 1 2.51962 1 2.0918 1.21799C1.71547 1.40973 1.40973 1.71547 1.21799 2.0918C1 2.51962 1 3.08009 1 4.2002V13.8002C1 14.9203 1 15.4796 1.21799 15.9074C1.40973 16.2837 1.71547 16.5905 2.0918 16.7822C2.51921 17 3.07901 17 4.19694 17L12 17M12 1H13.8002C14.9203 1 15.4796 1 15.9074 1.21799C16.2837 1.40973 16.5905 1.71547 16.7822 2.0918C17 2.5192 17 3.079 17 4.19691L17 13.8031C17 14.921 17 15.48 16.7822 15.9074C16.5905 16.2837 16.2837 16.5905 15.9074 16.7822C15.48 17 14.921 17 13.8031 17H12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <QuadrantMenu />
      </div>
      {showModal && <NoteModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
