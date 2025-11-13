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
  const headerRef = useRef<HTMLDivElement | null>(null);
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
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
  };

  const draw = () => {
    if (!analyserRef.current || !headerRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
    const normalized = avg / 255;

    const opacity = 0.3 + normalized * 0.5;
    const blur = 50 + normalized * 80;

    headerRef.current.style.setProperty('--siri-opacity', opacity.toString());
    headerRef.current.style.setProperty('--siri-blur', `${blur}px`);

    animationFrameId.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    if (isVoiceActive && stream) setupAudio();
    else stopAudio();
    return stopAudio;
  }, [isVoiceActive, stream]);

  if (error) return <div className="audio-visualizer-error">{error}</div>;

  return (
    <div className="siri-header-glow" ref={headerRef} data-active={isVoiceActive} />
  );
};

export default AudioVisualizer;
