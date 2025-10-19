
import React, { useState, useEffect, useRef } from 'react';
import ParticleSphere from './ParticleSphere';
import './VoiceChatOverlay.css';

interface VoiceChatOverlayProps {
  onClose: () => void;
}

const VoiceChatOverlay: React.FC<VoiceChatOverlayProps> = ({ onClose }) => {
  const [transcript, setTranscript] = useState('');

  return (
    <div className="voice-chat-overlay">
      <ParticleSphere />
      <div className="voice-chat-controls">
        <div className="transcript-display">
          <p>{transcript}</p>
        </div>
        <button className="control-button close-button" onClick={onClose}>
          &times;
        </button>
      </div>
    </div>
  );
};

export default VoiceChatOverlay;
