
import React from 'react';
import Orb from './orb';
import './VoiceChatOverlay.css';

interface VoiceChatOverlayProps {
  onClose: () => void;
  analyser: AnalyserNode | null;
  isMuted: boolean;
  onToggleMute: () => void;
}

const VoiceChatOverlay: React.FC<VoiceChatOverlayProps> = ({ onClose, analyser, isMuted, onToggleMute }) => {

  return (
    <div className="voice-chat-overlay">
      <Orb analyser={analyser} />
      <div className="voice-chat-controls">
        <button className="control-button mic-button" onClick={onToggleMute}>
          <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
        </button>
        <button className="control-button close-button" onClick={onClose}>
          &times;
        </button>
      </div>
    </div>
  );
};

export default VoiceChatOverlay;
