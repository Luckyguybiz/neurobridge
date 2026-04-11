'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import ChartCard from '@/components/dashboard/ChartCard';
import { ELECTRODE_COLORS } from '@/lib/utils';

interface LiveSpike {
  time: number;
  electrode: number;
  amplitude: number;
}

export default function LivePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [connected, setConnected] = useState(false);
  const [spikeCount, setSpikeCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [rates, setRates] = useState<number[]>(new Array(8).fill(0));
  const spikesRef = useRef<LiveSpike[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const animRef = useRef<number>(0);
  const windowSec = 10; // show last 10 seconds

  const connect = useCallback(() => {
    const isDomain = window.location.hostname === 'neurocomputers.io' || window.location.hostname === 'www.neurocomputers.io';
    const wsUrl = isDomain
      ? 'wss://api.neurocomputers.io/ws/spikes'
      : window.location.hostname === 'localhost'
        ? 'ws://localhost:8847/ws/spikes'
        : `ws://${window.location.hostname}:8847/ws/spikes`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newSpikes = data.spikes as LiveSpike[];
      const now = data.timestamp as number;

      // Add to ring buffer, trim old
      spikesRef.current.push(...newSpikes);
      const cutoff = now - windowSec;
      spikesRef.current = spikesRef.current.filter(s => s.time > cutoff);

      setSpikeCount(prev => prev + newSpikes.length);
      setElapsed(Math.floor(now));

      // Update per-electrode rates
      const counts = new Array(8).fill(0);
      for (const s of newSpikes) counts[s.electrode % 8]++;
      setRates(prev => prev.map((r, i) => r * 0.9 + counts[i] * 10 * 0.1));
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, []);

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

      // Background
      const isDark = document.documentElement.classList.contains('dark') || !document.documentElement.classList.contains('light');
      ctx.fillStyle = isDark ? 'rgba(5,6,10,0.95)' : 'rgba(248,249,252,0.95)';
      ctx.fillRect(0, 0, w, h);

      const spikes = spikesRef.current;
      if (spikes.length === 0) {
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Waiting for spikes...', w / 2, h / 2);
        animRef.current = requestAnimationFrame(render);
        return;
      }

      const maxTime = spikes[spikes.length - 1].time;
      const minTime = maxTime - windowSec;
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
        const x = ((spike.time - minTime) / windowSec) * w;
        const y = spike.electrode * bandH + bandH / 2;
        ctx.fillStyle = ELECTRODE_COLORS[spike.electrode % 8];
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="p-3 sm:p-4 space-y-3">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[18px] font-display" style={{ color: 'var(--text-primary)' }}>Live Stream</h1>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Real-time spike streaming via WebSocket</p>
          </div>
          <button
            onClick={connected ? disconnect : connect}
            className={`text-[11px] px-4 py-2 rounded-lg font-medium transition-all ${
              connected
                ? 'bg-red-500/15 border border-red-500/20 text-red-400'
                : 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-cyan-400'
            }`}
          >
            {connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </motion.div>

      {/* Status bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Status</div>
          <div className={`text-[13px] font-medium ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
            {connected ? 'STREAMING' : 'DISCONNECTED'}
          </div>
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Spikes</div>
          <div className="text-[13px] font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>{spikeCount.toLocaleString()}</div>
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Elapsed</div>
          <div className="text-[13px] font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>{elapsed}s</div>
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Window</div>
          <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{windowSec}s</div>
        </div>
      </div>

      {/* Live raster */}
      <ChartCard title="Live Raster Plot" description="Real-time spike events across 8 electrodes">
        <canvas ref={canvasRef} className="w-full rounded-lg" style={{ height: 300 }} />
      </ChartCard>

      {/* Per-electrode rates */}
      <ChartCard title="Firing Rates" description="Real-time rate per electrode (Hz)">
        <div className="space-y-2">
          {rates.map((rate, i) => (
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
