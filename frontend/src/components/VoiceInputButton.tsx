import React from 'react';

interface VoiceInputButtonProps {
  isVoiceActive: boolean;
  toggleVoiceInput: () => void;
  isLoading: boolean;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  isVoiceActive,
  toggleVoiceInput,
  isLoading,
}) => {
  return (
    <div className={`voice-button-container ${isVoiceActive ? 'wave-container--active' : ''}`}>
      <div className={`voice-button-container__waves ${isVoiceActive ? 'voice-button-container__waves--active' : ''}`}></div>
      <button
        id="voice-button"
        className="chat-input__voice-button"
        onClick={toggleVoiceInput}
        title={isVoiceActive ? 'Stop voice input' : 'Start voice input'}
        disabled={isLoading}
      >
        <i className="fas fa-microphone"></i>
      </button>
    </div>
  );
};

export default VoiceInputButton;
