import React from 'react';
import { FiSettings, FiUser, FiBell } from 'react-icons/fi';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header__left-actions">
        <FiBell className="header__icon" />
      </div>

      <div className="header__center-content">
        <div className="header__logo">
          <h1>Cosmic</h1>
        </div>
        <nav className="header__nav">
          {/* Add nav items if needed */}
        </nav>
      </div>

      <div className="header__right-actions">
        <FiSettings className="header__icon" />
        <FiUser className="header__icon" />
      </div>
    </header>
  );
};

export default Header;
