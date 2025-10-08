import React, { useState, useRef, useEffect } from "react";
import "./ChatInput.css";

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
  const [inputValue, setInputValue] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [inputValue]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue("");
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
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
          placeholder="Ask anything..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isVoiceActive || isLoading}
          rows={1}
        />
        <button
          className="chat-input__send-button"
          onClick={inputValue.trim() ? handleSendMessage : toggleVoiceInput}
          disabled={isLoading}
        >
          <i className={`fas fa-arrow-up ${inputValue.trim() ? 'icon-visible' : 'icon-hidden'}`}></i>
          <i className={`fas fa-microphone ${inputValue.trim() ? 'icon-hidden' : 'icon-visible'}`}></i>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
  