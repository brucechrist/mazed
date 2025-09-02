import React, { useRef, useState } from 'react';
import './dock-layout.css';

export default function DockLayout({ onExit }) {
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const [dividerPos, setDividerPos] = useState(50); // percentage of left pane width

  const startDrag = (e) => {
    isDragging.current = true;
    e.preventDefault();
  };

  const onDrag = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(80, Math.max(20, pos));
    setDividerPos(clamped);
  };

  const stopDrag = () => {
    isDragging.current = false;
  };

  return (
    <div
      className="dock-layout"
      ref={containerRef}
      onMouseMove={onDrag}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      <div className="pane left" style={{ width: `${dividerPos}%` }}>
        Left content
      </div>
      <div className="divider" onMouseDown={startDrag} />
      <div className="pane right" style={{ width: `${100 - dividerPos}%` }}>
        Right content
      </div>
      {onExit && (
        <button className="exit-button" onClick={onExit}>
          Back
        </button>
      )}
    </div>
  );
}

