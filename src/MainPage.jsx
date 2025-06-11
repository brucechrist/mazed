import React, { useState } from 'react';
import './main-page.css';
import QuadrantMenu from './QuadrantMenu.jsx';

export default function MainPage() {
  const MIN_WIDTH = 253;
  const MAX_WIDTH = 523;

  const [leftWidth, setLeftWidth] = useState(MIN_WIDTH);
  const [rightWidth, setRightWidth] = useState(MIN_WIDTH);

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
        <QuadrantMenu />
      </div>
    </div>
  );
}
