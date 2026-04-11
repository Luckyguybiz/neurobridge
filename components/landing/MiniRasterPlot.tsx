'use client';

import { useRef, useEffect } from 'react';

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#4ade80', '#facc15'];

export default function MiniRasterPlot() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const channels = 6;
    const channelH = H / channels;
    const spikesPerChannel = 80;

    // Pre-generate spike positions
    const spikes: { x: number; ch: number; age: number }[] = [];
    for (let ch = 0; ch < channels; ch++) {
      for (let i = 0; i < spikesPerChannel; i++) {
        spikes.push({ x: Math.random() * W, ch, age: Math.random() * 1000 });
      }
    }

    let animId = 0;
    let time = 0;

    function animate() {
      time++;
      ctx.clearRect(0, 0, W, H);

      // Scrolling effect — move spikes left
      const scrollSpeed = 0.3;

      for (const spike of spikes) {
        spike.x -= scrollSpeed;
        if (spike.x < -5) {
          spike.x = W + Math.random() * 20;
          spike.age = 0;
        }
        spike.age++;

        const y = spike.ch * channelH + channelH / 2;
        const alpha = Math.min(spike.age / 30, 1) * 0.7;

        // Glow for recent spikes
        if (spike.age < 20) {
          const grad = ctx.createRadialGradient(spike.x, y, 0, spike.x, y, 8);
          grad.addColorStop(0, `${COLORS[spike.ch]}40`);
          grad.addColorStop(1, `${COLORS[spike.ch]}00`);
          ctx.fillStyle = grad;
          ctx.fillRect(spike.x - 8, y - 8, 16, 16);
        }

        ctx.beginPath();
        ctx.arc(spike.x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[spike.ch];
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Channel lines
      for (let ch = 1; ch < channels; ch++) {
        const isDark = document.documentElement.classList.contains('dark') || !document.documentElement.classList.contains('light');
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, ch * channelH);
        ctx.lineTo(W, ch * channelH);
        ctx.stroke();
      }

      // Edge fades
      const fadeW = 40;
      const fadeL = ctx.createLinearGradient(0, 0, fadeW, 0);
      fadeL.addColorStop(0, '#05060a');
      fadeL.addColorStop(1, 'transparent');
      ctx.fillStyle = fadeL;
      ctx.fillRect(0, 0, fadeW, H);

      const fadeR = ctx.createLinearGradient(W - fadeW, 0, W, 0);
      fadeR.addColorStop(0, 'transparent');
      fadeR.addColorStop(1, '#05060a');
      ctx.fillStyle = fadeR;
      ctx.fillRect(W - fadeW, 0, fadeW, H);

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="w-full rounded-xl landing-canvas" style={{ height: 200 }} />;
}
