import React from 'react';
import './TypingIndicator.css';

const TypingIndicator: React.FC = () => {
  return (
    <div className="typing-indicator">
      <div className="star-container">
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
      </div>
      <span className="typing-indicator__text">Thinking...</span>
    </div>
  );
};

export default TypingIndicator;