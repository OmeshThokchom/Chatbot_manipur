import React, { useState, useEffect } from 'react';
import './TypingIndicator.css';

const TypingIndicator: React.FC = () => {
  const spinnerChars = ['/', '-', '\\', '|'];
  const [spinnerIndex, setSpinnerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpinnerIndex((prevIndex) => (prevIndex + 1) % spinnerChars.length);
    }, 100); // Adjust speed as needed

    return () => clearInterval(interval);
  }, [spinnerChars.length]);

  return (
    <div className="typing-indicator">
      <span className="typing-indicator__spinner">{spinnerChars[spinnerIndex]}</span>
      <span className="typing-indicator__text">Thinking...</span>
    </div>
  );
};

export default TypingIndicator;