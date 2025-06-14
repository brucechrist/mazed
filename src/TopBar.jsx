import React from 'react';
import './topbar.css';

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="logo">LoL</div>
      <nav className="nav-links">
        <a href="#">Actualités</a>
        <a href="#">Univers</a>
        <a href="#">Esports</a>
        <a href="#">Plus de jeux</a>
      </nav>
    </header>
  );
}
