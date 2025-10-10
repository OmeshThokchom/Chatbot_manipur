import React, { useRef, useEffect, useState } from 'react';
import './AudioVisualizer.css';

interface AudioVisualizerProps {
  isVoiceActive: boolean;
  stream: MediaStream | null;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isVoiceActive, stream }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);

  const setupAudio = () => {
    if (stream) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
        draw();
      } catch (err) {
        setError('Could not set up audio visualizer.');
      }
    } else {
      setError('Audio stream not available.');
    }
  };

  const stopAudio = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }
  };

  const draw = () => {
    if (!analyserRef.current || !visualizerRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    const averageAmplitude = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    const normalizedAmplitude = averageAmplitude / 255.0;

    // Base values are set by the active state in the CSS
    const baseOpacity = isVoiceActive ? 0.6 : 0.3;
    const baseSize = isVoiceActive ? 50 : 40;

    // The audio amplitude creates a pulsing effect for both opacity and size
    const opacity = baseOpacity + (normalizedAmplitude * 0.3);
    const size = baseSize + (normalizedAmplitude * 25);

    // Update the CSS custom properties for the inset box-shadow
    const style = visualizerRef.current.style;
    style.setProperty('--glow-opacity', opacity.toString());
    style.setProperty('--glow-size', `${size}px`);

    animationFrameId.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    if (isVoiceActive && stream) {
      setupAudio();
    } else {
      stopAudio();
    }
    return stopAudio;
  }, [isVoiceActive, stream]);

  if (error) {
    return <div className="audio-visualizer-error">{error}</div>;
  }

  return (
    <div 
      className="inner-glow-container" 
      ref={visualizerRef}
      data-active={isVoiceActive}
    />
  );
};

export default AudioVisualizer;