import React, { useState, useCallback } from 'react';
import ChatPage from '../pages/ChatPage';

const MainContentRouter: React.FC = () => {
  const [hasMessages, setHasMessages] = useState(false); // State to track if ChatPage has messages

  const handleMessagesChange = useCallback((messagesExist: boolean) => {
    setHasMessages(messagesExist);
  }, []);

  return (
    <ChatPage onMessagesChange={handleMessagesChange} hasMessages={hasMessages} /> /* Always render ChatPage, pass state and callback */
  );
};

export default MainContentRouter;