import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  isMeitei?: boolean;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const sendMessage = async (messageText: string) => {
    if (messageText.trim() === '') return;

    const newUserMessage: Message = { id: Date.now(), text: messageText, isUser: true };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();
      if (data.response) {
        const newAiMessage: Message = { id: Date.now() + 1, text: data.response, isUser: false };
        setMessages((prevMessages) => [...prevMessages, newAiMessage]);
      } else if (data.error) {
        const errorMessage: Message = { id: Date.now() + 1, text: `Error: ${data.error}`, isUser: false };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = { id: Date.now() + 1, text: 'Error: Could not connect to the server.', isUser: false };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = useCallback(async () => {
    try {
      const response = await fetch('/voice-input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prevMessages) => [...prevMessages, { id: Date.now(), text: `Error: ${data.error}`, isUser: false }]);
        return;
      }

      const newIsVoiceActive = data.status === 'started';
      setIsVoiceActive(newIsVoiceActive);

      if (newIsVoiceActive) {
        setMessages((prevMessages) => [...prevMessages, { id: Date.now(), text: 'Voice input activated. Speak to interact.', isUser: false }]);

        // Close any existing EventSource before opening a new one
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        eventSourceRef.current = new EventSource('/get-transcription');

        eventSourceRef.current.onmessage = function (e) {
          const transcriptionData = JSON.parse(e.data);
          setMessages((prevMessages) => [
            ...prevMessages,
            { id: Date.now(), text: transcriptionData.transcript, isUser: true, isMeitei: transcriptionData.is_meitei },
            { id: Date.now() + 1, text: transcriptionData.response, isUser: false },
          ]);
        };

        eventSourceRef.current.onerror = function () {
          console.log('SSE error, closing connection');
          eventSourceRef.current?.close();
          eventSourceRef.current = null;
        };
      } else {
        setMessages((prevMessages) => [...prevMessages, { id: Date.now(), text: 'Voice input deactivated.', isUser: false }]);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      }
    } catch (error) {
      setMessages((prevMessages) => [...prevMessages, { id: Date.now(), text: 'Error: Could not toggle voice input.', isUser: false }]);
      console.error('Voice input error:', error);
    }
  }, []); // Empty dependency array for useCallback as it uses functional updates for state

  // Cleanup EventSource on component unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="chat-wrapper">
      <div className="chat-sidebar">
        <button className="chat-sidebar__new-chat-button">
          <i className="fas fa-plus"></i> New Chat
        </button>
        <div className="chat-sidebar__history">
          {/* Chat history items will go here */}
        </div>
        <div className="chat-sidebar__footer">
          <button className="chat-sidebar__footer-button">
            <i className="fas fa-user-circle"></i> User Name
          </button>
          <button className="chat-sidebar__footer-button">
            <i className="fas fa-cog"></i> Settings
          </button>
        </div>
      </div>
      <div className="chat-main">
        <header className="chat-main__header">
          <h1 className="chat-main__title">N7chat</h1>
        </header>
        <ChatWindow messages={messages} isLoading={isLoading} />
        <ChatInput
          sendMessage={sendMessage}
          toggleVoiceInput={toggleVoiceInput}
          isVoiceActive={isVoiceActive}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default App;
