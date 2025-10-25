
import React from 'react';
import Orb from './orb';
import './VoiceChatOverlay.css';

interface VoiceChatOverlayProps {
  onClose: () => void;
  analyser: AnalyserNode | null;
}

const VoiceChatOverlay: React.FC<VoiceChatOverlayProps> = ({ onClose, analyser }) => {

  return (
    <div className="voice-chat-overlay">
      <Orb analyser={analyser} />
      <div className="voice-chat-controls">
        <button className="control-button close-button" onClick={onClose}>
          &times;
        </button>
      </div>
    </div>
  );
};

export default VoiceChatOverlay;
