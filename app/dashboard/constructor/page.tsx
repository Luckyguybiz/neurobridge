'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardContext } from '@/lib/dashboard-context';
import * as api from '@/lib/api';
import ChartCard from '@/components/dashboard/ChartCard';

// ─── Protocol definitions ───

interface Protocol {
  id: string;
  name: string;
  origin: string;
  icon: string;
  color: string;
  description: string;
  mechanism: string;
  endpoint: string;
}

const PROTOCOLS: Protocol[] = [
  {
    id: 'center-activity',
    name: 'Center of Activity',
    origin: 'FinalSpark',
    icon: '◎',
    color: '#22d3ee',
    description: 'Shift the center of neural activity by stimulating distant electrodes. The CA formula C = Σ(Fk × Pos) / Σ(Fk) tracks where activity concentrates on the MEA.',
    mechanism: 'Compute CA → find farthest electrode → stimulate → observe CA shift toward stimulus',
    endpoint: '/api/protocols/center-activity',
  },
  {
    id: 'dishbrain-pong',
    name: 'DishBrain Pong',
    origin: 'Cortical Labs',
    icon: '🏓',
    color: '#a78bfa',
    description: 'Simulate DishBrain-style Pong (Kagan et al. 2022). Hits produce structured stimulation, misses produce random noise. Network learns to reduce unpredictability.',
    mechanism: 'Ball position → electrode stimulation. Neural response → paddle movement. Hit = reward. Miss = punishment.',
    endpoint: '/api/protocols/dishbrain-pong',
  },
  {
    id: 'brainoware',
    name: 'Brainoware Reservoir',
    origin: 'Indiana University',
    icon: '🧠',
    color: '#34d399',
    description: 'Use the organoid as a biological reservoir computer. Input signals pass through the living neural network, and a trained readout layer classifies the transformed output.',
    mechanism: 'Input patterns → organoid reservoir → record response → linear readout → classify',
    endpoint: '/api/protocols/brainoware',
  },
  {
    id: 'cartpole',
    name: 'Cart-Pole Coaching',
    origin: 'UCSC',
    icon: '⚖️',
    color: '#fbbf24',
    description: 'Balance a virtual inverted pendulum. The organoid receives state information and its activity controls the cart. Active coaching reinforces successful neurons.',
    mechanism: 'State (angle, velocity) → stimulation. Activity → action. Coach: reinforce neurons active during balance.',
    endpoint: '/api/protocols/cartpole',
  },
  {
    id: 'dopamine',
    name: 'Dopamine Reinforcement',
    origin: 'FinalSpark UV',
    icon: '💡',
    color: '#f472b6',
    description: 'Chemical reward via UV-activated dopamine. When the organoid produces a target pattern, UV light releases dopamine — reinforcing the successful neural pathway.',
    mechanism: 'Activity → check pattern match → if correct: UV pulse → dopamine release → reinforcement',
    endpoint: '/api/protocols/dopamine',
  },
];

// ─── Result display helpers ───

function LearningCurve({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 0.01);
  const w = 100;
  const h = 40;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 60 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Start/end markers */}
      <circle cx={0} cy={h - (data[0] / max) * h} r="2" fill={color} opacity="0.5" />
      <circle cx={w} cy={h - (data[data.length - 1] / max) * h} r="2.5" fill={color} />
    </svg>
  );
}

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between text-[11px] py-1" style={{ borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="tabular-nums font-medium" style={{ color: color || 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

// ─── Protocol Card ───

function ProtocolCard({ protocol, datasetId }: { protocol: Protocol; datasetId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  const runSimulation = useCallback(async () => {
    if (!datasetId) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.apiFetchRaw<Record<string, unknown>>(`${protocol.endpoint}/${datasetId}/simulate`, { method: 'POST' });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    }
    setLoading(false);
  }, [datasetId, protocol.endpoint]);

  // Extract learning curve from result — handle multiple protocol formats
  const learningData = result
    ? (() => {
        // Direct array fields
        const raw = result.hit_rates ?? result.match_rates ?? result.episode_durations ?? result.learning_curve ?? result.ca_distances;
        if (Array.isArray(raw)) return raw.map(Number);
        // Center of Activity: simulation.trajectory → array of {x,y}
        const sim = result.simulation as Record<string, unknown> | undefined;
        const traj = sim?.trajectory;
        if (Array.isArray(traj)) {
          return traj.map((p: Record<string, unknown>) => {
            const x = Number(p.x ?? 0), y = Number(p.y ?? 0);
            return Math.sqrt(x * x + y * y);
          });
        }
        return [];
      })()
    : [];

  // Detect learning across different protocol response formats
  const sim = result?.simulation as Record<string, unknown> | undefined;
  const learningDetected = (() => {
    if (!result) return false;
    // Explicit API field
    if (result.learning_detected === true) return true;
    if (sim?.shift_detected === true) return true;
    // Brainoware: accuracy above chance
    if (result.accuracy != null) {
      const acc = Number(result.accuracy);
      const chance = Number(
        (result.comparison_vs_random as Record<string, unknown>)?.chance_level ?? result.chance_level ?? 0.25
      );
      return acc > chance * 1.5;
    }
    // CartPole / others: any positive improvement
    if (result.improvement_pct != null && Number(result.improvement_pct) > 0) return true;
    if (result.improvement != null && Number(result.improvement) > 0.02) return true;
    // Pong: hit rate above 40%
    if (result.final_hit_rate != null && Number(result.final_hit_rate) > 0.4) return true;
    return false;
  })();

  return (
    <ChartCard title={protocol.name} description={`${protocol.origin} — ${protocol.description.slice(0, 80)}...`}>
      <div className="space-y-3">
        {/* Protocol info */}
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">{protocol.icon}</div>
          <div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{protocol.description}</p>
            <p className="text-[10px] mt-1.5 font-mono" style={{ color: 'var(--text-faint)' }}>{protocol.mechanism}</p>
          </div>
        </div>

        {/* Run button */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={runSimulation}
            disabled={loading || !datasetId}
            className="text-[11px] px-4 py-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-40"
            style={{ background: `${protocol.color}20`, border: `1px solid ${protocol.color}30`, color: protocol.color }}
          >
            {loading ? 'Simulating...' : 'Run Simulation'}
          </button>
          <button
            disabled
            className="text-[11px] px-4 py-2 rounded-lg font-medium transition-all opacity-30 cursor-not-allowed"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Run on Real MEA
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 py-2">
            <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: `${protocol.color}30`, borderTopColor: protocol.color }} />
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Running simulation...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-[11px] py-2 px-3 rounded-lg" style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {/* Learning curve */}
              {learningData.length > 2 && (
                <div>
                  <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>Learning Curve</div>
                  <LearningCurve data={learningData} color={protocol.color} />
                </div>
              )}

              {/* Key metrics */}
              <div>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>Results</div>

                {result.final_hit_rate != null && <StatRow label="Final Hit Rate" value={`${(Number(result.final_hit_rate) * 100).toFixed(1)}%`} color={protocol.color} />}
                {result.accuracy != null && <StatRow label="Accuracy" value={`${(Number(result.accuracy) * 100).toFixed(1)}%`} color={protocol.color} />}
                {result.best_episode != null && <StatRow label="Best Episode" value={`${Number(result.best_episode)}`} color={protocol.color} />}
                {result.improvement_pct != null && <StatRow label="Improvement" value={`${Number(result.improvement_pct).toFixed(1)}%`} color={protocol.color} />}
                {result.improvement != null && result.improvement_pct == null && <StatRow label="Improvement" value={`${(Number(result.improvement) * 100).toFixed(1)}%`} color={protocol.color} />}
                {result.mean_duration != null && <StatRow label="Mean Duration" value={`${Number(result.mean_duration).toFixed(1)} steps`} color={protocol.color} />}
                {result.n_uv_pulses != null && <StatRow label="UV Pulses" value={`${Number(result.n_uv_pulses)}`} color={protocol.color} />}
                {result.final_match_rate != null && <StatRow label="Match Rate" value={`${(Number(result.final_match_rate) * 100).toFixed(1)}%`} color={protocol.color} />}
                {/* Center of Activity results */}
                {(() => {
                  const sim = result.simulation as Record<string, unknown> | undefined;
                  if (!sim) return null;
                  const init = sim.initial_ca as Record<string, number> | undefined;
                  const fin = sim.final_ca as Record<string, number> | undefined;
                  if (!init || !fin) return null;
                  const dist = Math.sqrt(Math.pow(fin.x - init.x, 2) + Math.pow(fin.y - init.y, 2));
                  return (
                    <>
                      <StatRow label="CA Start" value={`(${init.x.toFixed(2)}, ${init.y.toFixed(2)})`} color={protocol.color} />
                      <StatRow label="CA End" value={`(${fin.x.toFixed(2)}, ${fin.y.toFixed(2)})`} color={protocol.color} />
                      <StatRow label="Shift Distance" value={dist.toFixed(3)} color={protocol.color} />
                    </>
                  );
                })()}

                {/* Learning badge */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <div className={`text-[10px] px-2 py-0.5 rounded font-medium ${learningDetected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {learningDetected ? '✓ Learning Detected' : '○ No Clear Learning'}
                  </div>
                  {typeof result.trend === 'string' && result.trend && (
                    <div className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                      Trend: {result.trend}
                    </div>
                  )}
                  {typeof result._computation_time_ms === 'number' && (
                    <span className="text-[9px] tabular-nums" style={{ color: 'var(--text-faint)' }}>{result._computation_time_ms.toFixed(0)}ms</span>
                  )}
                </div>
                {!learningDetected && (
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
                    Try a longer dataset (120s) or real MEA data for more pronounced learning effects.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ChartCard>
  );
}

// ─── Page ───

export default function ConstructorPage() {
  const { datasetId, status, spikes } = useDashboardContext();
  const [selected, setSelected] = useState<string | null>(null);

  if (status === 'loading' && spikes.length === 0) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  const filteredProtocols = selected ? PROTOCOLS.filter(p => p.id === selected) : PROTOCOLS;

  return (
    <div className="p-3 sm:p-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-4">
        <h1 className="text-[16px] sm:text-[18px] font-display" style={{ color: 'var(--text-primary)' }}>Experiment Constructor</h1>
        <p className="text-[11px] sm:text-[12px] mt-0.5 break-words" style={{ color: 'var(--text-muted)' }}>
          5 learning protocols from DishBrain, Brainoware, UCSC, and FinalSpark · {datasetId ? <>Dataset: <span className="font-mono text-[10px] break-all">{datasetId}</span></> : 'Generate data first'}
        </p>
      </motion.div>

      {/* Protocol filter tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button
          onClick={() => setSelected(null)}
          className={`text-[10px] px-3 py-1.5 rounded-lg transition-all ${!selected ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-cyan-400' : ''}`}
          style={selected ? { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' } : undefined}
        >
          All Protocols
        </button>
        {PROTOCOLS.map(p => (
          <button
            key={p.id}
            onClick={() => setSelected(selected === p.id ? null : p.id)}
            className={`text-[10px] px-3 py-1.5 rounded-lg transition-all ${selected === p.id ? 'border' : ''}`}
            style={selected === p.id
              ? { background: `${p.color}15`, borderColor: `${p.color}30`, color: p.color }
              : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
            }
          >
            {p.icon} {p.name}
          </button>
        ))}
      </div>

      {/* Protocol cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredProtocols.map((protocol, i) => (
          <motion.div
            key={protocol.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
          >
            <ProtocolCard protocol={protocol} datasetId={datasetId} />
          </motion.div>
        ))}
      </div>

      {/* No data warning */}
      {!datasetId && (
        <div className="mt-6 p-4 rounded-xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Generate or load data first to run simulations. Click <strong>30s</strong> or <strong>FinalSpark</strong> in the header.
          </p>
        </div>
      )}
    </div>
  );
}
