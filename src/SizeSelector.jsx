import React, { useState, useEffect } from 'react';

const options = [
  { label: '1024x575', width: 1024, height: 575 },
  { label: '1280x720', width: 1280, height: 720 },
  { label: '1600x900', width: 1600, height: 900 },
  { label: '1920x1080', width: 1920, height: 1080 },
];

export default function SizeSelector() {
  const [selected, setSelected] = useState(options[0].label);

  useEffect(() => {
    if (window.api && window.api.getSavedWindowSize) {
      window.api.getSavedWindowSize().then((size) => {
        if (size) {
          const match = options.find(
            (o) => o.width === size.width && o.height === size.height
          );
          if (match) {
            setSelected(match.label);
          }
        }
      });
    }
  }, []);

  function applySize() {
    const opt = options.find((o) => o.label === selected);
    if (opt && window.api && window.api.setWindowSize) {
      window.api.setWindowSize(opt.width, opt.height);
    }
  }

  return (
    <div className="size-selector">
      <select value={selected} onChange={(e) => setSelected(e.target.value)}>
        {options.map((o) => (
          <option key={o.label} value={o.label}>
            {o.label}
          </option>
        ))}
      </select>
      <button onClick={applySize}>Apply Size</button>
    </div>
  );
}
