import React from 'react';
import './Welcome.css';

const Welcome: React.FC = () => {
  return (
    <div className="welcome-container">
      <div className="welcome-header">
        <h1 className="welcome-title">Hello, Omesh</h1>
        <p className="welcome-subtitle">What should we do today?</p>
      </div>
    </div>
  );
};

export default Welcome;
