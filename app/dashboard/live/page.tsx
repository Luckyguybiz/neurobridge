'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDashboardContext } from '@/lib/dashboard-context';
import { ELECTRODE_COLORS } from '@/lib/utils';
import { Glass, Panel, Button, Badge, StatCard } from '@/components/design';

const WINDOW_SEC = 10;

export default function LivePage() {
  const { live, liveConnect, livePause, liveResume, liveDisconnect } = useDashboardContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize separately from render. ctx.scale on every frame compounded the
    // transform — making spikes drift off-screen and burning fillrate.
    let cssW = 0, cssH = 0;
    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === cssW && rect.height === cssH) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = rect.width;
      cssH = rect.height;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setupCanvas();
    const ro = new ResizeObserver(setupCanvas);
    ro.observe(canvas);

    const render = () => {
      setupCanvas();
      const w = cssW;
      const h = cssH;

      const isDark = document.documentElement.classList.contains('dark') || !document.documentElement.classList.contains('light');

      // Transparent background — glass container underneath provides the tint
      ctx.clearRect(0, 0, w, h);

      const spikes = live.spikes;
      if (spikes.length === 0) {
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
        ctx.font = '500 13px -apple-system, system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(
          live.connected ? 'Waiting for spikes…' : 'Press Connect to start streaming',
          w / 2, h / 2,
        );
        animRef.current = requestAnimationFrame(render);
        return;
      }

      const maxTime = spikes[spikes.length - 1].time;
      const minTime = maxTime - WINDOW_SEC;
      const bandH = h / 8;

      // Soft electrode lane backgrounds — alternating subtle tint
      for (let i = 0; i < 8; i++) {
        if (i % 2 === 0) {
          ctx.fillStyle = isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.02)';
          ctx.fillRect(0, i * bandH, w, bandH);
        }
      }

      // Grid lines — very subtle
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * bandH);
        ctx.lineTo(w, i * bandH);
        ctx.stroke();
      }

      // Electrode labels
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.32)';
      ctx.font = '600 10px -apple-system, "SF Mono", monospace';
      ctx.textAlign = 'left';
      for (let i = 0; i < 8; i++) {
        ctx.fillText(`E${i}`, 6, i * bandH + 14);
      }

      // Time axis hint — fading leading edge = newest spikes
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.85, 'transparent');
      gradient.addColorStop(1, isDark ? 'rgba(29,233,182,0.1)' : 'rgba(0,168,150,0.08)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Spikes — bio-tinted with soft glow per electrode
      for (const spike of spikes) {
        const x = ((spike.time - minTime) / WINDOW_SEC) * w;
        const y = spike.electrode * bandH + bandH / 2;
        const age = (maxTime - spike.time) / WINDOW_SEC; // 0 newest → 1 oldest
        const alpha = 0.85 * (1 - age * 0.6);
        const color = ELECTRODE_COLORS[spike.electrode % 8];

        // Soft glow
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Paused overlay — glass blur effect
      if (live.paused) {
        ctx.fillStyle = isDark ? 'rgba(10,12,20,0.55)' : 'rgba(245,245,247,0.55)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)';
        ctx.font = '700 14px -apple-system, system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('⏸  PAUSED', w / 2, h / 2);
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [live.spikes, live.connected, live.paused]);

  const statusText = live.paused ? 'PAUSED' : live.connected ? 'STREAMING' : live.spikeCount > 0 ? 'STOPPED' : 'DISCONNECTED';
  const statusTone: 'primary' | 'neural' | 'spark' | 'warn' | 'error' | 'success' | 'neutral' = live.paused
    ? 'warn'
    : live.connected
      ? 'success'
      : live.spikeCount > 0
        ? 'neutral'
        : 'error';

  // Peak rate (max over all electrodes)
  const peakRate = live.rates.length > 0 ? Math.max(...live.rates) : 0;

  return (
    <div className="p-3 sm:p-5 space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="font-display"
                style={{ fontSize: 'var(--t-2xl)', fontWeight: 'var(--tw-semibold)', letterSpacing: '-0.022em', lineHeight: 1.1, color: 'var(--text-primary)' }}
              >
                Live Stream
              </h1>
              <Badge tone={statusTone} variant="glass" size="md" dot pulsing={live.connected && !live.paused}>
                {statusText}
              </Badge>
            </div>
            <p className="type-body" style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              Real-time spike streaming via WebSocket · {WINDOW_SEC}s sliding window
            </p>
          </div>

          {/* Floating control bar */}
          <Glass
            thickness="regular"
            radius="full"
            elevation={2}
            className="flex items-center gap-1.5"
            style={{ padding: '4px 6px' }}
          >
            {!live.connected ? (
              <Button variant="solid" size="sm" accent="primary" onClick={liveConnect}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0a0c14' }}
                    aria-hidden="true"
                  />
                  Connect
                </span>
              </Button>
            ) : live.paused ? (
              <Button variant="solid" size="sm" accent="primary" onClick={liveResume}>
                ▶ Resume
              </Button>
            ) : (
              <Button variant="glass" size="sm" accent="warn" onClick={livePause}>
                ⏸ Pause
              </Button>
            )}
            {live.connected && (
              <Button
                variant="ghost"
                size="sm"
                accent="error"
                onClick={liveDisconnect}
                aria-label="Disconnect"
                style={{ minWidth: '36px', padding: '0 10px' }}
              >
                ✕
              </Button>
            )}
          </Glass>
        </div>
      </motion.div>

      {/* Hero stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Spikes received"
          value={live.spikeCount.toLocaleString()}
          caption={live.connected ? 'Streaming' : 'Idle'}
          tint={live.connected ? 'primary' : 'none'}
          size="sm"
        />
        <StatCard
          label="Elapsed"
          value={live.elapsed.toString()}
          unit="s"
          caption={`${WINDOW_SEC}s window`}
          tint="spark"
          size="sm"
        />
        <StatCard
          label="Peak rate"
          value={peakRate > 0 ? peakRate.toFixed(1) : '—'}
          unit={peakRate > 0 ? 'Hz' : undefined}
          caption="Highest electrode"
          tint={peakRate > 50 ? 'warn' : 'neural'}
          size="sm"
        />
        <StatCard
          label="Channels"
          value="8"
          caption="Multi-electrode"
          tint="none"
          size="sm"
        />
      </div>

      {/* Fullscreen canvas hero */}
      <Glass
        thickness="ultra-thin"
        radius="2xl"
        elevation={3}
        className="relative overflow-hidden"
        style={{ padding: 'var(--space-4)' }}
      >
        {/* Bio ambient blobs behind canvas */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 15% 30%, color-mix(in srgb, var(--bio-primary-500) 18%, transparent) 0%, transparent 40%), radial-gradient(circle at 85% 70%, color-mix(in srgb, var(--bio-neural-500) 14%, transparent) 0%, transparent 45%), radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--bio-spark-600) 8%, transparent) 0%, transparent 55%)',
            filter: 'blur(20px)',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />

        <div className="relative" style={{ zIndex: 1 }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="type-eyebrow">Raster plot</div>
              <div className="type-title-3" style={{ marginTop: 'var(--space-1)' }}>Real-time spike events</div>
            </div>
            <div className="flex items-center gap-2">
              {live.connected && !live.paused && (
                <span className="pulse-dot" aria-hidden="true" />
              )}
              <span
                className="type-caption tabular"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {live.spikes.length} in window
              </span>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            className="w-full block rounded-xl"
            style={{
              height: 'clamp(280px, 48vh, 440px)',
              background: 'var(--glass-ultra-thin)',
              boxShadow: 'inset 0 1px 0 var(--edge-top), inset 0 -1px 0 var(--edge-bottom)',
            }}
          />
        </div>
      </Glass>

      {/* Per-electrode rates — glass panel */}
      <Panel
        radius="2xl"
        elevation={2}
        padding="md"
        eyebrow="Per-electrode firing rate"
        title="Activity lanes"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {live.rates.map((rate, i) => {
            const pct = Math.min(100, rate * 2);
            const color = ELECTRODE_COLORS[i];
            return (
              <div key={i} className="flex items-center gap-3">
                <span
                  className="font-mono tabular"
                  style={{
                    fontSize: 'var(--t-xs)',
                    color,
                    width: '28px',
                    fontWeight: 'var(--tw-semibold)',
                    textAlign: 'right',
                  }}
                >
                  E{i}
                </span>
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden relative"
                  style={{ background: 'var(--glass-thick)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 60%, white))`,
                      boxShadow: `0 0 8px color-mix(in srgb, ${color} 50%, transparent)`,
                    }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span
                  className="tabular"
                  style={{
                    fontSize: 'var(--t-sm)',
                    color: 'var(--text-primary)',
                    width: '52px',
                    textAlign: 'right',
                    fontWeight: 'var(--tw-medium)',
                  }}
                >
                  {rate.toFixed(1)}
                  <span style={{ fontSize: 'var(--t-xs)', color: 'var(--text-tertiary)', marginLeft: '2px' }}>Hz</span>
                </span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
