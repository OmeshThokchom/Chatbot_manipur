import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header__logo">
        <h1>Cosmic</h1>
      </div>
      <nav className="header__nav">
        {/* Navigation items can go here */}
      </nav>
    </header>
  );
};

export default Header;
