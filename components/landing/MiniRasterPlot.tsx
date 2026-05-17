'use client';

import { useRef, useEffect } from 'react';

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#4ade80', '#facc15'];

/**
 * Decorative scrolling raster plot for the landing page.
 *
 * - Respects prefers-reduced-motion (renders one static frame).
 * - Pauses when tab hidden or canvas off-screen (IntersectionObserver).
 * - Fade colour reads --bg-primary so light theme isn't washed black.
 * - ResizeObserver tracks the canvas's own box, not just window — picks up
 *   container reflows when the surrounding Glass card animates in.
 */
export default function MiniRasterPlot() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const channels = 6;
    const spikesPerChannel = 80;
    const spikes: { x: number; ch: number; age: number }[] = [];
    let initialized = false;

    const initSpikes = () => {
      spikes.length = 0;
      for (let ch = 0; ch < channels; ch++) {
        for (let i = 0; i < spikesPerChannel; i++) {
          spikes.push({ x: Math.random() * W, ch, age: Math.random() * 1000 });
        }
      }
      initialized = true;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      W = rect.width;
      H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!initialized) initSpikes();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let running = true;
    let visible = true;

    const readBgColor = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#05060a';

    const drawFrame = () => {
      if (W === 0 || H === 0) {
        if (running) raf = requestAnimationFrame(drawFrame);
        return;
      }

      const channelH = H / channels;
      const isLight = document.documentElement.classList.contains('light');
      const bg = readBgColor();
      const lineColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.03)';

      ctx.clearRect(0, 0, W, H);

      for (const spike of spikes) {
        spike.x -= 0.3;
        if (spike.x < -5) {
          spike.x = W + Math.random() * 20;
          spike.age = 0;
        }
        spike.age++;

        const y = spike.ch * channelH + channelH / 2;
        const alpha = Math.min(spike.age / 30, 1) * 0.7;

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
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      for (let ch = 1; ch < channels; ch++) {
        ctx.beginPath();
        ctx.moveTo(0, ch * channelH);
        ctx.lineTo(W, ch * channelH);
        ctx.stroke();
      }

      // Theme-aware edge fades
      const fadeW = 40;
      const fadeL = ctx.createLinearGradient(0, 0, fadeW, 0);
      fadeL.addColorStop(0, bg);
      fadeL.addColorStop(1, 'transparent');
      ctx.fillStyle = fadeL;
      ctx.fillRect(0, 0, fadeW, H);

      const fadeR = ctx.createLinearGradient(W - fadeW, 0, W, 0);
      fadeR.addColorStop(0, 'transparent');
      fadeR.addColorStop(1, bg);
      ctx.fillStyle = fadeR;
      ctx.fillRect(W - fadeW, 0, fadeW, H);

      if (running) raf = requestAnimationFrame(drawFrame);
    };

    if (reducedMotion) {
      // Static frame: pre-age the spikes so they're spread out, then draw once
      for (const s of spikes) s.age = Math.random() * 50;
      drawFrame();
      running = false;
    } else {
      raf = requestAnimationFrame(drawFrame);
    }

    const updateRunning = () => {
      const shouldRun = !document.hidden && visible && !reducedMotion;
      if (shouldRun && !running) {
        running = true;
        raf = requestAnimationFrame(drawFrame);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    const onVis = () => updateRunning();
    document.addEventListener('visibilitychange', onVis);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateRunning();
    }, { rootMargin: '50px' });
    io.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full rounded-xl landing-canvas" style={{ height: 200 }} aria-hidden="true" />;
}
