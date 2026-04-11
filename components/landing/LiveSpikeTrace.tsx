'use client';

import { useRef, useEffect } from 'react';

const ELECTRODE_COLORS = [
  '#22d3ee', '#a78bfa', '#f472b6', '#fb923c',
  '#4ade80', '#facc15', '#f87171', '#38bdf8',
];

export default function LiveSpikeTrace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let W = 0;
    let H = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const channels = 4;
    const channelH = H / channels;
    const bufferSize = 600;

    // Ring buffers for each channel
    const buffers: Float32Array[] = Array.from({ length: channels }, () => new Float32Array(bufferSize));
    let writePos = 0;

    // Noise + spike generation
    const baseRates = Array.from({ length: channels }, () => 1 + Math.random() * 4);

    let animId = 0;
    let lastTime = 0;

    function generateSample(channel: number, t: number): number {
      // Base noise
      let val = (Math.random() - 0.5) * 0.08;

      // Occasional spikes (Poisson-ish)
      if (Math.random() < baseRates[channel] / 600) {
        val = -(0.5 + Math.random() * 0.5); // negative spike
      }

      return val;
    }

    function animate(time: number) {
      if (!lastTime) lastTime = time;
      const dt = time - lastTime;

      // Generate ~2 samples per frame for smooth scrolling
      const samplesToGen = Math.max(1, Math.floor(dt / 8));
      for (let s = 0; s < samplesToGen; s++) {
        for (let ch = 0; ch < channels; ch++) {
          buffers[ch][writePos % bufferSize] = generateSample(ch, time);
        }
        writePos++;
      }
      lastTime = time;

      // Draw
      ctx.clearRect(0, 0, W, H);

      for (let ch = 0; ch < channels; ch++) {
        const yCenter = channelH * ch + channelH / 2;
        const color = ELECTRODE_COLORS[ch];

        // Channel label
        ctx.fillStyle = `${color}40`;
        ctx.font = '10px monospace';
        ctx.fillText(`E${ch}`, 4, yCenter - channelH / 2 + 14);

        // Separator line
        if (ch > 0) {
          const isDark = document.documentElement.classList.contains('dark') || !document.documentElement.classList.contains('light');
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, channelH * ch);
          ctx.lineTo(W, channelH * ch);
          ctx.stroke();
        }

        // Draw trace
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        const scale = channelH * 0.4;
        for (let i = 0; i < bufferSize; i++) {
          const readIdx = (writePos - bufferSize + i + bufferSize * 10) % bufferSize;
          const x = (i / bufferSize) * W;
          const y = yCenter + buffers[ch][readIdx] * scale;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Glow on spikes
        for (let i = 1; i < bufferSize; i++) {
          const readIdx = (writePos - bufferSize + i + bufferSize * 10) % bufferSize;
          const val = buffers[ch][readIdx];
          if (val < -0.3) {
            const x = (i / bufferSize) * W;
            const y = yCenter + val * scale;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, 12);
            grad.addColorStop(0, `${color}60`);
            grad.addColorStop(1, `${color}00`);
            ctx.fillStyle = grad;
            ctx.fillRect(x - 12, y - 12, 24, 24);
          }
        }

        // Fade edges
        const fadeW = 60;
        const fadeL = ctx.createLinearGradient(0, 0, fadeW, 0);
        fadeL.addColorStop(0, '#05060a');
        fadeL.addColorStop(1, 'transparent');
        ctx.fillStyle = fadeL;
        ctx.fillRect(0, channelH * ch, fadeW, channelH);

        const fadeR = ctx.createLinearGradient(W - fadeW, 0, W, 0);
        fadeR.addColorStop(0, 'transparent');
        fadeR.addColorStop(1, '#05060a');
        ctx.fillStyle = fadeR;
        ctx.fillRect(W - fadeW, channelH * ch, fadeW, channelH);
      }

      // Playhead line
      const playX = W - 2;
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, H);
      ctx.stroke();
      ctx.setLineDash([]);

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <canvas ref={canvasRef} className="w-full landing-canvas" style={{ height: 240 }} />
      {/* Top label */}
      <div className="absolute top-3 right-4 flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
        </span>
        <span className="text-[10px] text-emerald-400/70 font-mono">LIVE</span>
      </div>
    </div>
  );
}
