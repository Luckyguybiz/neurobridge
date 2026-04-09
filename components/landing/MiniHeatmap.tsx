'use client';

import { useRef, useEffect } from 'react';

export default function MiniHeatmap() {
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

    const rows = 8;
    const cols = 30;
    const cellW = W / cols;
    const cellH = H / rows;

    // Heatmap data — evolving over time
    const data: number[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.random() * 0.5)
    );

    function interpolateInferno(t: number): string {
      // Simplified inferno colormap
      const r = Math.round(Math.min(255, t * 800));
      const g = Math.round(Math.max(0, Math.min(255, (t - 0.3) * 400)));
      const b = Math.round(Math.max(0, Math.min(255, (0.5 - Math.abs(t - 0.35)) * 500)));
      return `rgb(${r}, ${g}, ${Math.max(20, b)})`;
    }

    let animId = 0;

    function animate() {
      // Shift columns left, add new column
      for (let r = 0; r < rows; r++) {
        data[r].shift();
        const prev = data[r][data[r].length - 1];
        // Smooth random walk
        let next = prev + (Math.random() - 0.5) * 0.15;
        // Occasional burst
        if (Math.random() < 0.02) next = 0.6 + Math.random() * 0.4;
        data[r].push(Math.max(0, Math.min(1, next)));
      }

      ctx.clearRect(0, 0, W, H);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = interpolateInferno(data[r][c]);
          ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH - 1);
        }
      }

      // Edge fades
      const fadeW = 30;
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

    // Slower update — every 100ms
    const interval = setInterval(() => {
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(animate);
    }, 100);

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(interval);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full rounded-xl landing-canvas" style={{ height: 200 }} />;
}
