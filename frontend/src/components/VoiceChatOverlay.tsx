
import React from 'react';
import Orb from './orb';
import './VoiceChatOverlay.css';

interface VoiceChatOverlayProps {
  onClose: () => void;
  stream: MediaStream | null;
}

const VoiceChatOverlay: React.FC<VoiceChatOverlayProps> = ({ onClose, stream }) => {

  return (
    <div className="voice-chat-overlay">
      <Orb stream={stream} />
      <div className="voice-chat-controls">
        <button className="control-button close-button" onClick={onClose}>
          &times;
        </button>
      </div>
    </div>
  );
};

export default VoiceChatOverlay;
