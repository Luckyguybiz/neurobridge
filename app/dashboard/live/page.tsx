'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDashboardContext } from '@/lib/dashboard-context';
import ChartCard from '@/components/dashboard/ChartCard';
import { ELECTRODE_COLORS } from '@/lib/utils';

const WINDOW_SEC = 10;

export default function LivePage() {
  const { live, liveConnect, livePause, liveResume, liveDisconnect } = useDashboardContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;

      const isDark = document.documentElement.classList.contains('dark') || !document.documentElement.classList.contains('light');
      ctx.fillStyle = isDark ? 'rgba(5,6,10,0.95)' : 'rgba(248,249,252,0.95)';
      ctx.fillRect(0, 0, w, h);

      const spikes = live.spikes;
      if (spikes.length === 0) {
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(
          live.connected ? 'Waiting for spikes...' : 'Press Connect to start streaming',
          w / 2, h / 2
        );
        animRef.current = requestAnimationFrame(render);
        return;
      }

      const maxTime = spikes[spikes.length - 1].time;
      const minTime = maxTime - WINDOW_SEC;
      const bandH = h / 8;

      // Grid lines
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * bandH);
        ctx.lineTo(w, i * bandH);
        ctx.stroke();
      }

      // Electrode labels
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
      ctx.font = '9px system-ui';
      ctx.textAlign = 'left';
      for (let i = 0; i < 8; i++) {
        ctx.fillText(`E${i}`, 4, i * bandH + 12);
      }

      // Spikes
      for (const spike of spikes) {
        const x = ((spike.time - minTime) / WINDOW_SEC) * w;
        const y = spike.electrode * bandH + bandH / 2;
        ctx.fillStyle = ELECTRODE_COLORS[spike.electrode % 8];
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Paused overlay
      if (live.paused) {
        ctx.fillStyle = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
        ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('⏸ PAUSED', w / 2, h / 2);
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [live.spikes, live.connected, live.paused]);

  const statusText = live.paused ? 'PAUSED' : live.connected ? 'STREAMING' : live.spikeCount > 0 ? 'STOPPED' : 'DISCONNECTED';
  const statusColor = live.paused ? 'text-amber-400' : live.connected ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="p-3 sm:p-4 space-y-3">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div>
            <h1 className="text-[16px] sm:text-[18px] font-display" style={{ color: 'var(--text-primary)' }}>Live Stream</h1>
            <p className="text-[11px] sm:text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Real-time spike streaming via WebSocket</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Connect / Resume */}
            {!live.connected ? (
              <button
                onClick={liveConnect}
                className="text-[11px] px-4 py-2 rounded-lg font-medium transition-all bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-cyan-400 hover:border-cyan-400/40 min-h-[36px] whitespace-nowrap"
              >
                Connect
              </button>
            ) : live.paused ? (
              <button
                onClick={liveResume}
                className="text-[11px] px-4 py-2 rounded-lg font-medium transition-all bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 hover:border-emerald-400/40 min-h-[36px] whitespace-nowrap"
              >
                ▶ Resume
              </button>
            ) : (
              <button
                onClick={livePause}
                className="text-[11px] px-4 py-2 rounded-lg font-medium transition-all bg-amber-500/15 border border-amber-500/20 text-amber-400 hover:border-amber-400/40 min-h-[36px] whitespace-nowrap"
              >
                ⏸ Pause
              </button>
            )}
            {/* Disconnect — only when connected or paused */}
            {live.connected && (
              <button
                onClick={liveDisconnect}
                className="text-[11px] px-3 py-2 rounded-lg font-medium transition-all bg-red-500/10 border border-red-500/15 text-red-400/70 hover:text-red-400 hover:border-red-400/30 min-h-[36px] min-w-[36px]"
                aria-label="Disconnect"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Status bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Status</div>
          <div className={`text-[13px] font-medium ${statusColor}`}>{statusText}</div>
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Spikes</div>
          <div className="text-[13px] font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>{live.spikeCount.toLocaleString()}</div>
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Elapsed</div>
          <div className="text-[13px] font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>{live.elapsed}s</div>
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Window</div>
          <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{WINDOW_SEC}s</div>
        </div>
      </div>

      {/* Live raster */}
      <ChartCard title="Live Raster Plot" description="Real-time spike events across 8 electrodes">
        <canvas ref={canvasRef} className="w-full rounded-lg h-[220px] sm:h-[300px]" />
      </ChartCard>

      {/* Per-electrode rates */}
      <ChartCard title="Firing Rates" description="Real-time rate per electrode (Hz)">
        <div className="space-y-2">
          {live.rates.map((rate, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] w-6 tabular-nums" style={{ color: ELECTRODE_COLORS[i] }}>E{i}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: ELECTRODE_COLORS[i], width: `${Math.min(100, rate * 2)}%` }}
                  animate={{ width: `${Math.min(100, rate * 2)}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>
              <span className="text-[10px] tabular-nums w-10 text-right" style={{ color: 'var(--text-muted)' }}>{rate.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
