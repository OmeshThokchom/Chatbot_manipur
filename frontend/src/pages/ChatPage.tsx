import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import AudioVisualizer from '../components/AudioVisualizer';
import VoiceChatOverlay from '../components/VoiceChatOverlay';
import Welcome from '../components/Welcome';
import './ChatPage.css';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  isMeitei?: boolean;
  status?: 'pending' | 'sent' | 'error';
  isError?: boolean;
}

interface ChatPageProps {
  onMessagesChange: (hasMessages: boolean) => void;
  hasMessages: boolean;
}

const ChatPage: React.FC<ChatPageProps> = ({ onMessagesChange, hasMessages }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState("");
  const [microphonePermission, setMicrophonePermission] = useState<PermissionState | 'unknown'>('unknown');
  const [isVoiceOverlayVisible, setIsVoiceOverlayVisible] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const isVoiceActiveRef = useRef(isVoiceActive);

  // Refs for shared audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<AudioNode | null>(null);

  const toggleMute = () => {
    if (mediaStreamRef.current && isVoiceOverlayVisible) { // Only allow muting mic input
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  // Setup shared audio context and analyser once
  useEffect(() => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = context;
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    return () => {
      context.close();
    };
  }, []);

  const handleTTS = useCallback(async (text: string) => {
    if (!text.trim() || !audioContextRef.current || !analyserRef.current) return;

    setIsAiSpeaking(true);
    try {
      const response = await fetch('/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Failed to fetch TTS audio');

      const audioData = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);

      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyserRef.current);
      source.connect(audioContextRef.current.destination);
      audioSourceRef.current = source;
      source.start();

      source.onended = () => {
        setIsAiSpeaking(false);
        source.disconnect();
        audioSourceRef.current = null;
      };
    } catch (error) {
      console.error('Error during TTS playback:', error);
      setIsAiSpeaking(false);
    }
  }, []);

  const toggleVoiceOverlay = async () => {
    if (isVoiceOverlayVisible) {
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setIsVoiceOverlayVisible(false);
      setIsMuted(false); // Reset mute state on close
    } else {
      const permissionGranted = await requestMicrophonePermission();
      if (permissionGranted && mediaStreamRef.current && analyserRef.current) {
        if (audioSourceRef.current) {
          audioSourceRef.current.disconnect();
        }
        const source = audioContextRef.current!.createMediaStreamSource(mediaStreamRef.current);
        source.connect(analyserRef.current);
        audioSourceRef.current = source;
        setIsVoiceOverlayVisible(true);
      }
    }
  };

  useEffect(() => {
    isVoiceActiveRef.current = isVoiceActive;
  }, [isVoiceActive]);

  useEffect(() => {
    onMessagesChange(messages.length > 0);
  }, [messages, onMessagesChange]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (messageText.trim() === '') return;

    const messageId = Date.now();
    const newUserMessage: Message = { id: messageId, text: messageText, isUser: true, status: 'pending' };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      setMessages(prevMessages => prevMessages.map(msg => msg.id === messageId ? { ...msg, status: 'sent' } : msg));

      const data = await response.json();
      if (data.response) {
        const newAiMessage: Message = { id: Date.now() + 1, text: data.response, isUser: false };
        setMessages((prevMessages) => [...prevMessages, newAiMessage]);
        // await handleTTS(data.response); // BUG: This should not be here
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
  }, [handleTTS]);

  const requestMicrophonePermission = async () => {
    // ... (rest of the function is unchanged)
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicrophonePermission(permissionStatus.state);
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
    // ... (this function remains unchanged)
    if (isVoiceActiveRef.current) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setIsVoiceActive(false);
    } else {
      const permissionGranted = await requestMicrophonePermission();
      if (permissionGranted && mediaStreamRef.current) {
        setIsVoiceActive(true);
        audioChunks.current = [];
        mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, { mimeType: 'audio/webm' });
        mediaRecorderRef.current.ondataavailable = (event) => audioChunks.current.push(event.data);
        mediaRecorderRef.current.onerror = (event) => console.error('MediaRecorder error:', event);
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          try {
            const response = await fetch('/transcribe', {
              method: 'POST',
              body: audioBlob,
              headers: { 'Content-Type': 'audio/webm' },
            });
            const data = await response.json();
            if (data.transcript) setInputValue(data.transcript);
          } catch (error) {
            console.error('Error transcribing audio:', error);
          }
        };
        mediaRecorderRef.current.start();
      }
    }
  }, []);

  return (
    <div className="chat-wrapper">
      {(isVoiceOverlayVisible || isAiSpeaking) && <VoiceChatOverlay onClose={toggleVoiceOverlay} analyser={analyserRef.current} isMuted={isMuted} onToggleMute={toggleMute} />}
      <div className="chat-main">
        <AnimatePresence mode="wait">
          {!hasMessages && (
            <motion.div
              key="welcome-overlay"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 0.8 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, backgroundColor: 'var(--background-color)' }}
            >
              <Welcome />
            </motion.div>
          )}
        </AnimatePresence>
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
            onVoiceChatClick={toggleVoiceOverlay}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
