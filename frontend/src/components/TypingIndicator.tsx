import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="message typing-indicator">
      <div className="message__avatar message__avatar--assistant">
        <i className="fas fa-robot"></i>
      </div>
      <div className="message__content">
        <span className="typing-indicator__dot"></span>
        <span className="typing-indicator__dot"></span>
        <span className="typing-indicator__dot"></span>
      </div>
    </div>
  );
};

export default TypingIndicator;
