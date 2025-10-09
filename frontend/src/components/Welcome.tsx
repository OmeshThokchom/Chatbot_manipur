import React from 'react';
import './Welcome.css';
import useTextScramble from './useTextScramble';

const Welcome: React.FC = () => {
  const phrases = [
    'ꯈꯣꯏꯔꯨꯝꯖꯔꯤ',
    'नमस्ते',
    'Hello',
    'Bonjour',
    'Hola',
    'Olá',
    'こんにちは',
    '안녕하세요',
  ];

  const { ref } = useTextScramble<HTMLHeadingElement>(phrases, 2000);

  return (
    <div className="welcome-container">
      <div className="welcome-header">
        <div className="welcome-greeting">
          <h1 className="welcome-title" ref={ref} style={{ minWidth: '20rem', textAlign: 'center' }} />
          <p className="welcome-title">, Omesh</p>
        </div>
        <p className="welcome-subtitle">ꯑꯗꯣꯝꯒꯤ ꯃꯇꯦꯡ ꯀꯔꯤ ꯇꯧꯖꯧ ꯍꯥꯏꯕꯅꯧ?</p>
      </div>
    </div>
  );
};

export default Welcome;
