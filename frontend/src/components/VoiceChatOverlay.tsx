
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Orb from './orb';
import './VoiceChatOverlay.css';

interface VoiceChatOverlayProps {
  onClose: () => void;
  analyser: AnalyserNode | null;
  isMuted: boolean;
  onToggleMute: () => void;
  hue: number;
}


const VoiceChatOverlay: React.FC<VoiceChatOverlayProps> = ({ onClose, analyser, isMuted, onToggleMute, hue }) => {
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
        console.log('Received TTS audio, sample rate:', data.sample_rate);
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

        console.log('TTS audio started playing');

        source.onended = () => {
          console.log('TTS audio finished playing');
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

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      console.log('Microphone access granted, stream:', stream);
      
      // Check if MediaRecorder supports webm
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav';
      console.log('Using MIME type:', mimeType);
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('Audio data available, size:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };


      mediaRecorderRef.current.onstop = () => {
        console.log('Recording stopped, chunks:', audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('Created audio blob, size:', audioBlob.size);
        sendAudioToServer(audioBlob);
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };
      

      mediaRecorderRef.current.start(2000); // Record in 2-second chunks
      setIsListening(true);
      console.log('Voice recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please check permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);
    console.log('Voice recording stopped');
  };

  const sendAudioToServer = async (audioBlob: Blob) => {
    if (!socket) return;

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      console.log('Sending audio to server, size:', audioBlob.size);
      setIsProcessing(true);
      socket.emit('voice_data', { audio_data: base64Audio });
      
      // Restart recording after sending
      setTimeout(() => {
        if (isListening) {
          startRecording();
        }
      }, 1000);
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
      <Orb analyser={analyser} hue={hue} isMuted={isMuted} />
      
      {/* Processing indicator */}
      {isProcessing && (
        <div className="processing-indicator">
          <div className="processing-spinner"></div>
          <span>Processing...</span>
        </div>
      )}

      {/* Controls */}
      <div className="voice-chat-controls">
        <button 
          className={`control-button mic-button ${isListening ? 'active' : ''}`} 
          onClick={() => isListening ? stopRecording() : startRecording()}
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
