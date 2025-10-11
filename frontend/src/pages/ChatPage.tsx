import { useState, useRef, useCallback, useEffect } from 'react';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import AudioVisualizer from '../components/AudioVisualizer'; // Import the new AudioVisualizer component
import './ChatPage.css'; // Import ChatPage specific styles

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
  const [microphonePermission, setMicrophonePermission] = useState<PermissionState | 'unknown'>('unknown');
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const isVoiceActiveRef = useRef(isVoiceActive);

  useEffect(() => {
    isVoiceActiveRef.current = isVoiceActive;
  }, [isVoiceActive]);

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

  const requestMicrophonePermission = async () => {
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicrophonePermission(permissionStatus.state);
        console.log('Microphone permission status:', permissionStatus.state);

        permissionStatus.onchange = () => {
          setMicrophonePermission(permissionStatus.state);
          console.log('Microphone permission status changed:', permissionStatus.state);
        };

        if (permissionStatus.state === 'denied') {
          setMessages((prevMessages) => [...prevMessages, { id: Date.now(), text: 'Microphone access is denied. Please enable it in your browser settings.', isUser: false, isError: true }]);
          return false;
        }
      } catch (error) {
        console.error('Error querying microphone permission:', error);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMessages((prevMessages) => [...prevMessages, { id: Date.now(), text: 'Could not access microphone. Please ensure you have a working microphone and have granted permission.', isUser: false, isError: true }]);
      return false;
    }
  };

  const toggleVoiceInput = useCallback(async () => {
    if (isVoiceActiveRef.current) {
      // Stopping voice input
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setIsVoiceActive(false);
    } else {
      // Starting voice input
      const permissionGranted = await requestMicrophonePermission();
      if (permissionGranted && mediaStreamRef.current) {
        setIsVoiceActive(true);
        audioChunks.current = [];
        mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, { mimeType: 'audio/webm' });

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
        };

        mediaRecorderRef.current.onerror = (event) => {
          console.error('MediaRecorder error:', event);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
          try {
            const formData = new FormData();
            formData.append('audio', audioBlob);

            const response = await fetch('/transcribe', {
              method: 'POST',
              body: audioBlob,
              headers: {
                'Content-Type': 'audio/wav',
              },
            });

            const data = await response.json();
            console.log('Transcription response data:', data);
            if (data.transcript) {
              console.log('Setting input value to:', data.transcript);
              setInputValue(data.transcript);
            }
          } catch (error) {
            console.error('Error transcribing audio:', error);
            setMessages((prevMessages) => [...prevMessages, { id: Date.now(), text: 'Error: Could not transcribe audio.', isUser: false, isError: true }]);
          }
        };

        mediaRecorderRef.current.start();
      }
    }
  }, []);

  return (
    <div className="chat-wrapper">
      <div className="chat-main">
        <div className="chat-content-wrapper">
          <ChatWindow messages={messages} isLoading={isLoading} />
          {isVoiceActive && <AudioVisualizer isVoiceActive={isVoiceActive} stream={mediaStreamRef.current} />}
          {microphonePermission === 'denied' && (
            <div className="chat-main__permission-denied">
              <p>Microphone access is denied. Please enable it in your browser settings to use voice input.</p>
            </div>
          )}
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
    </div>
  );
};

export default ChatPage;
