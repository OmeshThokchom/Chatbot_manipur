import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="app-header__logo">N7Chat</div>
      <nav className="app-header__nav">
        <a href="#" className="app-header__nav-link">Home</a>
        <a href="#" className="app-header__nav-link">About</a>
        <a href="#" className="app-header__nav-link">Contact</a>
      </nav>
      <div className="app-header__user">
        <div className="app-header__user-avatar">O</div>
      </div>
    </header>
  );
};

export default Header;
