
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Orb from './orb';
import './VoiceChatOverlay.css';

interface VoiceChatOverlayProps {
  onClose: () => void;
  analyser: AnalyserNode | null;
  isMuted: boolean;
  onToggleMute: () => void;
}


const VoiceChatOverlay: React.FC<VoiceChatOverlayProps> = ({ onClose, analyser, isMuted, onToggleMute }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioNode | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to voice chat server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from voice chat server');
    });

    newSocket.on('transcript', (data: { transcript: string; response: string }) => {
      if (data.transcript && data.response) {
        setIsProcessing(false);
      }
    });

    newSocket.on('tts_audio', async (data: { audio_data: string; sample_rate: number }) => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const audioData = atob(data.audio_data);
        const audioBuffer = await audioContextRef.current.decodeAudioData(
          new Uint8Array(audioData.split('').map(char => char.charCodeAt(0))).buffer
        );

        if (audioSourceRef.current) {
          audioSourceRef.current.disconnect();
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        audioSourceRef.current = source;
        source.start();

        source.onended = () => {
          source.disconnect();
          audioSourceRef.current = null;
        };
      } catch (error) {
        console.error('Error playing TTS audio:', error);
      }
    });

    newSocket.on('error', (error: { message: string }) => {
      console.error('Voice chat error:', error.message);
      setIsProcessing(false);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Start/stop voice recording
  const toggleVoiceRecording = async () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendAudioToServer(audioBlob);
      };

      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      setIsListening(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);
  };

  const sendAudioToServer = async (audioBlob: Blob) => {
    if (!socket) return;

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      setIsProcessing(true);
      socket.emit('voice_data', { audio_data: base64Audio });
    } catch (error) {
      console.error('Error sending audio to server:', error);
      setIsProcessing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="voice-chat-overlay">
      <Orb analyser={analyser} />
      


      {/* Controls */}
      <div className="voice-chat-controls">
        <button 
          className={`control-button mic-button ${isListening ? 'active' : ''}`} 
          onClick={toggleVoiceRecording}
          disabled={isProcessing}
        >
          <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
        </button>
        <button className="control-button mute-button" onClick={onToggleMute}>
          <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
        </button>
        <button className="control-button close-button" onClick={onClose}>
          &times;
        </button>
      </div>
    </div>
  );
};

export default VoiceChatOverlay;
