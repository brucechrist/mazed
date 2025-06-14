import { useEffect, useState } from 'react';
import './topbar.css';

export default function TopBar() {
  const [showNews, setShowNews] = useState(false);

  useEffect(() => {
    const fontId = 'riot-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = 'https://lolstatic-a.akamaihd.net/webfonts/live/css/riot/fonts.css';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <header className="riotbar">
      <nav>
        <ul className="riotbar-menu">
          <li
            className={`riotbar-item ${showNews ? 'open' : ''}`}
            onMouseEnter={() => setShowNews(true)}
            onMouseLeave={() => setShowNews(false)}
          >
            <span className="riotbar-link">Actualités</span>
            <ul className="riotbar-dropdown">
              <li><a href="/news">Nouvelles</a></li>
              <li><a href="/patch-notes">Notes de patch</a></li>
              <li><a href="/">Mazed</a></li>
            </ul>
          </li>
          <li className="riotbar-item">
            <a className="riotbar-link" href="/game-info">Univers</a>
          </li>
          <li className="riotbar-item">
            <a className="riotbar-link" href="/champions">Champions</a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
