
import React, { useEffect, useRef } from 'react';
import Orb from './orb';
import './VoiceChatOverlay.css';

interface VoiceChatOverlayProps {
  onClose: () => void;
  analyser: AnalyserNode | null;
  isMuted: boolean;
  onToggleMute: () => void;
}


const VoiceChatOverlay: React.FC<VoiceChatOverlayProps> = ({ onClose, analyser, isMuted, onToggleMute }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioNode | null>(null);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="voice-chat-overlay">
      <Orb analyser={analyser} />
      


      {/* Controls */}
      <div className="voice-chat-controls">
        <button className="control-button mute-button" onClick={onToggleMute}>
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
