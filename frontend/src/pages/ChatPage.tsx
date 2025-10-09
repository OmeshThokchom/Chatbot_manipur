import { useState, useEffect, useRef, useCallback } from 'react';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import Header from '../components/Header';
import AudioVisualizer from '../components/AudioVisualizer'; // Import the new AudioVisualizer component

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
  const [inputValue, setInputValue] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const isStopping = useRef(false);

  const sendMessage = useCallback(async (messageText: string) => {
    if (messageText.trim() === '') return;

    const messageId = Date.now();
    const newUserMessage: Message = { id: messageId, text: messageText, isUser: true, status: 'pending' };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue(""); // Clear input after sending
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
  }, []);

  const toggleVoiceInput = useCallback(async () => {
    try {
      if (isVoiceActive) {
        // Stopping voice input
        isStopping.current = true;
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        await fetch('/voice-input', { method: 'POST' });
        setIsVoiceActive(false);
        if (inputValue.trim()) {
          sendMessage(inputValue.trim());
        }
        setInputValue("");
      } else {
        // Starting voice input
        isStopping.current = false;
        await fetch('/voice-input', { method: 'POST' });
        setIsVoiceActive(true);
        setInputValue("");

        const es = new EventSource('/get-transcription');
        eventSourceRef.current = es;

        es.onmessage = function (e) {
          if (isStopping.current || e.data.startsWith(':')) return;
          const data = JSON.parse(e.data);
          setInputValue(data.transcript); // Directly set the transcript
        };

        es.onerror = function (e) {
          if (isStopping.current) return;
          console.error('SSE error, closing connection', e);
          es.close();
          setIsVoiceActive(false);
          setInputValue("");
        };
      }
    } catch (error) {
      setMessages((prevMessages) => [...prevMessages, { id: Date.now(), text: 'Error: Could not toggle voice input.', isUser: false, isError: true }]);
      console.error('Voice input error:', error);
      setIsVoiceActive(false);
      setInputValue("");
    }
  }, [isVoiceActive, inputValue, sendMessage]);

  return (
    <div className="chat-wrapper">
      <Header />
      <div className="chat-main">
        <ChatWindow messages={messages} isLoading={isLoading} />
        {isVoiceActive && <AudioVisualizer isVoiceActive={isVoiceActive} simulateAudio={true} />}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          sendMessage={() => sendMessage(inputValue)}
          toggleVoiceInput={toggleVoiceInput}
          isVoiceActive={isVoiceActive}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatPage;
