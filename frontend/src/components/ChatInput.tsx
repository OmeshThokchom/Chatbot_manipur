import React, { useRef, useEffect } from "react";
import "./ChatInput.css";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  sendMessage: () => void;
  toggleVoiceInput: () => void;
  isVoiceActive: boolean;
  isLoading: boolean;
  onVoiceChatClick: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  sendMessage,
  toggleVoiceInput,
  isVoiceActive,
  isLoading,
  onVoiceChatClick,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [value]);

  const handleSendMessage = () => {
    if (!value.trim()) return;
    sendMessage();
  };

  const handleButtonClick = () => {
    if (isVoiceActive) {
      toggleVoiceInput();
    } else {
      if (value.trim()) {
        handleSendMessage();
      } else {
        toggleVoiceInput();
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-main__input-area">
      <div className="chat-input">
        <textarea
          ref={textareaRef}
          className="chat-input__field"
          placeholder={isVoiceActive ? "Listening..." : "Ask anything..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isVoiceActive}
          rows={1}
        />
        <button
          className="chat-input__voice-chat-button"
          onClick={onVoiceChatClick}
          disabled={isLoading}
        >
          <img src="/voice_realtime.png" alt="Voice chat" className="chat-input__voice-chat-icon" />
        </button>
        <button
          className={`chat-input__send-button ${isVoiceActive ? 'voice-active' : ''}`}
          onClick={handleButtonClick}
          disabled={isLoading}
        >
          <i className={`fas fa-arrow-up ${value.trim() && !isVoiceActive ? 'icon-visible' : 'icon-hidden'}`}></i>
          <i className={`fas fa-microphone ${!value.trim() && !isVoiceActive ? 'icon-visible' : 'icon-hidden'}`}></i>
          <i className={`fas fa-stop ${isVoiceActive ? 'icon-visible' : 'icon-hidden'}`}></i>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;