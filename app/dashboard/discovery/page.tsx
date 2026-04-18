'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardContext } from '@/lib/dashboard-context';
import { useCachedAnalysis } from '@/lib/use-cached-analysis';
import * as api from '@/lib/api';
import ChartCard from '@/components/dashboard/ChartCard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function JsonRows({ data, max = 10 }: { data: Record<string, unknown>; max?: number }) {
  const entries = Object.entries(data).slice(0, max);
  return (
    <div className="space-y-1 font-mono text-[10px] mt-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2 py-0.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="w-auto min-w-[80px] shrink-0" style={{ color: 'var(--text-muted)' }}>{k}:</span>
          <span className="break-all" style={{ color: 'var(--accent-cyan)' }}>
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
  const phi = Number(data.phi ?? data.phi_value ?? data.causal_emergence ?? data.effective_information ?? 0);

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
          <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>bits · Φ</div>
        </div>
      </div>

      {/* Visual bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px]" style={{ color: 'var(--text-faint)' }}>
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

      <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <JsonRows data={data} max={6} />
    </div>
  );
}

// ─── Predictive Coding ────────────────────────────────────────────────────────

function PredictiveCodingCard({ data }: { data: Record<string, unknown> }) {
  const surpriseRatio = Number(data.surprise_ratio ?? data.free_energy ?? data.prediction_error ?? 0);
  const nSig = Number(data.n_significant_methods ?? 0);
  const nTotal = Number(data.n_tests_total ?? 0);
  const effectSize = Number(data.effect_size ?? 0);
  const pValue = Number(data.p_value ?? 1);
  const interp = String(data.interpretation ?? '');

  // Strength: 0-1 scale based on significant tests ratio
  const strength = nTotal > 0 ? nSig / nTotal : 0;
  const strengthLabel = strength >= 0.4 ? 'Strong' : strength >= 0.2 ? 'Moderate' : strength > 0 ? 'Weak' : 'None';
  const strengthColor = strength >= 0.4 ? 'text-emerald-400' : strength >= 0.2 ? 'text-amber-400' : 'text-red-400/70';

  return (
    <div className="space-y-4">
      {/* Strength bar instead of binary badge */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[13px] font-bold ${strengthColor}`}>
            {strengthLabel} evidence
          </span>
          <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
            {nSig}/{nTotal} tests significant
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(strength * 100, 2)}%`,
              background: strength >= 0.4
                ? 'linear-gradient(to right, var(--accent-emerald), var(--accent-cyan))'
                : strength >= 0.2
                  ? 'linear-gradient(to right, var(--accent-amber), var(--accent-cyan))'
                  : 'var(--accent-red)',
            }}
          />
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="px-2 py-1.5 rounded-md" style={{ background: 'var(--bg-card)' }}>
          <div style={{ color: 'var(--text-faint)' }}>Surprise ratio</div>
          <div className="text-[13px] font-medium text-cyan-400 tabular-nums">{surpriseRatio.toFixed(3)}x</div>
        </div>
        <div className="px-2 py-1.5 rounded-md" style={{ background: 'var(--bg-card)' }}>
          <div style={{ color: 'var(--text-faint)' }}>Effect size (d)</div>
          <div className="text-[13px] font-medium text-violet-400 tabular-nums">{effectSize.toFixed(2)}</div>
        </div>
        <div className="px-2 py-1.5 rounded-md" style={{ background: 'var(--bg-card)' }}>
          <div style={{ color: 'var(--text-faint)' }}>p-value</div>
          <div className="text-[13px] font-medium tabular-nums" style={{ color: pValue < 0.05 ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
            {pValue < 0.001 ? '<0.001' : pValue.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Interpretation */}
      {interp && (
        <div className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {interp.length > 200 ? interp.slice(0, 200) + '...' : interp}
        </div>
      )}

      <JsonRows data={data} max={4} />
    </div>
  );
}

// ─── Attractors ───────────────────────────────────────────────────────────────

function AttractorsCard({ data }: { data: Record<string, unknown> }) {
  const attrRaw = data.attractors ?? [];
  const attractors  = Array.isArray(attrRaw) ? attrRaw as Array<Record<string, unknown>> : [];
  const nAttractors = Number(data.n_attractors ?? attractors.length);
  const nMemory     = Number(data.n_memory_candidates ?? data.memory_candidates ?? 0);
  const stability   = Number(data.mean_stability ?? data.stability ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        <div>
          <div className="text-4xl font-bold text-violet-400 tabular-nums">{nAttractors}</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Attractors</div>
        </div>
        <div className="pl-4 border-l border-white/[0.06]">
          <div className="text-4xl font-bold text-cyan-400 tabular-nums">{nMemory}</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Memory Candidates</div>
        </div>
      </div>

      {stability > 0 && (
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span style={{ color: "var(--text-muted)" }}>Mean Attractor Stability</span>
            <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{(stability * 100).toFixed(1)}%</span>
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
          <span className="w-4" style={{ color: 'var(--text-faint)' }}>#{i + 1}</span>
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
  const transRaw = data.transitions ?? data.phase_transitions ?? [];
  const transitions = Array.isArray(transRaw) ? transRaw as Array<Record<string, unknown>> : [];
  const nTrans      = Number(data.n_transitions ?? transitions.length);
  const maxMag      = transitions.length > 0 ? Math.max(...transitions.map((t) => Number(t.score ?? t.magnitude ?? t.strength ?? 0)), 0.001) : 0.001;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <div className="text-4xl font-bold text-amber-400 tabular-nums">{nTrans}</div>
        <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>transitions detected</div>
      </div>

      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {nTrans > 0
          ? `Network reorganized ${nTrans} time${nTrans !== 1 ? 's' : ''} during recording — optimal stimulation windows.`
          : 'No significant phase transitions detected in this recording window.'}
      </div>

      {/* Timeline bars */}
      {transitions.length > 0 && (
        <div className="space-y-1.5 mt-2">
          <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Transition Timeline</div>
          {transitions.slice(0, 6).map((t, i) => {
            const time = Number(t.time ?? t.time_sec ?? t.t ?? 0);
            const mag  = Number(t.score ?? t.magnitude ?? t.strength ?? 0);
            const pct  = (mag / maxMag) * 100;
            return (
              <div key={i} className="flex items-center gap-3 text-[10px]">
                <span className="w-12 tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>{time.toFixed(2)}s</span>
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
            <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>+ {transitions.length - 6} more...</div>
          )}
        </div>
      )}

      <JsonRows data={data} max={4} />
    </div>
  );
}

// ─── Replay Events ────────────────────────────────────────────────────────────

function ReplayCard({ data }: { data: Record<string, unknown> }) {
  const evRaw = data.replay_events ?? data.events ?? [];
  const events     = Array.isArray(evRaw) ? evRaw as Array<Record<string, unknown>> : [];
  const nEvents    = Number(data.n_replay_events ?? data.n_events ?? events.length);
  const replayRate = Number(data.replay_rate ?? data.events_per_min ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        <div>
          <div className="text-4xl font-bold text-pink-400 tabular-nums">{nEvents}</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Replay Events</div>
        </div>
        {replayRate > 0 && (
          <div className="pl-4 border-l border-white/[0.06]">
            <div className="text-4xl font-bold text-violet-400 tabular-nums">{replayRate.toFixed(1)}</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Events/min</div>
          </div>
        )}
      </div>

      <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
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
  // Handle both old format {complexities: number[], timescales: number[]}
  // and new format {scales: [{scale_ms, entropy, lz_complexity, ...}]}
  const scalesArr = Array.isArray(data.scales) ? data.scales : [];
  const isObjectScales = scalesArr.length > 0 && typeof scalesArr[0] === 'object' && scalesArr[0] !== null;

  let complexities: number[];
  let timescales: number[];

  if (isObjectScales) {
    complexities = scalesArr.map((s: Record<string, unknown>) => Number(s.lz_complexity ?? s.entropy ?? 0));
    timescales = scalesArr.map((s: Record<string, unknown>) => Number(s.scale_ms ?? 0));
  } else {
    const compRaw = data.complexities ?? data.complexity_values ?? data.mse_values ?? scalesArr;
    complexities = Array.isArray(compRaw) ? compRaw.map(Number) : [];
    const tsRaw = data.timescales ?? scalesArr;
    timescales = Array.isArray(tsRaw) ? tsRaw.map(Number) : [];
  }

  const meanComp     = Number(data.mean_complexity ?? data.complexity_slope ?? data.mean ?? (complexities.length > 0 ? complexities.reduce((a, b) => a + b, 0) / complexities.length : 0));
  const maxComp      = complexities.length > 0 ? Math.max(...complexities, 0.001) : 0.001;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-bold text-emerald-400 tabular-nums">{meanComp.toFixed(4)}</div>
        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>mean complexity</div>
      </div>

      {complexities.length > 0 && (
        <div className="space-y-2">
          <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
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
                    <div className="absolute -bottom-4 text-[8px] tabular-nums" style={{ color: 'var(--text-faint)' }}>{scale}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] mt-4" style={{ color: 'var(--text-faint)' }}>
            <span>Fine (fast)</span><span>Coarse (slow)</span>
          </div>
        </div>
      )}

      <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
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
  const score = Number(data.sleep_like_score ?? data.sleep_score ?? 0);
  const hasUpDown = Boolean(data.has_up_down_states ?? upDown.detected ?? false);
  const hasSlowWaves = Boolean(data.has_slow_waves ?? data.slow_waves_detected ?? false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold tabular-nums text-violet-400">{(score * 100).toFixed(0)}%</div>
        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Sleep-like score</div>
      </div>

      {/* UP/DOWN state bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>DOWN (silent)</span>
          <span>UP (active)</span>
        </div>
        <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden flex">
          <div className="h-full bg-indigo-900/50" style={{ width: `${(1 - upFraction) * 100}%` }} />
          <div className="h-full bg-gradient-to-r from-cyan-500/40 to-violet-500/40" style={{ width: `${upFraction * 100}%` }} />
        </div>
        <div className="flex justify-between text-[10px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
          <span>{((1 - upFraction) * 100).toFixed(0)}%</span>
          <span>{(upFraction * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="px-2 py-1.5 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Transitions</div>
          <div className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{nTransitions}</div>
        </div>
        <div className="px-2 py-1.5 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Indicators</div>
          <div style={{ color: 'var(--text-secondary)' }}>
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
  const ampRaw = data.event_amplitudes ?? [];
  const amplitudes = Array.isArray(ampRaw) ? ampRaw.map(Number) : [];

  // Mini sparkline of event amplitudes
  const maxAmp = amplitudes.length > 0 ? Math.max(...amplitudes.slice(0, 30), 1) : 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={`text-lg font-bold ${detected ? 'text-emerald-400' : ''}`} style={detected ? undefined : { color: 'var(--text-muted)' }}>
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
          <div className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{nEvents}</div>
        </div>
        <div className="px-2 py-1 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Decrease</div>
          <div className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{decreasePct.toFixed(1)}%</div>
        </div>
        <div className="px-2 py-1 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>R²</div>
          <div className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{rSquared.toFixed(3)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Metastability ──────────────────────────────────────────────────────────

function MetastabilityCard({ data }: { data: Record<string, unknown> }) {
  const kuramoto = (data.kuramoto ?? {}) as Record<string, unknown>;
  const kMean = Number(kuramoto.kuramoto_mean ?? kuramoto.mean_r ?? data.kuramoto_mean ?? 0);
  const metaIndex = Number(kuramoto.metastability_index ?? kuramoto.meta_index ?? data.metastability_index ?? 0);
  const syncLevel = String(kuramoto.synchronization_level ?? kuramoto.sync_level ?? data.synchronization_level ?? 'unknown');
  const isMetastable = Boolean(data.is_metastable ?? kuramoto.is_metastable ?? false);
  const transitions = (data.state_transitions ?? data.transitions ?? {}) as Record<string, unknown>;
  const nStates = Number(transitions.n_states ?? 0);
  const nTrans = Number(transitions.n_transitions ?? 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-2xl font-bold tabular-nums text-cyan-400">{kMean.toFixed(3)}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Kuramoto R (synchronization)</div>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${
          isMetastable ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.05]'
        }`} style={isMetastable ? undefined : { color: 'var(--text-muted)' }}>
          {isMetastable ? 'METASTABLE' : syncLevel.toUpperCase()}
        </div>
      </div>

      {/* Synchronization bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px]" style={{ color: 'var(--text-faint)' }}>
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
          <div className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{metaIndex.toFixed(3)}</div>
        </div>
        <div className="px-2 py-1 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>States</div>
          <div className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{nStates}</div>
        </div>
        <div className="px-2 py-1 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Transitions</div>
          <div className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{nTrans}</div>
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
            <span className="text-[13px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{(score * 100).toFixed(0)}</span>
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
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Consciousness assessment</div>
        </div>
      </div>

      {indicatorEntries.length > 0 && (
        <div className="space-y-1">
          {indicatorEntries.slice(0, 6).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-[10px] py-0.5">
              <span className="capitalize" style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}</span>
              <span className={typeof v === 'boolean'
                ? (v ? 'text-emerald-400' : '')
                : 'text-cyan-400/60 tabular-nums'
              } style={typeof v === 'boolean' && !v ? { color: 'var(--text-faint)' } : undefined}>
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
          <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Biological Realism</div>
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
          <div className="flex gap-2 text-[9px] uppercase tracking-widest border-b border-white/[0.06] pb-1" style={{ color: 'var(--text-faint)' }}>
            <span className="w-24 shrink-0">Metric</span>
            <span className="flex-1 text-center">Real</span>
            <span className="flex-1 text-center">Poisson</span>
            <span className="flex-1 text-center">LIF</span>
          </div>
          {metrics.slice(0, 8).map((metric) => {
            const row = comparison[metric] ?? {};
            return (
              <div key={metric} className="flex gap-2 text-[10px] py-0.5 border-b border-white/[0.03]">
                <span className="w-24 shrink-0 truncate capitalize" style={{ color: 'var(--text-muted)' }}>{metric.replace(/_/g, ' ')}</span>
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
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Attractors</div>
        </div>
        <div className="pl-4 border-l border-white/[0.06]">
          <div className="text-2xl font-bold text-cyan-400 tabular-nums">{meanEnergy.toFixed(3)}</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Mean Energy</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="px-2 py-1.5 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Energy Range</div>
          <div className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{energyRange.toFixed(3)}</div>
        </div>
        <div className="px-2 py-1.5 rounded-md bg-white/[0.03]">
          <div style={{ color: "var(--text-faint)" }}>Model Type</div>
          <div className="capitalize" style={{ color: 'var(--text-secondary)' }}>{modelType.replace(/_/g, ' ')}</div>
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
  const recRaw = data.recommendations ?? [];
  const recommendations = Array.isArray(recRaw) ? recRaw : [];
  const monitoringStatus = String(data.monitoring_status ?? data.monitoring ?? '—');

  const badgeColor = score >= 0.7 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                   : score >= 0.4 ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                   :                'bg-red-500/15 text-red-400 border-red-500/20';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{(score * 100).toFixed(0)}%</div>
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
        <div className="capitalize" style={{ color: 'var(--text-secondary)' }}>{monitoringStatus.replace(/_/g, ' ')}</div>
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Recommendations</div>
          {recommendations.slice(0, 5).map((rec, i) => (
            <div key={i} className="flex gap-2 text-[10px] py-0.5">
              <span className="shrink-0" style={{ color: 'var(--text-faint)' }}>-</span>
              <span style={{ color: 'var(--text-muted)' }}>{rec}</span>
            </div>
          ))}
        </div>
      )}

      <JsonRows data={data} max={4} />
    </div>
  );
}

// ─── Groups ───────────────────────────────────────────────────────────────────

const GROUPS = [
  { id: 'emergence',  label: 'Emergence & Integration', icon: '🧠', indices: [0, 1, 9, 10] },
  { id: 'dynamics',   label: 'Dynamics & Complexity',      icon: '🌊', indices: [2, 3, 5, 8, 11] },
  { id: 'memory',     label: 'Memory & Learning',          icon: '💡', indices: [4, 6, 7, 14, 15] },
  { id: 'health',     label: 'Health & Ethics',             icon: '🛡️', indices: [12, 13, 16] },
];

interface CardDef {
  title: string;
  desc: string;
  data: Record<string, unknown> | null;
  loading: boolean;
  error: string;
  render: (d: Record<string, unknown>) => React.ReactNode;
  wide?: boolean;
}

function DiscoveryGroups({ cards }: { cards: CardDef[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ emergence: true, dynamics: true, memory: true, health: true });

  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      {GROUPS.map((group) => {
        const isOpen = open[group.id] ?? true;
        const groupCards = group.indices.map((idx) => cards[idx]).filter(Boolean);
        const loadedCount = groupCards.filter((c) => c.data && !c.loading).length;

        return (
          <div key={group.id}>
            {/* Section header — clickable to toggle */}
            <button
              onClick={() => toggle(group.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl mb-2 transition-all hover:brightness-110"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{group.icon}</span>
                <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{group.label}</span>
                <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
                  {loadedCount}/{groupCards.length}
                </span>
              </div>
              <svg
                className="w-4 h-4 transition-transform duration-300"
                style={{ color: 'var(--text-faint)', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Cards grid — collapsible */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 pb-2">
                    {groupCards.map((card, i) => (
                      <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.03 * i }}
                        className={card.wide ? 'xl:col-span-1 lg:col-span-2' : ''}
                      >
                        <ChartCard title={card.title} description={card.desc} loading={card.loading} error={card.error}>
                          {card.data && card.render(card.data)}
                        </ChartCard>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscoveryPage() {
  const { datasetId, status, spikes } = useDashboardContext();

  const emergence     = useCachedAnalysis(datasetId, 'emergence',       () => api.getEmergence(datasetId!));
  const predictive    = useCachedAnalysis(datasetId, 'predictive',      () => api.getPredictiveCoding(datasetId!));
  const attractors    = useCachedAnalysis(datasetId, 'attractors',      () => api.getAttractors(datasetId!));
  const phase         = useCachedAnalysis(datasetId, 'phase',           () => api.getPhaseTransitions(datasetId!));
  const replay        = useCachedAnalysis(datasetId, 'replay',          () => api.getReplay(datasetId!));
  const multiscale    = useCachedAnalysis(datasetId, 'multiscale',      () => api.getMultiscale(datasetId!));
  const sleepWake     = useCachedAnalysis(datasetId, 'sleep-wake',      () => api.getSleepWake(datasetId!));
  const habituation   = useCachedAnalysis(datasetId, 'habituation',     () => api.getHabituation(datasetId!));
  const metastability = useCachedAnalysis(datasetId, 'metastability',   () => api.getMetastability(datasetId!));
  const consciousness = useCachedAnalysis(datasetId, 'consciousness',   () => api.getConsciousness(datasetId!));
  const turingTest    = useCachedAnalysis(datasetId, 'turing-test',     () => api.getTuringTest(datasetId!));
  const energyLand    = useCachedAnalysis(datasetId, 'energy-landscape',() => api.getEnergyLandscape(datasetId!));
  const welfare       = useCachedAnalysis(datasetId, 'welfare',         () => api.getWelfare(datasetId!));
  const homeostasis   = useCachedAnalysis(datasetId, 'homeostasis',     () => api.getHomeostasis(datasetId!));
  const forgetting    = useCachedAnalysis(datasetId, 'forgetting',      () => api.getForgetting(datasetId!));
  const transferL     = useCachedAnalysis(datasetId, 'transfer-learning',() => api.getTransferLearning(datasetId!));
  const morphology    = useCachedAnalysis(datasetId, 'morphology',      () => api.getMorphology(datasetId!));

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
      desc:  'Integrated information (Tononi 2004) — measures network irreducibility, not consciousness',
      data: emergence.data,
      loading: emergence.loading,
      error: emergence.error,
      render: (d: Record<string, unknown>) => <EmergenceCard data={d} />,
      wide: true,
    },
    {
      title: 'Temporal Prediction Analysis',
      desc:  'Differential response to expected vs unexpected state transitions. Speculative without closed-loop stimulation',
      data: predictive.data,
      loading: predictive.loading,
      error: predictive.error,
      render: (d: Record<string, unknown>) => <PredictiveCodingCard data={d} />,
      wide: false,
    },
    {
      title: 'Attractor Landscape',
      desc:  'Memory as dynamical attractors (Hopfield theory)',
      data: attractors.data,
      loading: attractors.loading,
      error: attractors.error,
      render: (d: Record<string, unknown>) => <AttractorsCard data={d} />,
      wide: false,
    },
    {
      title: 'Phase Transitions',
      desc:  'Neural reorganization events + stimulation windows',
      data: phase.data,
      loading: phase.loading,
      error: phase.error,
      render: (d: Record<string, unknown>) => <PhaseTransitionsCard data={d} />,
      wide: false,
    },
    {
      title: 'Neural Replay',
      desc:  'Offline memory consolidation events',
      data: replay.data,
      loading: replay.loading,
      error: replay.error,
      render: (d: Record<string, unknown>) => <ReplayCard data={d} />,
      wide: false,
    },
    {
      title: 'Multiscale Complexity',
      desc:  'Information complexity across 12 temporal timescales',
      data: multiscale.data,
      loading: multiscale.loading,
      error: multiscale.error,
      render: (d: Record<string, unknown>) => <MultiscaleCard data={d} />,
      wide: false,
    },
    {
      title: 'Network State Transitions',
      desc:  'Bistable dynamics detection (UP/DOWN-like states). Not sleep physiology — reflects network bistability in vitro',
      data: sleepWake.data,
      loading: sleepWake.loading,
      error: sleepWake.error,
      render: (d: Record<string, unknown>) => <SleepWakeCard data={d} />,
      wide: false,
    },
    {
      title: 'Habituation',
      desc:  'Response decay to repeated patterns — simplest learning',
      data: habituation.data,
      loading: habituation.loading,
      error: habituation.error,
      render: (d: Record<string, unknown>) => <HabituationCard data={d} />,
      wide: false,
    },
    {
      title: 'Metastability',
      desc:  'Kuramoto synchronization + brain-like state switching',
      data: metastability.data,
      loading: metastability.loading,
      error: metastability.error,
      render: (d: Record<string, unknown>) => <MetastabilityCard data={d} />,
      wide: false,
    },
    {
      title: 'Network Dynamics Assessment',
      desc:  'Composite complexity: integration + recurrence + dynamics. Measures network properties, not sentience',
      data: consciousness.data,
      loading: consciousness.loading,
      error: consciousness.error,
      render: (d: Record<string, unknown>) => <ConsciousnessCard data={d} />,
      wide: false,
    },
    {
      title: 'Turing Test',
      desc:  'Biological realism score — real vs Poisson vs LIF comparison',
      data: turingTest.data,
      loading: turingTest.loading,
      error: turingTest.error,
      render: (d: Record<string, unknown>) => <TuringTestCard data={d} />,
      wide: true,
    },
    {
      title: 'Energy Landscape',
      desc:  'Attractor basins, energy surface + Hopfield model fit',
      data: energyLand.data,
      loading: energyLand.loading,
      error: energyLand.error,
      render: (d: Record<string, unknown>) => <EnergyLandscapeCard data={d} />,
      wide: false,
    },
    {
      title: 'Welfare Report',
      desc:  'Organoid welfare assessment + monitoring recommendations',
      data: welfare.data,
      loading: welfare.loading,
      error: welfare.error,
      render: (d: Record<string, unknown>) => <WelfareCard data={d} />,
      wide: false,
    },
    {
      title: 'Homeostatic Plasticity',
      desc:  'Firing rate self-regulation — does the network stabilize itself?',
      data: homeostasis.data,
      loading: homeostasis.loading,
      error: homeostasis.error,
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
              <div className="px-2 py-1 rounded-md bg-white/[0.03]"><div style={{ color: "var(--text-faint)" }}>Stability</div><div className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{stability.toFixed(2)}</div></div>
              <div className="px-2 py-1 rounded-md bg-white/[0.03]"><div style={{ color: "var(--text-faint)" }}>Trend</div><div style={{ color: 'var(--text-secondary)' }}>{trend}</div></div>
              <div className="px-2 py-1 rounded-md bg-white/[0.03]"><div style={{ color: "var(--text-faint)" }}>Compensations</div><div className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{compensations}</div></div>
            </div>
          </div>
        );
      },
      wide: false,
    },
    {
      title: 'Catastrophic Forgetting',
      desc:  'Do early patterns survive over time?',
      data: forgetting.data,
      loading: forgetting.loading,
      error: forgetting.error,
      render: (d: Record<string, unknown>) => {
        const retRaw = d.retention_scores ?? d.retention_curve ?? [];
        const retention = Array.isArray(retRaw) ? retRaw.map(Number) : [];
        const halfLife = Number(d.half_life_windows ?? 0);
        const decayType = String(d.decay_type ?? d.classification ?? 'unknown');
        const maxR = retention.length > 0 ? Math.max(...retention, 0.01) : 0.01;
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`text-sm font-bold ${decayType === 'stable' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {decayType.toUpperCase()}
              </div>
              {halfLife > 0 && <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>half-life: {halfLife} windows</div>}
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
      data: transferL.data,
      loading: transferL.loading,
      error: transferL.error,
      render: (d: Record<string, unknown>) => {
        const hasTransfer = Boolean(d.positive_transfer ?? d.transfer_detected ?? false);
        const gainMean = Number(d.mean_transfer_gain ?? d.mean_gain ?? 0);
        return (
          <div className="space-y-2">
            <div className={`text-sm font-bold ${hasTransfer ? 'text-emerald-400' : ''}`} style={hasTransfer ? undefined : { color: 'var(--text-muted)' }}>
              {hasTransfer ? 'POSITIVE TRANSFER' : 'NO TRANSFER DETECTED'}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Mean gain: <span className="text-cyan-400/70 tabular-nums">{gainMean.toFixed(4)}</span></div>
            <JsonRows data={d} max={5} />
          </div>
        );
      },
      wide: false,
    },
    {
      title: 'Morphological Computing',
      desc:  'How structure relates to computational ability',
      data: morphology.data,
      loading: morphology.loading,
      error: morphology.error,
      render: (d: Record<string, unknown>) => {
        const score = Number(d.morphological_score ?? 0);
        const uniformity = Number(d.spatial_uniformity ?? 0);
        const activeFrac = Number(d.active_electrode_fraction ?? 0);
        const interp = String(d.interpretation ?? '');
        return (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-400 tabular-nums">{(score * 100).toFixed(0)}</span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{interp}</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="px-2 py-1 rounded-md bg-white/[0.03]"><div style={{ color: "var(--text-faint)" }}>Uniformity</div><div className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{(uniformity * 100).toFixed(0)}%</div></div>
              <div className="px-2 py-1 rounded-md bg-white/[0.03]"><div style={{ color: "var(--text-faint)" }}>Active</div><div className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{(activeFrac * 100).toFixed(0)}%</div></div>
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
        <h1 className="text-[18px] font-display" style={{ color: 'var(--text-primary)' }}>Discovery Analysis</h1>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>17 advanced analyses grouped by domain</p>
      </motion.div>

      <DiscoveryGroups cards={cards} />
    </div>
  );
}
