'use client';

import { useRef, useEffect } from 'react';

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#4ade80', '#facc15', '#f87171', '#38bdf8'];

interface Node {
  x: number; y: number; vx: number; vy: number;
  radius: number; color: string; pulse: number;
  firing: boolean; fireTimer: number;
}
interface Signal { from: number; to: number; progress: number; speed: number; }

/**
 * Animated network visualisation. Bug-fixed vs. the previous version:
 * - setTransform reset, IntersectionObserver pause, visibility pause,
 *   reduced-motion support, queue-based propagation (no leaked setTimeouts),
 *   ResizeObserver so positions re-layout if the card resizes.
 */
export default function MiniNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let nodes: Node[] = [];
    let connections: [number, number][] = [];

    const buildNetwork = () => {
      nodes = [];
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
        const r = Math.min(W, H) * 0.32 + (Math.random() - 0.5) * 30;
        nodes.push({
          x: W / 2 + Math.cos(angle) * r, y: H / 2 + Math.sin(angle) * r,
          vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
          radius: 3 + Math.random() * 3, color: COLORS[i % COLORS.length],
          pulse: Math.random() * Math.PI * 2, firing: false, fireTimer: 0,
        });
      }
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = Math.min(W, H) * 0.12 + (Math.random() - 0.5) * 20;
        nodes.push({
          x: W / 2 + Math.cos(angle) * r, y: H / 2 + Math.sin(angle) * r,
          vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
          radius: 2.5 + Math.random() * 2.5, color: COLORS[(i + 3) % COLORS.length],
          pulse: Math.random() * Math.PI * 2, firing: false, fireTimer: 0,
        });
      }
      connections = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y);
          if (d < 130 && Math.random() < 0.35) connections.push([i, j]);
        }
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const first = W === 0;
      W = rect.width; H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (first || nodes.length === 0) buildNetwork();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const signals: Signal[] = [];
    const queue: { idx: number; at: number }[] = [];
    let lastFire = 0;
    let raf = 0;
    let running = !reducedMotion;
    let visible = true;

    const drawFrame = (time: number) => {
      if (W === 0 || H === 0) {
        if (running) raf = requestAnimationFrame(drawFrame);
        return;
      }

      // Process pending propagations
      for (let k = queue.length - 1; k >= 0; k--) {
        if (queue[k].at <= time) {
          const n = nodes[queue[k].idx];
          if (n) { n.firing = true; n.fireTimer = 0.6 + Math.random() * 0.4; }
          queue.splice(k, 1);
        }
      }

      ctx.clearRect(0, 0, W, H);

      for (const n of nodes) {
        n.pulse += 0.015;
        n.x += n.vx; n.y += n.vy;
        if (n.x < 30 || n.x > W - 30) n.vx *= -1;
        if (n.y < 30 || n.y > H - 30) n.vy *= -1;
        if (n.firing) { n.fireTimer -= 0.012; if (n.fireTimer <= 0) n.firing = false; }
      }

      // Fire cascade
      if (time - lastFire > 700 + Math.random() * 1000) {
        const origin = Math.floor(Math.random() * nodes.length);
        nodes[origin].firing = true; nodes[origin].fireTimer = 1;
        const visited = new Set([origin]);
        let cur = [origin];
        for (let depth = 0; depth < 4 && cur.length > 0; depth++) {
          const next: number[] = [];
          for (const idx of cur) {
            for (const [a, b] of connections) {
              const nb = a === idx ? b : b === idx ? a : -1;
              if (nb >= 0 && !visited.has(nb) && Math.random() > 0.4) {
                visited.add(nb);
                next.push(nb);
                signals.push({ from: idx, to: nb, progress: 0, speed: 0.02 + Math.random() * 0.015 });
                queue.push({ idx: nb, at: time + depth * 100 + Math.random() * 80 });
              }
            }
          }
          cur = next;
        }
        lastFire = time;
      }

      const isLight = document.documentElement.classList.contains('light');
      const idleStroke = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.04)';

      // Connections
      for (const [i, j] of connections) {
        const a = nodes[i], b = nodes[j];
        const active = a.firing || b.firing;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        if (active) {
          const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          g.addColorStop(0, `${a.color}30`); g.addColorStop(1, `${b.color}30`);
          ctx.strokeStyle = g; ctx.lineWidth = 1.2;
        } else {
          ctx.strokeStyle = idleStroke; ctx.lineWidth = 0.5;
        }
        ctx.stroke();
      }

      // Signals
      for (let s = signals.length - 1; s >= 0; s--) {
        const sig = signals[s];
        sig.progress += sig.speed;
        if (sig.progress > 1) { signals.splice(s, 1); continue; }
        const a = nodes[sig.from], b = nodes[sig.to];
        const sx = a.x + (b.x - a.x) * sig.progress;
        const sy = a.y + (b.y - a.y) * sig.progress;
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
        glow.addColorStop(0, 'rgba(34,211,238,0.7)');
        glow.addColorStop(1, 'rgba(34,211,238,0)');
        ctx.fillStyle = glow; ctx.fillRect(sx - 8, sy - 8, 16, 16);
        ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = isLight ? '#1a1a2e' : '#fff'; ctx.fill();
      }

      // Nodes
      for (const n of nodes) {
        const p = Math.sin(n.pulse) * 0.15 + 0.85;
        const r = n.radius * p;
        if (n.firing) {
          const g = n.fireTimer;
          const o = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 5);
          const hex = Math.round(g * 60).toString(16).padStart(2, '0');
          o.addColorStop(0, `${n.color}${hex}`); o.addColorStop(1, `${n.color}00`);
          ctx.fillStyle = o; ctx.beginPath(); ctx.arc(n.x, n.y, r * 5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(n.x, n.y, r * (1 + g * 0.4), 0, Math.PI * 2);
          ctx.fillStyle = n.color; ctx.globalAlpha = 0.6 + g * 0.4; ctx.fill(); ctx.globalAlpha = 1;
          ctx.beginPath(); ctx.arc(n.x, n.y, r * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${g * 0.8})`; ctx.fill();
        } else {
          const gl = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.5);
          gl.addColorStop(0, `${n.color}18`); gl.addColorStop(1, `${n.color}00`);
          ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `${n.color}aa`; ctx.fill();
          ctx.beginPath(); ctx.arc(n.x, n.y, r * 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = `${n.color}20`; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }

      if (running) raf = requestAnimationFrame(drawFrame);
    };

    if (reducedMotion) drawFrame(0);
    else raf = requestAnimationFrame(drawFrame);

    const updateRunning = () => {
      const should = !document.hidden && visible && !reducedMotion;
      if (should && !running) { running = true; raf = requestAnimationFrame(drawFrame); }
      else if (!should && running) { running = false; cancelAnimationFrame(raf); }
    };
    const onVis = () => updateRunning();
    document.addEventListener('visibilitychange', onVis);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; updateRunning(); }, { rootMargin: '50px' });
    io.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full rounded-xl landing-canvas" style={{ height: 260 }} aria-hidden="true" />;
}
