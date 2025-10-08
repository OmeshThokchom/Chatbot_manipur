import React, { useEffect, useRef } from 'react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import Welcome from './Welcome';

import './ChatWindow.css';

interface MessageProps {
  id: number;
  text: string;
  isUser: boolean;
  isMeitei?: boolean;
}

interface ChatWindowProps {
  messages: MessageProps[];
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="chat-main__messages">
      {messages.length === 0 && !isLoading ? (
        <Welcome />
      ) : (
        <>
          {messages.map((message) => (
            <Message key={message.id} text={message.text} isUser={message.isUser} isMeitei={message.isMeitei} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default ChatWindow;
