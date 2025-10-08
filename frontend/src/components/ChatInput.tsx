import React, { useState, useRef, useEffect } from 'react';
import VoiceInputButton from './VoiceInputButton';
import './ChatInput.css';

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
          className="chat-input__field"
          placeholder="Enter a prompt here"
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
          disabled={!inputValue.trim() || isLoading || isVoiceActive}
        >
          <i className="fas fa-arrow-up"></i>
        </button>
        <VoiceInputButton
          isVoiceActive={isVoiceActive}
          toggleVoiceInput={toggleVoiceInput}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatInput;