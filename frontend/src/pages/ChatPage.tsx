import { useState, useEffect, useRef, useCallback } from 'react';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import Header from '../components/Header'; // Import the new Header component

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  isMeitei?: boolean;
  status?: 'pending' | 'sent' | 'error';
  isError?: boolean;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTranscription, setCurrentTranscription] = useState<string>("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const isStopping = useRef(false);

  const sendMessage = async (messageText: string) => {
    if (messageText.trim() === '') return;

    const messageId = Date.now();
    const newUserMessage: Message = { id: messageId, text: messageText, isUser: true, status: 'pending' };
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

      setMessages(prevMessages => prevMessages.map(msg => msg.id === messageId ? { ...msg, status: 'sent' } : msg));

      const data = await response.json();
      if (data.response) {
        const newAiMessage: Message = { id: Date.now() + 1, text: data.response, isUser: false };
        setMessages((prevMessages) => [...prevMessages, newAiMessage]);
      } else if (data.error) {
        const errorMessage: Message = { id: Date.now() + 1, text: `Error: ${data.error}`, isUser: false, isError: true };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      setMessages(prevMessages => prevMessages.map(msg => msg.id === messageId ? { ...msg, status: 'error' } : msg));
      const errorMessage: Message = { id: Date.now() + 1, text: 'Error: Could not connect to the server.', isUser: false, isError: true };
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
        setMessages((prevMessages) => [...prevMessages, { id: Date.now(), text: `Error: ${data.error}`, isUser: false, isError: true }]);
        return;
      }

      const newIsVoiceActive = data.status === 'started';
      setIsVoiceActive(newIsVoiceActive);

      if (newIsVoiceActive) {
        // Voice input started
        isStopping.current = false;
        setCurrentTranscription(""); // Clear previous transcription

        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        const es = new EventSource('/get-transcription');
        eventSourceRef.current = es;

        es.onmessage = function (e) {
          if (isStopping.current || e.data.startsWith(':')) return;
          const data = JSON.parse(e.data);
          setCurrentTranscription(data.transcript);
        };

        es.onerror = function (e) {
          console.error('SSE error, closing connection', e);
          es.close();
          setIsVoiceActive(false);
          setCurrentTranscription("");
        };
      } else {
        // Voice input stopped
        isStopping.current = true;
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        
        if (currentTranscription.trim()) {
          sendMessage(currentTranscription.trim());
        }
        setCurrentTranscription(""); // Clear after sending
      }
    } catch (error) {
      setMessages((prevMessages) => [...prevMessages, { id: Date.now(), text: 'Error: Could not toggle voice input.', isUser: false, isError: true }]);
      console.error('Voice input error:', error);
      setIsVoiceActive(false);
      setCurrentTranscription("");
    }
  }, [currentTranscription, sendMessage]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="chat-wrapper">
      <Header /> {/* Add the new Header component */}
      <div className="chat-main">
        <ChatWindow messages={messages} isLoading={isLoading} />
        <ChatInput
          sendMessage={sendMessage}
          toggleVoiceInput={toggleVoiceInput}
          isVoiceActive={isVoiceActive}
          isLoading={isLoading}
          currentTranscription={currentTranscription} // Pass current transcription to ChatInput
        />
      </div>
    </div>
  );
};

export default ChatPage;
