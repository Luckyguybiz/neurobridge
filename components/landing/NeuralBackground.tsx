'use client';

import { useRef, useEffect } from 'react';

interface Neuron {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  brightness: number;
  pulsePhase: number;
  pulseSpeed: number;
  firing: boolean;
  fireTimer: number;
}

interface Synapse {
  from: number;
  to: number;
  strength: number;
  active: boolean;
}

/**
 * Animated neural network background.
 *
 * Performance & correctness notes:
 * - DPR transform is RESET on every resize (setTransform, not scale) — naive
 *   scale() compounds on each resize call and breaks coordinates.
 * - Neuron count scales with viewport area (cheaper on phones, richer on desktops).
 * - Pauses animation when the tab is hidden (visibilitychange) — saves battery.
 * - Honours prefers-reduced-motion by rendering a SINGLE static frame.
 * - Theme-aware: reads --bio-primary-500 / --text-primary so it works in light.
 * - No setTimeout chains — propagation is queued and processed in the next frame.
 */
export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Theme-aware colours. RGB tuples so we can vary alpha cheaply.
    const readTheme = () => {
      const isLight = document.documentElement.classList.contains('light');
      return {
        // Active synapse / firing neuron — cyan-violet gradient
        accent1: isLight ? '8, 145, 178' : '34, 211, 238',
        accent2: isLight ? '124, 58, 237' : '167, 139, 250',
        // Idle neuron + synapse — neutral
        idle: isLight ? '24, 24, 40' : '255, 255, 255',
      };
    };
    let palette = readTheme();
    const themeObserver = new MutationObserver(() => { palette = readTheme(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    let dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x to save fillrate
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      // setTransform RESETS first — scale() would compound on every resize.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Density scales with area — phones get fewer particles, desktops more.
    const area = W * H;
    const numNeurons = Math.round(Math.min(80, Math.max(20, area / 24000)));
    const maxDist = Math.min(220, Math.max(120, Math.sqrt(area) / 9));

    const neurons: Neuron[] = Array.from({ length: numNeurons }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: 2 + Math.random() * 3,
      brightness: 0.15 + Math.random() * 0.25,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
      firing: false,
      fireTimer: 0,
    }));

    // Pending propagations: {neuronIndex, fireAtTime}. Processed each frame —
    // avoids setTimeout chains that survive unmount.
    const queue: { idx: number; at: number }[] = [];
    let lastFire = 0;
    let raf = 0;
    let running = true;

    const drawFrame = (time: number) => {
      ctx.clearRect(0, 0, W, H);

      // Process queued propagations
      for (let k = queue.length - 1; k >= 0; k--) {
        if (queue[k].at <= time) {
          const n = neurons[queue[k].idx];
          if (n) { n.firing = true; n.fireTimer = 0.7; }
          queue.splice(k, 1);
        }
      }

      // Update neurons
      for (const n of neurons) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulsePhase += n.pulseSpeed;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.x = Math.max(0, Math.min(W, n.x));
        n.y = Math.max(0, Math.min(H, n.y));
        if (n.firing) {
          n.fireTimer -= 0.02;
          if (n.fireTimer <= 0) n.firing = false;
        }
      }

      // Spontaneous firing
      if (time - lastFire > 400 + Math.random() * 800) {
        const idx = Math.floor(Math.random() * neurons.length);
        neurons[idx].firing = true;
        neurons[idx].fireTimer = 1;
        lastFire = time;
        for (let j = 0; j < neurons.length; j++) {
          if (j === idx) continue;
          const dx = neurons[j].x - neurons[idx].x;
          const dy = neurons[j].y - neurons[idx].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist && Math.random() > 0.6) {
            queue.push({ idx: j, at: time + (dist / maxDist) * 300 });
          }
        }
      }

      // Draw synapses (skip ones that are too far apart — much faster than rebuild)
      for (let i = 0; i < neurons.length; i++) {
        const a = neurons[i];
        for (let j = i + 1; j < neurons.length; j++) {
          const b = neurons[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > maxDist * maxDist) continue;
          const dist = Math.sqrt(distSq);
          const strength = 1 - dist / maxDist;
          const active = a.firing || b.firing;
          const alpha = active ? strength * 0.5 : strength * 0.08;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          if (active) {
            const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            g.addColorStop(0, `rgba(${palette.accent1}, ${alpha})`);
            g.addColorStop(1, `rgba(${palette.accent2}, ${alpha})`);
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.5;
          } else {
            ctx.strokeStyle = `rgba(${palette.idle}, ${alpha})`;
            ctx.lineWidth = 0.5;
          }
          ctx.stroke();
        }
      }

      // Draw neurons
      for (const n of neurons) {
        const pulse = Math.sin(n.pulsePhase) * 0.15 + 0.85;
        const r = n.radius * pulse;

        if (n.firing) {
          const glow = n.fireTimer;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 6, 0, Math.PI * 2);
          const gg = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 6);
          gg.addColorStop(0, `rgba(${palette.accent1}, ${glow * 0.3})`);
          gg.addColorStop(1, `rgba(${palette.accent1}, 0)`);
          ctx.fillStyle = gg;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * (1 + glow * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${palette.accent1}, ${0.6 + glow * 0.4})`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${palette.idle}, ${n.brightness * pulse})`;
          ctx.fill();
        }
      }

      if (running) raf = requestAnimationFrame(drawFrame);
    };

    if (reducedMotion) {
      // One static frame — no animation, still pretty
      drawFrame(0);
      running = false;
    } else {
      raf = requestAnimationFrame(drawFrame);
    }

    // Pause when tab hidden — save battery + CPU
    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reducedMotion && !running) {
        running = true;
        raf = requestAnimationFrame(drawFrame);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full landing-canvas"
      style={{ opacity: 0.6 }}
      aria-hidden="true"
    />
  );
}
