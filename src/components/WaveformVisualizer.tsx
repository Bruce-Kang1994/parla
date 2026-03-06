"use client";

import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  isActive: boolean;
  analyser: AnalyserNode | null;
}

export default function WaveformVisualizer({ isActive, analyser }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 40;
      const barWidth = canvas.width / barCount - 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] / 255;
        const barHeight = Math.max(2, value * centerY * 0.9);

        const hue = 235 + value * 10; // indigo range
        ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${0.3 + value * 0.5})`;

        const x = i * (barWidth + 2);
        ctx.fillRect(x, centerY - barHeight, barWidth, barHeight * 2);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, analyser]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={80}
      className="w-full max-w-md h-20 opacity-80"
    />
  );
}
