'use client';

import { useRef, useEffect, useCallback } from 'react';

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
  signal: number; // 0-1, traveling signal position
  active: boolean;
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    // Create neurons
    const numNeurons = 60;
    const neurons: Neuron[] = [];
    for (let i = 0; i < numNeurons; i++) {
      neurons.push({
        x: Math.random() * W(),
        y: Math.random() * H(),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 2 + Math.random() * 3,
        brightness: 0.15 + Math.random() * 0.25,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        firing: false,
        fireTimer: 0,
      });
    }

    // Create synapses
    const synapses: Synapse[] = [];
    const maxDist = 200;

    // Spontaneous firing
    let lastFireTime = 0;

    function animate(time: number) {
      ctx.clearRect(0, 0, W(), H());

      // Update neurons
      for (const n of neurons) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulsePhase += n.pulseSpeed;

        // Bounce
        if (n.x < 0 || n.x > W()) n.vx *= -1;
        if (n.y < 0 || n.y > H()) n.vy *= -1;
        n.x = Math.max(0, Math.min(W(), n.x));
        n.y = Math.max(0, Math.min(H(), n.y));

        // Firing decay
        if (n.firing) {
          n.fireTimer -= 0.02;
          if (n.fireTimer <= 0) n.firing = false;
        }
      }

      // Spontaneous firing — trigger random neuron
      if (time - lastFireTime > 400 + Math.random() * 800) {
        const idx = Math.floor(Math.random() * neurons.length);
        neurons[idx].firing = true;
        neurons[idx].fireTimer = 1;
        lastFireTime = time;

        // Propagate to nearby neurons
        for (let j = 0; j < neurons.length; j++) {
          if (j === idx) continue;
          const dx = neurons[j].x - neurons[idx].x;
          const dy = neurons[j].y - neurons[idx].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist && Math.random() > 0.6) {
            const delay = dist / maxDist;
            setTimeout(() => {
              if (neurons[j]) {
                neurons[j].firing = true;
                neurons[j].fireTimer = 0.7;
              }
            }, delay * 300);
          }
        }
      }

      // Rebuild synapses
      synapses.length = 0;
      for (let i = 0; i < neurons.length; i++) {
        for (let j = i + 1; j < neurons.length; j++) {
          const dx = neurons[j].x - neurons[i].x;
          const dy = neurons[j].y - neurons[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const strength = 1 - dist / maxDist;
            synapses.push({ from: i, to: j, strength, signal: 0, active: neurons[i].firing || neurons[j].firing });
          }
        }
      }

      // Draw synapses
      for (const s of synapses) {
        const a = neurons[s.from];
        const b = neurons[s.to];
        const alpha = s.active
          ? s.strength * 0.5
          : s.strength * 0.08;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        if (s.active) {
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, `rgba(34, 211, 238, ${alpha})`);
          grad.addColorStop(1, `rgba(167, 139, 250, ${alpha})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
        }
        ctx.stroke();
      }

      // Draw neurons
      for (const n of neurons) {
        const pulse = Math.sin(n.pulsePhase) * 0.15 + 0.85;
        const r = n.radius * pulse;

        if (n.firing) {
          // Glow
          const glow = n.fireTimer;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 6, 0, Math.PI * 2);
          const glowGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 6);
          glowGrad.addColorStop(0, `rgba(34, 211, 238, ${glow * 0.3})`);
          glowGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
          ctx.fillStyle = glowGrad;
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * (1 + glow * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 211, 238, ${0.6 + glow * 0.4})`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${n.brightness * pulse})`;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full landing-canvas"
      style={{ opacity: 0.6 }}
    />
  );
}
