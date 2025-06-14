import './topbar.css';

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-logo">League of Legends</div>
      <nav>
        <ul className="topbar-menu">
          <li><a href="#">Jeu</a></li>
          <li><a href="#">Univers</a></li>
          <li className="dropdown">
            <a href="#">Actualités</a>
            <ul className="dropdown-menu">
              <li><a href="#">Notes de patch</a></li>
              <li><a href="/">Mazed</a></li>
            </ul>
          </li>
          <li><a href="#">Support</a></li>
        </ul>
      </nav>
    </header>
  );
}
