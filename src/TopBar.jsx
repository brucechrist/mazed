import React from 'react';
import './topbar.css';

export default function TopBar() {
  return (
    <header className="riot-local-bar">
      <nav className="riot-nav">
        <a
          href="https://www.leagueoflegends.com/fr-fr/"
          className="logo"
        >
          League of Legends
        </a>
        <ul className="menu">
          <li className="menu-item dropdown">
            <span>Actualités</span>
            <ul className="dropdown-menu">
              <li>
                <a href="https://www.leagueoflegends.com/fr-fr/news/">Tout</a>
              </li>
              <li>
                <a href="https://www.leagueoflegends.com/fr-fr/news/game-updates/">
                  Mises à jour du jeu
                </a>
              </li>
              <li>
                <a href="https://www.leagueoflegends.com/fr-fr/news/patch-notes/">
                  Notes de patch
                </a>
              </li>
              <li>
                <a href="https://www.leagueoflegends.com/fr-fr/news/esports/">E-sport</a>
              </li>
              <li>
                <a href="/">Mazed</a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </header>
  );
}
