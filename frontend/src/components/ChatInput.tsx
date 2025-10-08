import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  sendMessage: (message: string) => void;
  toggleVoiceInput: () => void;
  isVoiceActive: boolean;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  sendMessage,
  toggleVoiceInput,
  isVoiceActive,
  isLoading,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const handleSendMessage = () => {
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-main__input-area">
      <div className="chat-input">
        <textarea
          ref={textareaRef}
          id="user-input"
          className={`chat-input__field ${isVoiceActive ? 'chat__input-field--voice-active' : ''}`}
          placeholder={isVoiceActive ? 'Voice input active...' : 'Message ChatGPT...'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isVoiceActive || isLoading}
          rows={1}
        ></textarea>
        <button
          id="send-button"
          className="chat-input__send-button"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
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
      </div>
      <p className="chat-main__disclaimer">ChatGPT can make mistakes. Consider checking important information.</p>
    </div>
  );
};

export default ChatInput;
