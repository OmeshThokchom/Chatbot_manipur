import React, { useRef, useEffect, useState } from 'react';
import './AudioVisualizer.css';

interface AudioVisualizerProps {
  isVoiceActive: boolean;
  simulateAudio?: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isVoiceActive, simulateAudio = false }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);

  const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupAudio = async () => {
    try {
      if (simulateAudio) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256; // Smaller FFT size for more responsive data
        setHasMicrophoneAccess(true);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setHasMicrophoneAccess(true);

        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256; // Smaller FFT size for more responsive data
        source.connect(analyserRef.current);
      }

      draw();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied or not available.');
      setHasMicrophoneAccess(false);
    }
  };

  const stopAudio = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setHasMicrophoneAccess(false);
    setError(null);
  };

  const draw = () => {
    if (!analyserRef.current || !visualizerRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount; // Half of fftSize
    const dataArray = new Uint8Array(bufferLength);

    if (simulateAudio) {
      const time = audioContextRef.current?.currentTime || 0;
      const pulse = (Math.sin(time * 5) + 1) / 2; // Pulsates between 0 and 1
      const amplitude = 50 + pulse * 150; // Base amplitude + pulse

      for (let i = 0; i < bufferLength; i++) {
        dataArray[i] = 128 + Math.sin(i * 0.1 + time * 10) * amplitude * (i / bufferLength); // Waveform effect
      }
    } else {
      analyserRef.current.getByteFrequencyData(dataArray); // Get frequency data
    }

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const averageAmplitude = sum / bufferLength;
    const normalizedAmplitude = averageAmplitude / 255; // Normalize to 0-1

    // Map amplitude to CSS custom properties
    const hue = normalizedAmplitude * 360; // Full color spectrum
    const saturation = 80 + normalizedAmplitude * 20; // 80-100% for more vibrancy
    const lightness = 60 + normalizedAmplitude * 20; // 60-80% for more brightness
    const blur = normalizedAmplitude * 20; // 0-20px blur for stronger effect
    const scale = 1 + normalizedAmplitude * 0.08; // Slightly more pronounced scale effect

    // Dynamic blur color based on current hue
    const blurColorHue = hue;
    const blurColorSaturation = 100;
    const blurColorLightness = 70;
    const blurColorAlpha = 0.7 + normalizedAmplitude * 0.3; // More opaque with higher amplitude

    visualizerRef.current.style.setProperty('--visualizer-hue', hue.toString());
    visualizerRef.current.style.setProperty('--visualizer-saturation', `${saturation}%`);
    visualizerRef.current.style.setProperty('--visualizer-lightness', `${lightness}%`);
    visualizerRef.current.style.setProperty('--visualizer-blur', `${blur}px`);
    visualizerRef.current.style.setProperty('--visualizer-scale', scale.toString());
    visualizerRef.current.style.setProperty('--visualizer-blur-color', `hsla(${blurColorHue}, ${blurColorSaturation}%, ${blurColorLightness}%, ${blurColorAlpha})`);

    animationFrameId.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    if (isVoiceActive) {
      setupAudio();
    } else {
      stopAudio();
    }

    return () => {
      stopAudio();
    };
  }, [isVoiceActive, simulateAudio]);

  if (error) {
    return <div className="audio-visualizer-error">{error}</div>;
  }

  if (!hasMicrophoneAccess && isVoiceActive && !simulateAudio) {
    return <div className="audio-visualizer-message">Requesting microphone access...</div>;
  }

  return (
    <div className="audio-visualizer-border" ref={visualizerRef}>
      {/* The actual gradient will be created using CSS on this div */}
    </div>
  );
};

export default AudioVisualizer;
