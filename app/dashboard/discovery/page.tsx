'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDashboardContext } from '@/lib/dashboard-context';
import * as api from '@/lib/api';
import ChartCard from '@/components/dashboard/ChartCard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
}

function JsonRows({ data, max = 10 }: { data: Record<string, unknown>; max?: number }) {
  const entries = Object.entries(data).slice(0, max);
  return (
    <div className="space-y-1 font-mono text-[10px] mt-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2 py-0.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="w-32 truncate shrink-0" style={{ color: 'var(--text-muted)' }}>{k}:</span>
          <span className="truncate" style={{ color: 'var(--accent-cyan)' }}>
            {typeof v === 'number'   ? (Number.isInteger(v) ? v : Number(v).toFixed(5)) :
             typeof v === 'boolean'  ? (v ? '✓ true' : '✗ false') :
             typeof v === 'string'   ? v :
             Array.isArray(v)        ? `[${(v as unknown[]).length} items]` :
             typeof v === 'object' && v !== null ? `{${Object.keys(v).length} keys}` :
             String(v)}
          </span>
        </div>
      ))}
      {Object.keys(data).length > max && (
        <div style={{ color: 'var(--text-faint)' }}>+ {Object.keys(data).length - max} more</div>
      )}
    </div>
  );
}

// ─── Emergence (Phi) ─────────────────────────────────────────────────────────

function EmergenceCard({ data }: { data: Record<string, unknown> }) {
  const phi = Number(data.phi ?? data.phi_value ?? data.causal_emergence ?? 0);

  const label = phi > 2 ? 'Very high — strong macro-level causation'
              : phi > 1 ? 'High — significant causal emergence'
              : phi > 0.5 ? 'Moderate — partial system integration'
              : phi > 0.1 ? 'Low — mostly independent subsystems'
              :             'Minimal — near-decomposable network';

  const barPct = Math.min(100, (phi / 3) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="text-5xl font-bold tabular-nums text-cyan-400">{phi.toFixed(4)}</div>
        <div className="pb-1">
          <div className="text-[10px] text-white/25 uppercase tracking-widest">bits · Φ</div>
        </div>
      </div>

      {/* Visual bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] text-white/25">
          <span>0</span><span>1</span><span>2</span><span>3+</span>
        </div>
        <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden relative">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${barPct}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <div className="text-[11px] text-white/40 leading-relaxed">{label}</div>
      <JsonRows data={data} max={6} />
    </div>
  );
}

// ─── Predictive Coding ────────────────────────────────────────────────────────

function PredictiveCodingCard({ data }: { data: Record<string, unknown> }) {
  const active    = Boolean(data.predictive_coding_active ?? data.is_predictive ?? data.active ?? false);
  const freeEnergy = Number(data.free_energy ?? data.prediction_error ?? 0);
  const evidence   = Number(data.evidence ?? data.confidence ?? 0);

  return (
    <div className="space-y-4">
      {/* YES/NO badge */}
      <div className="flex items-center gap-3">
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-xl border text-[15px] font-bold
          ${active
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
          }
        `}>
          <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-red-400'} ${active ? 'animate-pulse' : ''}`} />
          {active ? 'ACTIVE' : 'NOT DETECTED'}
        </div>
      </div>

      <div className="text-[11px] text-white/40 leading-relaxed">
        {active
          ? 'Organoid exhibits free energy minimization — actively predicts and corrects sensory inputs, consistent with predictive processing theory.'
          : 'No evidence of predictive processing. Neural activity does not show hierarchical prediction-error minimization patterns.'}
      </div>

      {(freeEnergy > 0 || evidence > 0) && (
        <div className="flex gap-4">
          {freeEnergy > 0 && (
            <div>
              <div className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Free Energy</div>
              <div className="text-[15px] font-medium text-amber-400 tabular-nums">{freeEnergy.toFixed(4)}</div>
            </div>
          )}
          {evidence > 0 && (
            <div>
              <div className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Evidence</div>
              <div className="text-[15px] font-medium text-violet-400 tabular-nums">{(evidence * 100).toFixed(1)}%</div>
            </div>
          )}
        </div>
      )}

      <JsonRows data={data} max={6} />
    </div>
  );
}

// ─── Attractors ───────────────────────────────────────────────────────────────

function AttractorsCard({ data }: { data: Record<string, unknown> }) {
  const attractors  = (data.attractors ?? []) as Array<Record<string, unknown>>;
  const nAttractors = Number(data.n_attractors ?? attractors.length);
  const nMemory     = Number(data.n_memory_candidates ?? data.memory_candidates ?? 0);
  const stability   = Number(data.mean_stability ?? data.stability ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        <div>
          <div className="text-4xl font-bold text-violet-400 tabular-nums">{nAttractors}</div>
          <div className="text-[10px] text-white/30 mt-0.5">Attractors</div>
        </div>
        <div className="pl-4 border-l border-white/[0.06]">
          <div className="text-4xl font-bold text-cyan-400 tabular-nums">{nMemory}</div>
          <div className="text-[10px] text-white/30 mt-0.5">Memory Candidates</div>
        </div>
      </div>

      {stability > 0 && (
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span style={{ color: "var(--text-muted)" }}>Mean Attractor Stability</span>
            <span className="text-white/60 tabular-nums">{(stability * 100).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${stability * 100}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      )}

      {/* Individual attractors */}
      {attractors.slice(0, 4).map((a, i) => (
        <div key={i} className="flex gap-3 text-[11px] py-1.5 border-b border-white/[0.04]">
          <span className="text-white/20 w-4">#{i + 1}</span>
          {Object.entries(a).slice(0, 3).map(([k, v]) => (
            <span key={k}>
              <span style={{ color: "var(--text-faint)" }}>{k}: </span>
              <span className="text-violet-400/70">
                {typeof v === 'number' ? Number(v).toFixed(3) : String(v)}
              </span>
            </span>
          ))}
        </div>
      ))}

      <JsonRows data={data} max={4} />
    </div>
  );
}

// ─── Phase Transitions ────────────────────────────────────────────────────────

function PhaseTransitionsCard({ data }: { data: Record<string, unknown> }) {
  const transitions = (data.transitions ?? data.phase_transitions ?? []) as Array<Record<string, unknown>>;
  const nTrans      = Number(data.n_transitions ?? transitions.length);
  const maxMag      = Math.max(...transitions.map((t) => Number(t.score ?? t.magnitude ?? t.strength ?? 0)), 0.001);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <div className="text-4xl font-bold text-amber-400 tabular-nums">{nTrans}</div>
        <div className="text-[12px] text-white/30">transitions detected</div>
      </div>

      <div className="text-[11px] text-white/40">
        {nTrans > 0
          ? `Network reorganized ${nTrans} time${nTrans !== 1 ? 's' : ''} during recording — optimal stimulation windows.`
          : 'No significant phase transitions detected in this recording window.'}
      </div>

      {/* Timeline bars */}
      {transitions.length > 0 && (
        <div className="space-y-1.5 mt-2">
          <div className="text-[9px] text-white/20 uppercase tracking-widest">Transition Timeline</div>
          {transitions.slice(0, 6).map((t, i) => {
            const time = Number(t.time ?? t.time_sec ?? t.t ?? 0);
            const mag  = Number(t.score ?? t.magnitude ?? t.strength ?? 0);
            const pct  = (mag / maxMag) * 100;
            return (
              <div key={i} className="flex items-center gap-3 text-[10px]">
                <span className="text-white/30 w-12 tabular-nums shrink-0">{time.toFixed(2)}s</span>
                <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-amber-400/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="text-amber-400/60 w-12 tabular-nums shrink-0">{mag.toFixed(3)}</span>
              </div>
            );
          })}
          {transitions.length > 6 && (
            <div className="text-[10px] text-white/20">+ {transitions.length - 6} more...</div>
          )}
        </div>
      )}

      <JsonRows data={data} max={4} />
    </div>
  );
}

// ─── Replay Events ────────────────────────────────────────────────────────────

function ReplayCard({ data }: { data: Record<string, unknown> }) {
  const events     = (data.replay_events ?? data.events ?? []) as Array<Record<string, unknown>>;
  const nEvents    = Number(data.n_replay_events ?? data.n_events ?? events.length);
  const replayRate = Number(data.replay_rate ?? data.events_per_min ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        <div>
          <div className="text-4xl font-bold text-pink-400 tabular-nums">{nEvents}</div>
          <div className="text-[10px] text-white/30 mt-0.5">Replay Events</div>
        </div>
        {replayRate > 0 && (
          <div className="pl-4 border-l border-white/[0.06]">
            <div className="text-4xl font-bold text-violet-400 tabular-nums">{replayRate.toFixed(1)}</div>
            <div className="text-[10px] text-white/30 mt-0.5">Events/min</div>
          </div>
        )}
      </div>

      <div className="text-[11px] text-white/40 leading-relaxed">
        {nEvents > 0
          ? `Detected ${nEvents} offline memory consolidation event${nEvents !== 1 ? 's' : ''}. The organoid replays prior activity patterns during quiescent periods.`
          : 'No clear replay events detected. Recording may need longer duration or quiescent periods.'}
      </div>

      {events.slice(0, 3).map((ev, i) => (
        <div key={i} className="text-[10px] font-mono py-1.5 px-2 rounded bg-white/[0.02] border border-white/[0.04]">
          {Object.entries(ev).slice(0, 3).map(([k, v]) => (
            <span key={k} className="mr-3">
              <span style={{ color: "var(--text-faint)" }}>{k}: </span>
              <span className="text-pink-400/60">{typeof v === 'number' ? Number(v).toFixed(3) : String(v)}</span>
            </span>
          ))}
        </div>
      ))}

      <JsonRows data={data} max={5} />
    </div>
  );
}

// ─── Multiscale Complexity ────────────────────────────────────────────────────

function MultiscaleCard({ data }: { data: Record<string, unknown> }) {
  const complexities = (data.complexities ?? data.complexity_values ?? data.mse_values ?? []) as number[];
  const timescales   = (data.timescales ?? data.scales ?? []) as number[];
  const meanComp     = Number(data.mean_complexity ?? data.mean ?? (complexities.length > 0 ? complexities.reduce((a, b) => a + b, 0) / complexities.length : 0));
  const maxComp      = Math.max(...complexities, 0.001);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-bold text-emerald-400 tabular-nums">{meanComp.toFixed(4)}</div>
        <div className="text-[11px] text-white/30">mean complexity</div>
      </div>

      {complexities.length > 0 && (
        <div className="space-y-2">
          <div className="text-[9px] text-white/20 uppercase tracking-widest">
            Complexity at {complexities.length} timescales
          </div>
          <div className="flex items-end gap-0.5 h-16">
            {complexities.map((val, i) => {
              const pct = (val / maxComp) * 100;
              const scale = timescales[i] ?? i + 1;
              const isActive = pct > 60;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end group relative">
                  <div
                    className={`w-full rounded-sm transition-all ${isActive ? 'bg-emerald-400/70' : 'bg-emerald-400/25'}`}
                    style={{ height: `${Math.max(4, pct)}%` }}
                  />
                  {i % 3 === 0 && (
                    <div className="absolute -bottom-4 text-[8px] text-white/20 tabular-nums">{scale}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-white/20 mt-4">
            <span>Fine (fast)</span><span>Coarse (slow)</span>
          </div>
        </div>
      )}

      <div className="text-[11px] text-white/40 leading-relaxed">
        {meanComp > 0.5
          ? 'High multi-timescale complexity — rich information processing across temporal hierarchies.'
          : meanComp > 0.2
            ? 'Moderate complexity — information integration across several timescales.'
            : 'Low complexity — activity may be too regular or too random.'}
      </div>

      <JsonRows data={data} max={5} />
    </div>
  );
}

// ─── Sleep-Wake ─────────────────────────────────────────────────────────────

function SleepWakeCard({ data }: { data: Record<string, unknown> }) {
  const upDown = (data.up_down_states ?? {}) as Record<string, unknown>;
  const upFraction = Number(upDown.up_fraction ?? 0);
  const nTransitions = Number(upDown.n_transitions ?? 0);
  const score = Number(data.sleep_like_score ?? 0);
  const hasUpDown = Boolean(data.has_up_down_states);
  const hasSlowWaves = Boolean(data.has_slow_waves);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold tabular-nums text-violet-400">{(score * 100).toFixed(0)}%</div>
        <div className="text-[11px] text-white/40">Sleep-like score</div>
      </div>

      {/* UP/DOWN state bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-white/30">
          <span>DOWN (silent)</span>
          <span>UP (active)</span>
        </div>
        <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden flex">
          <div className="h-full bg-indigo-900/50" style={{ width: `${(1 - upFraction) * 100}%` }} />
          <div className="h-full bg-gradient-to-r from-cyan-500/40 to-violet-500/40" style={{ width: `${upFraction * 100}%` }} />
        </div>
        <div className="flex justify-between text-[10px] tabular-nums text-white/25">
          <span>{((1 - upFraction) * 100).toFixed(0)}%</span>
          <span>{(upFraction * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="px-2 py-1.5 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Transitions</div>
          <div className="text-white/70 tabular-nums">{nTransitions}</div>
        </div>
        <div className="px-2 py-1.5 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Indicators</div>
          <div className="text-white/70">
            {hasUpDown ? '✓' : '✗'} UP/DOWN
            {' '}
            {hasSlowWaves ? '✓' : '✗'} Slow waves
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Habituation ────────────────────────────────────────────────────────────

function HabituationCard({ data }: { data: Record<string, unknown> }) {
  const detected = Boolean(data.habituation_detected);
  const nEvents = Number(data.n_events ?? 0);
  const decreasePct = Number(data.amplitude_decrease_pct ?? 0);
  const fit = (data.decay_fit ?? {}) as Record<string, unknown>;
  const rSquared = Number(fit.r_squared ?? 0);
  const amplitudes = (data.event_amplitudes ?? []) as number[];

  // Mini sparkline of event amplitudes
  const maxAmp = Math.max(...amplitudes.slice(0, 30), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={`text-lg font-bold ${detected ? 'text-emerald-400' : 'text-white/40'}`}>
          {detected ? 'HABITUATION DETECTED' : 'NOT DETECTED'}
        </div>
      </div>

      {amplitudes.length > 2 && (
        <div className="flex items-end gap-px h-10">
          {amplitudes.slice(0, 30).map((a, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-gradient-to-t from-cyan-500/30 to-violet-500/30"
              style={{ height: `${(a / maxAmp) * 100}%`, opacity: 0.3 + 0.7 * (1 - i / 30) }}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="px-2 py-1 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Events</div>
          <div className="text-white/60 tabular-nums">{nEvents}</div>
        </div>
        <div className="px-2 py-1 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Decrease</div>
          <div className="text-white/60 tabular-nums">{decreasePct.toFixed(1)}%</div>
        </div>
        <div className="px-2 py-1 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>R²</div>
          <div className="text-white/60 tabular-nums">{rSquared.toFixed(3)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Metastability ──────────────────────────────────────────────────────────

function MetastabilityCard({ data }: { data: Record<string, unknown> }) {
  const kuramoto = (data.kuramoto ?? {}) as Record<string, unknown>;
  const kMean = Number(kuramoto.kuramoto_mean ?? 0);
  const metaIndex = Number(kuramoto.metastability_index ?? 0);
  const syncLevel = String(kuramoto.synchronization_level ?? 'unknown');
  const isMetastable = Boolean(data.is_metastable);
  const transitions = (data.state_transitions ?? {}) as Record<string, unknown>;
  const nStates = Number(transitions.n_states ?? 0);
  const nTrans = Number(transitions.n_transitions ?? 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-2xl font-bold tabular-nums text-cyan-400">{kMean.toFixed(3)}</div>
          <div className="text-[10px] text-white/25">Kuramoto R (synchronization)</div>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${
          isMetastable ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.05] text-white/40'
        }`}>
          {isMetastable ? 'METASTABLE' : syncLevel.toUpperCase()}
        </div>
      </div>

      {/* Synchronization bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] text-white/20">
          <span>Desync</span><span>Critical</span><span>Full sync</span>
        </div>
        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${kMean * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
          />
          {/* Metastable zone marker */}
          <div className="absolute top-0 left-[30%] w-[30%] h-full border-x border-emerald-400/20" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="px-2 py-1 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Meta Index</div>
          <div className="text-white/60 tabular-nums">{metaIndex.toFixed(3)}</div>
        </div>
        <div className="px-2 py-1 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>States</div>
          <div className="text-white/60 tabular-nums">{nStates}</div>
        </div>
        <div className="px-2 py-1 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Transitions</div>
          <div className="text-white/60 tabular-nums">{nTrans}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Consciousness ──────────────────────────────────────────────────────────

function ConsciousnessCard({ data }: { data: Record<string, unknown> }) {
  const score = Number(data.consciousness_score ?? (data.sentience_risk as Record<string, unknown>)?.overall_score ?? 0);
  const riskLevel = String(data.overall_risk_level ?? data.interpretation ?? 'unknown');
  const indicators = (data.consciousness_indicators ?? {}) as Record<string, unknown>;

  const indicatorEntries = Object.entries(
    typeof indicators === 'object' && indicators !== null ? indicators : {}
  ).filter(([k]) => !k.startsWith('_') && k !== 'summary');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          {/* Circular gauge */}
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke={score > 0.6 ? '#f87171' : score > 0.3 ? '#fbbf24' : '#34d399'}
              strokeWidth="3"
              strokeDasharray={`${score * 94.2} 94.2`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-bold tabular-nums text-white/80">{(score * 100).toFixed(0)}</span>
          </div>
        </div>
        <div>
          <div className={`text-sm font-bold ${
            riskLevel === 'CRITICAL' || riskLevel === 'high' ? 'text-red-400' :
            riskLevel === 'HIGH' || riskLevel === 'moderate' ? 'text-amber-400' :
            'text-emerald-400'
          }`}>
            {riskLevel.toUpperCase()} RISK
          </div>
          <div className="text-[10px] text-white/30">Consciousness assessment</div>
        </div>
      </div>

      {indicatorEntries.length > 0 && (
        <div className="space-y-1">
          {indicatorEntries.slice(0, 6).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-[10px] py-0.5">
              <span className="text-white/30 capitalize">{k.replace(/_/g, ' ')}</span>
              <span className={typeof v === 'boolean'
                ? (v ? 'text-emerald-400' : 'text-white/20')
                : 'text-cyan-400/60 tabular-nums'
              }>
                {typeof v === 'boolean' ? (v ? '● Yes' : '○ No') :
                 typeof v === 'number' ? Number(v).toFixed(3) : String(v)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Turing Test ───────────────────────────────────────────────────────────

function TuringTestCard({ data }: { data: Record<string, unknown> }) {
  const score = Number(data.biological_realism_score ?? 0);
  const verdict = String(data.verdict ?? data.classification ?? '—');
  const comparison = (data.feature_comparison ?? data.comparisons ?? {}) as Record<string, Record<string, unknown>>;
  const metrics = Object.keys(comparison);

  const getColor = (s: number) => s >= 0.8 ? 'text-emerald-400' : s >= 0.5 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold tabular-nums text-cyan-400">{(score * 100).toFixed(1)}%</div>
        <div>
          <div className="text-[10px] text-white/25 uppercase tracking-widest">Biological Realism</div>
          <div className={`text-[13px] font-medium ${getColor(score)}`}>{verdict}</div>
        </div>
      </div>

      {/* Realism bar */}
      <div className="space-y-1">
        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${score * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Feature comparison table */}
      {metrics.length > 0 && (
        <div className="space-y-1 mt-2">
          <div className="flex gap-2 text-[9px] text-white/25 uppercase tracking-widest border-b border-white/[0.06] pb-1">
            <span className="w-24 shrink-0">Metric</span>
            <span className="flex-1 text-center">Real</span>
            <span className="flex-1 text-center">Poisson</span>
            <span className="flex-1 text-center">LIF</span>
          </div>
          {metrics.slice(0, 8).map((metric) => {
            const row = comparison[metric] ?? {};
            return (
              <div key={metric} className="flex gap-2 text-[10px] py-0.5 border-b border-white/[0.03]">
                <span className="text-white/30 w-24 shrink-0 truncate capitalize">{metric.replace(/_/g, ' ')}</span>
                <span className="flex-1 text-center text-emerald-400/60 tabular-nums">
                  {typeof row.real === 'number' ? Number(row.real).toFixed(3) : String(row.real ?? '—')}
                </span>
                <span className="flex-1 text-center text-amber-400/60 tabular-nums">
                  {typeof row.poisson === 'number' ? Number(row.poisson).toFixed(3) : String(row.poisson ?? '—')}
                </span>
                <span className="flex-1 text-center text-violet-400/60 tabular-nums">
                  {typeof row.lif === 'number' ? Number(row.lif).toFixed(3) : String(row.lif ?? '—')}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <JsonRows data={data} max={4} />
    </div>
  );
}

// ─── Energy Landscape ──────────────────────────────────────────────────────

function EnergyLandscapeCard({ data }: { data: Record<string, unknown> }) {
  const nAttractors = Number(data.n_attractors ?? 0);
  const energyRange = Number(data.energy_range ?? 0);
  const meanEnergy = Number(data.mean_energy ?? 0);
  const modelType = String(data.model_type ?? data.model ?? '—');

  return (
    <div className="space-y-3">
      <div className="flex gap-6">
        <div>
          <div className="text-4xl font-bold text-amber-400 tabular-nums">{nAttractors}</div>
          <div className="text-[10px] text-white/30 mt-0.5">Attractors</div>
        </div>
        <div className="pl-4 border-l border-white/[0.06]">
          <div className="text-2xl font-bold text-cyan-400 tabular-nums">{meanEnergy.toFixed(3)}</div>
          <div className="text-[10px] text-white/30 mt-0.5">Mean Energy</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="px-2 py-1.5 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Energy Range</div>
          <div className="text-white/70 tabular-nums">{energyRange.toFixed(3)}</div>
        </div>
        <div className="px-2 py-1.5 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Model Type</div>
          <div className="text-white/70 capitalize">{modelType.replace(/_/g, ' ')}</div>
        </div>
      </div>

      <JsonRows data={data} max={6} />
    </div>
  );
}

// ─── Welfare Report ────────────────────────────────────────────────────────

function WelfareCard({ data }: { data: Record<string, unknown> }) {
  const score = Number(data.welfare_score ?? 0);
  const level = String(data.welfare_level ?? data.level ?? '—');
  const recommendations = (data.recommendations ?? []) as string[];
  const monitoringStatus = String(data.monitoring_status ?? data.monitoring ?? '—');

  const badgeColor = score >= 0.7 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                   : score >= 0.4 ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                   :                'bg-red-500/15 text-red-400 border-red-500/20';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold tabular-nums text-white/80">{(score * 100).toFixed(0)}%</div>
        <div className={`px-3 py-1 rounded-lg border text-[12px] font-bold ${badgeColor}`}>
          {level.toUpperCase()}
        </div>
      </div>

      {/* Welfare bar */}
      <div className="space-y-1">
        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              score >= 0.7 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
              score >= 0.4 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                             'bg-gradient-to-r from-red-500 to-red-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${score * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <div className="px-2 py-1.5 rounded-md bg-white/[0.03] text-[11px]">
        <div style={{ color: "var(--text-faint)" }}>Monitoring Status</div>
        <div className="text-white/70 capitalize">{monitoringStatus.replace(/_/g, ' ')}</div>
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] text-white/25 uppercase tracking-widest">Recommendations</div>
          {recommendations.slice(0, 5).map((rec, i) => (
            <div key={i} className="flex gap-2 text-[10px] py-0.5">
              <span className="text-white/20 shrink-0">-</span>
              <span className="text-white/50">{rec}</span>
            </div>
          ))}
        </div>
      )}

      <JsonRows data={data} max={4} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type AnalysisState = {
  data: Record<string, unknown> | null;
  error: string;
};

export default function DiscoveryPage() {
  const { datasetId, status, spikes } = useDashboardContext();

  const [emergence,      setEmergence]      = useState<AnalysisState>({ data: null, error: '' });
  const [predictive,     setPredictive]     = useState<AnalysisState>({ data: null, error: '' });
  const [attractors,     setAttractors]     = useState<AnalysisState>({ data: null, error: '' });
  const [phase,          setPhase]          = useState<AnalysisState>({ data: null, error: '' });
  const [replay,         setReplay]         = useState<AnalysisState>({ data: null, error: '' });
  const [multiscale,     setMultiscale]     = useState<AnalysisState>({ data: null, error: '' });
  const [sleepWake,      setSleepWake]      = useState<AnalysisState>({ data: null, error: '' });
  const [habituation,    setHabituation]    = useState<AnalysisState>({ data: null, error: '' });
  const [metastability,  setMetastability]  = useState<AnalysisState>({ data: null, error: '' });
  const [consciousness,  setConsciousness]  = useState<AnalysisState>({ data: null, error: '' });
  const [turingTest,     setTuringTest]     = useState<AnalysisState>({ data: null, error: '' });
  const [energyLand,     setEnergyLand]     = useState<AnalysisState>({ data: null, error: '' });
  const [welfare,        setWelfare]        = useState<AnalysisState>({ data: null, error: '' });
  const [homeostasis,   setHomeostasis]   = useState<AnalysisState>({ data: null, error: '' });
  const [forgetting,    setForgetting]    = useState<AnalysisState>({ data: null, error: '' });
  const [transferL,     setTransferL]     = useState<AnalysisState>({ data: null, error: '' });
  const [morphology,    setMorphology]    = useState<AnalysisState>({ data: null, error: '' });

  useEffect(() => {
    if (!datasetId) return;

    const fetch = (fn: () => Promise<Record<string, unknown>>, setter: (s: AnalysisState) => void) => {
      fn()
        .then((data) => setter({ data, error: '' }))
        .catch((e)   => setter({ data: null, error: e instanceof Error ? e.message : 'Failed' }));
    };

    fetch(() => api.getEmergence(datasetId),        setEmergence);
    fetch(() => api.getPredictiveCoding(datasetId), setPredictive);
    fetch(() => api.getAttractors(datasetId),       setAttractors);
    fetch(() => api.getPhaseTransitions(datasetId), setPhase);
    fetch(() => api.getReplay(datasetId),           setReplay);
    fetch(() => api.getMultiscale(datasetId),       setMultiscale);
    fetch(() => api.getSleepWake(datasetId),        setSleepWake);
    fetch(() => api.getHabituation(datasetId),      setHabituation);
    fetch(() => api.getMetastability(datasetId),    setMetastability);
    fetch(() => api.getConsciousness(datasetId),    setConsciousness);
    fetch(() => api.getTuringTest(datasetId),       setTuringTest);
    fetch(() => api.getEnergyLandscape(datasetId),  setEnergyLand);
    fetch(() => api.getWelfare(datasetId),          setWelfare);
    fetch(() => api.getHomeostasis(datasetId),      setHomeostasis);
    fetch(() => api.getForgetting(datasetId),       setForgetting);
    fetch(() => api.getTransferLearning(datasetId), setTransferL);
    fetch(() => api.getMorphology(datasetId),       setMorphology);
  }, [datasetId]);

  if (status === 'loading' && spikes.length === 0) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (spikes.length === 0) return null;

  const cards = [
    {
      title: 'Causal Emergence (Φ)',
      desc:  'Integrated information — consciousness-like metric',
      state: emergence,
      render: (d: Record<string, unknown>) => <EmergenceCard data={d} />,
      wide: true,
    },
    {
      title: 'Predictive Coding',
      desc:  'Free energy minimization — does the organoid predict?',
      state: predictive,
      render: (d: Record<string, unknown>) => <PredictiveCodingCard data={d} />,
      wide: false,
    },
    {
      title: 'Attractor Landscape',
      desc:  'Memory as dynamical attractors (Hopfield theory)',
      state: attractors,
      render: (d: Record<string, unknown>) => <AttractorsCard data={d} />,
      wide: false,
    },
    {
      title: 'Phase Transitions',
      desc:  'Neural reorganization events + stimulation windows',
      state: phase,
      render: (d: Record<string, unknown>) => <PhaseTransitionsCard data={d} />,
      wide: false,
    },
    {
      title: 'Neural Replay',
      desc:  'Offline memory consolidation events',
      state: replay,
      render: (d: Record<string, unknown>) => <ReplayCard data={d} />,
      wide: false,
    },
    {
      title: 'Multiscale Complexity',
      desc:  'Information complexity across 12 temporal timescales',
      state: multiscale,
      render: (d: Record<string, unknown>) => <MultiscaleCard data={d} />,
      wide: false,
    },
    {
      title: 'Sleep-Wake Cycles',
      desc:  'UP/DOWN state detection + slow-wave oscillations',
      state: sleepWake,
      render: (d: Record<string, unknown>) => <SleepWakeCard data={d} />,
      wide: false,
    },
    {
      title: 'Habituation',
      desc:  'Response decay to repeated patterns — simplest learning',
      state: habituation,
      render: (d: Record<string, unknown>) => <HabituationCard data={d} />,
      wide: false,
    },
    {
      title: 'Metastability',
      desc:  'Kuramoto synchronization + brain-like state switching',
      state: metastability,
      render: (d: Record<string, unknown>) => <MetastabilityCard data={d} />,
      wide: false,
    },
    {
      title: 'Consciousness Assessment',
      desc:  'Composite score: PCI + recurrence + Phi + ethical flags',
      state: consciousness,
      render: (d: Record<string, unknown>) => <ConsciousnessCard data={d} />,
      wide: false,
    },
    {
      title: 'Turing Test',
      desc:  'Biological realism score — real vs Poisson vs LIF comparison',
      state: turingTest,
      render: (d: Record<string, unknown>) => <TuringTestCard data={d} />,
      wide: true,
    },
    {
      title: 'Energy Landscape',
      desc:  'Attractor basins, energy surface + Hopfield model fit',
      state: energyLand,
      render: (d: Record<string, unknown>) => <EnergyLandscapeCard data={d} />,
      wide: false,
    },
    {
      title: 'Welfare Report',
      desc:  'Organoid welfare assessment + monitoring recommendations',
      state: welfare,
      render: (d: Record<string, unknown>) => <WelfareCard data={d} />,
      wide: false,
    },
    {
      title: 'Homeostatic Plasticity',
      desc:  'Firing rate self-regulation — does the network stabilize itself?',
      state: homeostasis,
      render: (d: Record<string, unknown>) => {
        const active = Boolean(d.homeostasis_active);
        const stability = Number(d.stability_score ?? 0);
        const trend = String(d.trend_direction ?? 'unknown');
        const compensations = Number(d.n_compensation_events ?? 0);
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`text-sm font-bold ${active ? 'text-emerald-400' : 'text-amber-400'}`}>
                {active ? 'HOMEOSTASIS ACTIVE' : 'UNSTABLE'}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="px-2 py-1 rounded-md bg-white/[0.03]"><div style={{ color: "var(--text-faint)" }}>Stability</div><div className="text-white/60 tabular-nums">{stability.toFixed(2)}</div></div>
              <div className="px-2 py-1 rounded-md bg-white/[0.03]"><div style={{ color: "var(--text-faint)" }}>Trend</div><div className="text-white/60">{trend}</div></div>
              <div className="px-2 py-1 rounded-md bg-white/[0.03]"><div style={{ color: "var(--text-faint)" }}>Compensations</div><div className="text-white/60 tabular-nums">{compensations}</div></div>
            </div>
          </div>
        );
      },
      wide: false,
    },
    {
      title: 'Catastrophic Forgetting',
      desc:  'Do early patterns survive over time?',
      state: forgetting,
      render: (d: Record<string, unknown>) => {
        const retention = (d.retention_scores ?? d.retention_curve ?? []) as number[];
        const halfLife = Number(d.half_life_windows ?? 0);
        const decayType = String(d.decay_type ?? d.classification ?? 'unknown');
        const maxR = Math.max(...retention, 0.01);
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`text-sm font-bold ${decayType === 'stable' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {decayType.toUpperCase()}
              </div>
              {halfLife > 0 && <div className="text-[10px] text-white/30">half-life: {halfLife} windows</div>}
            </div>
            {retention.length > 1 && (
              <div className="flex items-end gap-px h-8">
                {retention.slice(0, 20).map((r, i) => (
                  <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-cyan-500/30 to-violet-500/30" style={{ height: `${(r / maxR) * 100}%` }} />
                ))}
              </div>
            )}
          </div>
        );
      },
      wide: false,
    },
    {
      title: 'Transfer Learning',
      desc:  'Does learning one pattern help with another?',
      state: transferL,
      render: (d: Record<string, unknown>) => {
        const hasTransfer = Boolean(d.positive_transfer ?? d.transfer_detected ?? false);
        const gainMean = Number(d.mean_transfer_gain ?? d.mean_gain ?? 0);
        return (
          <div className="space-y-2">
            <div className={`text-sm font-bold ${hasTransfer ? 'text-emerald-400' : 'text-white/40'}`}>
              {hasTransfer ? 'POSITIVE TRANSFER' : 'NO TRANSFER DETECTED'}
            </div>
            <div className="text-[10px] text-white/40">Mean gain: <span className="text-cyan-400/70 tabular-nums">{gainMean.toFixed(4)}</span></div>
            <JsonRows data={d} max={5} />
          </div>
        );
      },
      wide: false,
    },
    {
      title: 'Morphological Computing',
      desc:  'How structure relates to computational ability',
      state: morphology,
      render: (d: Record<string, unknown>) => {
        const score = Number(d.morphological_score ?? 0);
        const uniformity = Number(d.spatial_uniformity ?? 0);
        const activeFrac = Number(d.active_electrode_fraction ?? 0);
        const interp = String(d.interpretation ?? '');
        return (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-400 tabular-nums">{(score * 100).toFixed(0)}</span>
              <span className="text-[11px] text-white/30">/ 100</span>
            </div>
            <div className="text-[10px] text-white/40">{interp}</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="px-2 py-1 rounded-md bg-white/[0.03]"><div style={{ color: "var(--text-faint)" }}>Uniformity</div><div className="text-white/60 tabular-nums">{(uniformity * 100).toFixed(0)}%</div></div>
              <div className="px-2 py-1 rounded-md bg-white/[0.03]"><div style={{ color: "var(--text-faint)" }}>Active</div><div className="text-white/60 tabular-nums">{(activeFrac * 100).toFixed(0)}%</div></div>
            </div>
          </div>
        );
      },
      wide: false,
    },
  ];

  return (
    <div className="p-3 sm:p-4">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-4"
      >
        <h1 className="text-[18px] font-display text-white/80">Discovery Analysis</h1>
        <p className="text-[12px] text-white/30 mt-0.5">13 advanced computational neuroscience metrics · {datasetId ?? 'no dataset'}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.04 * i }}
            className={card.wide ? 'xl:col-span-1 lg:col-span-2' : ''}
          >
            <ChartCard title={card.title} description={card.desc}>
              {card.state.error
                ? <div className="text-[11px] text-red-400/60 py-4">{card.state.error}</div>
                : !card.state.data
                  ? <Spinner />
                  : card.render(card.state.data)
              }
            </ChartCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
