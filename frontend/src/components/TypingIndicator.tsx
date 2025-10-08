import React from 'react';

import './TypingIndicator.css';

const TypingIndicator: React.FC = () => {
  return (
    <div className="message message--assistant typing-indicator">
      <div className="message__avatar message__avatar--assistant">
        <i className="fas fa-robot"></i>
      </div>
      <div className="message__content">
        <span className="typing-indicator__dot"></span>
        <span className="typing-indicator__text">typing...</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
