import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  disabled?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBuffer, isPlaying, onPlay, onStop, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const draw = () => {
    if (!canvasRef.current || !analyzerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzerRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;
      ctx.fillStyle = `rgb(${barHeight + 100}, 50, 200)`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(draw);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handlePlay = async () => {
    if (!audioBuffer) return;
    
    // Initialize context if needed or if closed
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (isPlaying) {
      if (sourceRef.current) sourceRef.current.stop();
      onStop();
      return;
    }

    onPlay();
    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    
    const analyzer = ctx.createAnalyser();
    analyzer.fftSize = 256;
    
    source.connect(analyzer);
    analyzer.connect(ctx.destination);
    
    sourceRef.current = source;
    analyzerRef.current = analyzer;

    source.onended = () => {
      onStop();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      // Clear canvas
       if (canvasRef.current) {
        const c = canvasRef.current.getContext('2d');
        c?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
       }
    };

    source.start();
    draw();
  };

  return (
    <button
      onClick={handlePlay}
      disabled={disabled || !audioBuffer}
      className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
        disabled || !audioBuffer 
          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
          : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-md'
      }`}
    >
      {disabled && !audioBuffer ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
      )}
      
      {/* Visualizer Overlay */}
      <canvas 
        ref={canvasRef}
        width={48}
        height={48}
        className="absolute inset-0 pointer-events-none opacity-50 rounded-full"
      />
    </button>
  );
};

export default AudioPlayer;