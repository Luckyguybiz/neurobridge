'use client';

import { useRef, useEffect } from 'react';

/**
 * Decorative firing-rate heatmap. Updates data ~10Hz, draws on rAF so the
 * fade-edges stay clean if the page resizes.
 *
 * Previous version mixed setInterval + rAF in a self-rescheduling animate(),
 * causing double-paint per tick. This separates "update model" from "paint".
 */
export default function MiniHeatmap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const rows = 8;
    const cols = 30;
    const data: number[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.random() * 0.5)
    );

    let W = 0, H = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      W = rect.width;
      H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const readBgColor = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#05060a';

    function interpolateInferno(t: number): string {
      const r = Math.round(Math.min(255, t * 800));
      const g = Math.round(Math.max(0, Math.min(255, (t - 0.3) * 400)));
      const b = Math.round(Math.max(0, Math.min(255, (0.5 - Math.abs(t - 0.35)) * 500)));
      return `rgb(${r}, ${g}, ${Math.max(20, b)})`;
    }

    const updateData = () => {
      for (let r = 0; r < rows; r++) {
        data[r].shift();
        const prev = data[r][data[r].length - 1];
        let next = prev + (Math.random() - 0.5) * 0.15;
        if (Math.random() < 0.02) next = 0.6 + Math.random() * 0.4;
        data[r].push(Math.max(0, Math.min(1, next)));
      }
    };

    const drawFrame = () => {
      if (W === 0 || H === 0) return;
      const cellW = W / cols;
      const cellH = H / rows;
      const bg = readBgColor();

      ctx.clearRect(0, 0, W, H);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = interpolateInferno(data[r][c]);
          ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH - 1);
        }
      }
      const fadeW = 30;
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
    };

    let dataTimer: ReturnType<typeof setInterval> | null = null;
    let raf = 0;
    let running = !reducedMotion;
    let visible = true;

    const loop = () => {
      drawFrame();
      if (running) raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      dataTimer = setInterval(updateData, 100);
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      if (dataTimer) { clearInterval(dataTimer); dataTimer = null; }
      cancelAnimationFrame(raf);
    };

    if (reducedMotion) {
      drawFrame(); // single static frame
    } else {
      dataTimer = setInterval(updateData, 100);
      raf = requestAnimationFrame(loop);
    }

    const updateRunning = () => {
      const should = !document.hidden && visible && !reducedMotion;
      if (should) start(); else stop();
    };
    const onVis = () => updateRunning();
    document.addEventListener('visibilitychange', onVis);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; updateRunning(); }, { rootMargin: '50px' });
    io.observe(canvas);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full rounded-xl landing-canvas" style={{ height: 200 }} aria-hidden="true" />;
}
