import React from 'react';
import { FiSettings, FiUser, FiBell } from 'react-icons/fi'; // Import new icons
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header__left-actions"> {/* New div for left actions */}
        <FiBell className="header__icon" />
      </div>
      <div className="header__center-content"> {/* New div for center content */}
        <div className="header__logo">
          <h1>Cosmic</h1>
        </div>
        <nav className="header__nav">
          {/* Navigation items can go here */}
        </nav>
      </div>
      <div className="header__right-actions"> {/* Renamed from header__actions */}
        <FiSettings className="header__icon" />
        <FiUser className="header__icon" />
      </div>
    </header>
  );
};

export default Header;
