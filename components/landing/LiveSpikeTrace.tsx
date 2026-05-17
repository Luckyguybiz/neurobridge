'use client';

import { useRef, useEffect } from 'react';

const ELECTRODE_COLORS = [
  '#22d3ee', '#a78bfa', '#f472b6', '#fb923c',
  '#4ade80', '#facc15', '#f87171', '#38bdf8',
];

/**
 * 4-channel MEA spike trace, faux-live.
 *
 * Correctness:
 * - DPR via setTransform reset on every resize (not ctx.scale which compounds).
 * - Fade colour reads --bg-primary from CSS — works in light + dark themes.
 * - Pauses on document.hidden and on prefers-reduced-motion.
 * - Uses ResizeObserver on the canvas itself — picks up parent layout shifts
 *   (sidebar collapse, container width changes) that 'resize' on window misses.
 */
export default function LiveSpikeTrace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0;
    let H = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      if (W === 0 || H === 0) return; // not mounted yet, skip
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const channels = 4;
    const bufferSize = 600;
    const buffers: Float32Array[] = Array.from({ length: channels }, () => new Float32Array(bufferSize));
    let writePos = 0;
    const baseRates = Array.from({ length: channels }, () => 1 + Math.random() * 4);

    let raf = 0;
    let running = true;
    let lastTime = 0;

    const readBgColor = () => {
      // CSS var resolved in JS → robust to theme toggle without re-rendering.
      const c = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim();
      return c || '#05060a';
    };

    function generateSample(channel: number): number {
      let v = (Math.random() - 0.5) * 0.08;
      if (Math.random() < baseRates[channel] / 600) v = -(0.5 + Math.random() * 0.5);
      return v;
    }

    const drawFrame = (time: number) => {
      if (!lastTime) lastTime = time;
      const dt = time - lastTime;
      const samples = Math.max(1, Math.floor(dt / 8));
      for (let s = 0; s < samples; s++) {
        for (let ch = 0; ch < channels; ch++) {
          buffers[ch][writePos % bufferSize] = generateSample(ch);
        }
        writePos++;
      }
      lastTime = time;

      // Width/Height can be 0 if container is collapsed — skip until visible.
      if (W === 0 || H === 0) {
        if (running) raf = requestAnimationFrame(drawFrame);
        return;
      }

      const channelH = H / channels;
      const bg = readBgColor();
      const isLight = document.documentElement.classList.contains('light');

      ctx.clearRect(0, 0, W, H);

      for (let ch = 0; ch < channels; ch++) {
        const yCenter = channelH * ch + channelH / 2;
        const color = ELECTRODE_COLORS[ch];

        ctx.fillStyle = `${color}40`;
        ctx.font = '10px monospace';
        ctx.fillText(`E${ch}`, 4, yCenter - channelH / 2 + 14);

        if (ch > 0) {
          ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, channelH * ch);
          ctx.lineTo(W, channelH * ch);
          ctx.stroke();
        }

        // Trace
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
          const v = buffers[ch][readIdx];
          if (v < -0.3) {
            const x = (i / bufferSize) * W;
            const y = yCenter + v * scale;
            const g = ctx.createRadialGradient(x, y, 0, x, y, 12);
            g.addColorStop(0, `${color}60`);
            g.addColorStop(1, `${color}00`);
            ctx.fillStyle = g;
            ctx.fillRect(x - 12, y - 12, 24, 24);
          }
        }

        // Theme-aware fade edges (was hardcoded #05060a → wrong in light theme)
        const fadeW = 60;
        const fadeL = ctx.createLinearGradient(0, 0, fadeW, 0);
        fadeL.addColorStop(0, bg);
        fadeL.addColorStop(1, 'transparent');
        ctx.fillStyle = fadeL;
        ctx.fillRect(0, channelH * ch, fadeW, channelH);

        const fadeR = ctx.createLinearGradient(W - fadeW, 0, W, 0);
        fadeR.addColorStop(0, 'transparent');
        fadeR.addColorStop(1, bg);
        ctx.fillStyle = fadeR;
        ctx.fillRect(W - fadeW, channelH * ch, fadeW, channelH);
      }

      // Playhead
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(W - 2, 0);
      ctx.lineTo(W - 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      if (running) raf = requestAnimationFrame(drawFrame);
    };

    if (reducedMotion) {
      // Pre-fill buffer so the static frame looks alive
      for (let s = 0; s < bufferSize; s++) {
        for (let ch = 0; ch < channels; ch++) buffers[ch][writePos % bufferSize] = generateSample(ch);
        writePos++;
      }
      drawFrame(0);
      running = false;
    } else {
      raf = requestAnimationFrame(drawFrame);
    }

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reducedMotion && !running) {
        running = true;
        lastTime = 0;
        raf = requestAnimationFrame(drawFrame);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <canvas ref={canvasRef} className="w-full landing-canvas" style={{ height: 240 }} aria-hidden="true" />
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
