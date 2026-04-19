'use client';

import { useState, useCallback } from 'react';
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

function RunButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-3 px-4 py-1.5 rounded-full text-[11px] font-medium bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(6,182,212,0.15)]"
    >
      {label}
    </button>
  );
}

function Bar({
  label,
  value,
  maxValue,
  color = 'from-cyan-500 to-violet-500',
  delay = 0,
}: {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
  delay?: number;
}) {
  const pct = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-[10px]">
      <span className="w-16 truncate shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="w-12 tabular-nums text-right shrink-0" style={{ color: 'var(--text-secondary)' }}>
        {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
      </span>
    </div>
  );
}

function ErrorMsg({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-4 space-y-2">
      <div className="text-[11px] text-red-400/80">{message}</div>
      <button
        onClick={onRetry}
        className="text-[10px] text-red-400/60 hover:text-red-400 underline transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

// ─── Card: DishBrain Pong ────────────────────────────────────────────────────

function PongCard({ datasetId }: { datasetId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.runPong(datasetId);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} onRetry={run} />;

  if (!result) {
    return (
      <div className="space-y-2">
        <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Simulate a DishBrain-style Pong experiment using differential stimulation feedback (Kagan et al. 2022).
          The organoid learns to predict and intercept the ball over 200 trials.
        </div>
        <RunButton label="Run Simulation" onClick={run} />
      </div>
    );
  }

  const hitRate = Number(result.hit_rate ?? result.mean_hit_rate ?? result.hit_rate_pct ?? result.final_hit_rate ?? 0);
  const trials = Number(result.trials_completed ?? result.n_trials ?? result.n_games ?? result.total_trials ?? 200);
  const scoresRaw = result.scores ?? result.score_history ?? result.trial_scores ?? [];
  const scores = Array.isArray(scoresRaw) ? scoresRaw : [];
  const lcRaw = result.learning_curve ?? scores;
  const learningCurve = Array.isArray(lcRaw) ? lcRaw.map(Number) : [];
  const maxScore = learningCurve.length > 0 ? Math.max(...learningCurve, 1) : 1;

  // Show last N bars for the learning curve
  const barData = learningCurve.length > 20
    ? learningCurve.filter((_, i) => i % Math.ceil(learningCurve.length / 20) === 0)
    : learningCurve;

  return (
    <div className="space-y-3">
      <div className="flex gap-6">
        <div>
          <div className="text-3xl font-bold text-cyan-400 tabular-nums">
            {(hitRate * (hitRate <= 1 ? 100 : 1)).toFixed(1)}%
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Hit Rate</div>
        </div>
        <div className="pl-4 border-l border-white/[0.06]">
          <div className="text-3xl font-bold text-violet-400 tabular-nums">{trials}</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Trials</div>
        </div>
      </div>

      {/* Learning curve bar chart */}
      {barData.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Learning Curve</div>
          <div className="flex items-end gap-px h-14">
            {barData.map((val, i) => {
              const v = Number(val);
              const pct = (v / maxScore) * 100;
              return (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-cyan-500/40 to-cyan-400/70"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, pct)}%` }}
                  transition={{ duration: 0.4, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[8px]" style={{ color: 'var(--text-faint)' }}>
            <span>Trial 1</span>
            <span>Trial {trials}</span>
          </div>
        </div>
      )}

      <RunButton label="Run Again" onClick={run} />
    </div>
  );
}

// ─── Card: Logic Gate Benchmark ──────────────────────────────────────────────

function LogicCard({ datasetId }: { datasetId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.runLogicBenchmark(datasetId);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Benchmark failed');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} onRetry={run} />;

  if (!result) {
    return (
      <div className="space-y-2">
        <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Test the organoid's ability to compute boolean logic: AND, OR, XOR, NAND, XNOR gates.
        </div>
        <RunButton label="Run Benchmark" onClick={run} />
      </div>
    );
  }

  const gates = (result.gates ?? result.gate_results ?? result.results ?? {}) as Record<string, unknown>;
  const overall = Number(result.overall_accuracy ?? result.xor_accuracy ?? result.overall_score ?? result.mean_accuracy ?? 0);

  // Parse per-gate accuracy
  const gateEntries = Object.entries(gates).map(([name, val]) => ({
    name: name.toUpperCase(),
    accuracy: typeof val === 'number' ? val : Number((val as Record<string, unknown>)?.accuracy ?? (val as Record<string, unknown>)?.score ?? 0),
  }));

  // If no parsed gates, try alternative format
  const gateList = gateEntries.length > 0 ? gateEntries : [
    { name: 'AND', accuracy: Number(result.and_accuracy ?? result.AND ?? 0) },
    { name: 'OR', accuracy: Number(result.or_accuracy ?? result.OR ?? 0) },
    { name: 'XOR', accuracy: Number(result.xor_accuracy ?? result.XOR ?? 0) },
    { name: 'NAND', accuracy: Number(result.nand_accuracy ?? result.NAND ?? 0) },
    { name: 'XNOR', accuracy: Number(result.xnor_accuracy ?? result.XNOR ?? 0) },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-bold text-emerald-400 tabular-nums">
          {(overall * (overall <= 1 ? 100 : 1)).toFixed(1)}%
        </div>
        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>overall accuracy</div>
      </div>

      <div className="space-y-1.5">
        <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Per-Gate Accuracy</div>
        {gateList.map((gate, i) => (
          <Bar
            key={gate.name}
            label={gate.name}
            value={gate.accuracy * (gate.accuracy <= 1 ? 100 : 1)}
            maxValue={100}
            color="from-emerald-500 to-cyan-500"
            delay={i * 0.06}
          />
        ))}
      </div>

      <RunButton label="Run Again" onClick={run} />
    </div>
  );
}

// ─── Card: Brainoware Vowels ─────────────────────────────────────────────────

function VowelCard({ datasetId }: { datasetId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.runVowels(datasetId);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Classification failed');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} onRetry={run} />;

  if (!result) {
    return (
      <div className="space-y-2">
        <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Reservoir computing approach: classify 240 Japanese vowel samples using organoid neural dynamics.
        </div>
        <RunButton label="Run Classification" onClick={run} />
      </div>
    );
  }

  const accuracy = Number(result.accuracy ?? result.test_accuracy ?? result.classification_accuracy ?? 0);
  const baseline = Number(result.random_baseline ?? result.baseline ?? result.chance_level ?? 0.2);
  const cmRaw = result.confusion_matrix ?? result.conf_matrix ?? [];
  const confMatrix = Array.isArray(cmRaw) ? cmRaw : [];
  const vowelsRaw = result.vowel_labels ?? result.labels ?? result.classes ?? ['a', 'i', 'u', 'e', 'o'];
  const vowels = Array.isArray(vowelsRaw) ? vowelsRaw : ['a', 'i', 'u', 'e', 'o'];

  return (
    <div className="space-y-3">
      <div className="flex gap-6">
        <div>
          <div className="text-3xl font-bold text-violet-400 tabular-nums">
            {(accuracy * (accuracy <= 1 ? 100 : 1)).toFixed(1)}%
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Accuracy</div>
        </div>
        <div className="pl-4 border-l border-white/[0.06]">
          <div className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {(baseline * (baseline <= 1 ? 100 : 1)).toFixed(1)}%
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Random Baseline</div>
        </div>
      </div>

      {/* Accuracy vs baseline bar */}
      <div className="space-y-1">
        <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Accuracy vs Chance</div>
        <Bar label="Organoid" value={accuracy * (accuracy <= 1 ? 100 : 1)} maxValue={100} color="from-violet-500 to-pink-500" delay={0} />
        <Bar label="Random" value={baseline * (baseline <= 1 ? 100 : 1)} maxValue={100} color="from-white/20 to-white/10" delay={0.1} />
      </div>

      {/* Simplified confusion matrix */}
      {confMatrix.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Confusion Matrix</div>
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="inline-grid gap-px min-w-full" style={{ gridTemplateColumns: `auto repeat(${vowels.length}, minmax(32px, 1fr))` }}>
              {/* Header row */}
              <div className="text-[8px] p-1" style={{ color: 'var(--text-faint)' }} />
              {vowels.map((v) => (
                <div key={`h-${v}`} className="text-[8px] text-center p-1 font-mono" style={{ color: 'var(--text-muted)' }}>{v}</div>
              ))}
              {/* Matrix rows */}
              {confMatrix.slice(0, vowels.length).map((row, ri) => (
                <>
                  <div key={`l-${ri}`} className="text-[8px] p-1 font-mono" style={{ color: 'var(--text-muted)' }}>{vowels[ri] ?? ri}</div>
                  {(Array.isArray(row) ? row : []).slice(0, vowels.length).map((cell, ci) => {
                    const flatCells = confMatrix.flatMap((r: unknown) => Array.isArray(r) ? r.map(Number) : []);
                    const maxCell = flatCells.length > 0 ? Math.max(...flatCells, 1) : 1;
                    const intensity = Number(cell) / maxCell;
                    return (
                      <div
                        key={`${ri}-${ci}`}
                        className="text-[8px] text-center p-1 rounded-sm tabular-nums"
                        style={{
                          backgroundColor: ri === ci
                            ? `rgba(139, 92, 246, ${0.1 + intensity * 0.5})`
                            : `rgba(255, 255, 255, ${intensity * 0.08})`,
                          color: ri === ci ? 'rgba(196, 181, 253, 0.9)' : 'rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        {Number(cell).toFixed(0)}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      )}

      <RunButton label="Run Again" onClick={run} />
    </div>
  );
}

// ─── Card: Memory Battery ────────────────────────────────────────────────────

function MemoryCard({ datasetId }: { datasetId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getMemoryTests(datasetId);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Memory tests failed');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} onRetry={run} />;

  if (!result) {
    return (
      <div className="space-y-2">
        <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Comprehensive memory battery: working memory, short-term, long-term, and associative memory assessments.
        </div>
        <RunButton label="Run Tests" onClick={run} />
      </div>
    );
  }

  const subs = (typeof result.subscores === 'object' && result.subscores !== null ? result.subscores : {}) as Record<string, unknown>;
  const overall = Number(result.overall_score ?? result.composite_score ?? result.memory_score ?? result.total_score ?? 0);
  const tests = [
    { name: 'Working', value: Number(subs.working_memory ?? result.working_memory ?? (result.working as Record<string, unknown>)?.score ?? 0) },
    { name: 'Short-term', value: Number(subs.short_term_memory ?? result.short_term ?? (result.short_term_memory as Record<string, unknown>)?.score ?? 0) },
    { name: 'Long-term', value: Number(subs.long_term_memory ?? result.long_term ?? (result.long_term_memory as Record<string, unknown>)?.score ?? 0) },
    { name: 'Associative', value: Number(subs.associative_memory ?? result.associative ?? (result.associative_memory as Record<string, unknown>)?.score ?? 0) },
  ];

  const maxVal = Math.max(...tests.map((t) => t.value <= 1 ? t.value * 100 : t.value), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-bold text-amber-400 tabular-nums">
          {(overall * (overall <= 1 ? 100 : 1)).toFixed(1)}
        </div>
        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>overall memory score</div>
      </div>

      <div className="space-y-1.5">
        <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Sub-scores</div>
        {tests.map((test, i) => (
          <Bar
            key={test.name}
            label={test.name}
            value={test.value * (test.value <= 1 ? 100 : 1)}
            maxValue={Math.max(maxVal, 100)}
            color="from-amber-500 to-orange-500"
            delay={i * 0.08}
          />
        ))}
      </div>

      <RunButton label="Run Again" onClick={run} />
    </div>
  );
}

// ─── Card: Closed-Loop Control ───────────────────────────────────────────────

function ClosedLoopCard({ datasetId }: { datasetId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.runClosedLoop(datasetId);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} onRetry={run} />;

  if (!result) {
    return (
      <div className="space-y-2">
        <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          DishBrain-style closed-loop: the organoid receives real-time feedback and adapts its neural responses over 100 trials.
        </div>
        <RunButton label="Run Simulation" onClick={run} />
      </div>
    );
  }

  const performance = Number(result.performance_score ?? result.success_rate ?? result.final_performance ?? result.mean_score ?? result.score ?? 0);
  const improvement = Number(result.improvement_pct ?? result.improvement ?? result.learning_improvement ?? 0);
  const trRaw = result.trial_results ?? result.learning_curve ?? result.trials ?? result.performance_curve ?? [];
  const trialResults = Array.isArray(trRaw) ? trRaw.map(Number) : [];
  const maxTrial = trialResults.length > 0 ? Math.max(...trialResults, 1) : 1;

  return (
    <div className="space-y-3">
      <div className="flex gap-6">
        <div>
          <div className="text-3xl font-bold text-pink-400 tabular-nums">
            {(performance * (performance <= 1 ? 100 : 1)).toFixed(1)}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Performance</div>
        </div>
        <div className="pl-4 border-l border-white/[0.06]">
          <div className="text-3xl font-bold tabular-nums" style={{ color: improvement >= 0 ? '#34d399' : '#f87171' }}>
            {improvement > 0 ? '+' : ''}{(improvement * (Math.abs(improvement) <= 1 ? 100 : 1)).toFixed(1)}%
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Improvement</div>
        </div>
      </div>

      {/* Trial performance curve */}
      {trialResults.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Trial Performance</div>
          <div className="flex items-end gap-px h-12">
            {(trialResults.length > 30
              ? trialResults.filter((_, i) => i % Math.ceil(trialResults.length / 30) === 0)
              : trialResults
            ).map((val, i) => {
              const v = Number(val);
              const pct = (v / maxTrial) * 100;
              return (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-pink-500/30 to-pink-400/70"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, pct)}%` }}
                  transition={{ duration: 0.4, delay: i * 0.015, ease: [0.16, 1, 0.3, 1] }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[8px]" style={{ color: 'var(--text-faint)' }}>
            <span>Start</span>
            <span>End</span>
          </div>
        </div>
      )}

      <RunButton label="Run Again" onClick={run} />
    </div>
  );
}

// ─── Card: Protocol Advisor ──────────────────────────────────────────────────

function ProtocolCard({ datasetId }: { datasetId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getSuggestProtocol(datasetId);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Protocol suggestion failed');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} onRetry={run} />;

  if (!result) {
    return (
      <div className="space-y-2">
        <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Heuristic analysis of firing rate and burst patterns to suggest an appropriate stimulation protocol.
        </div>
        <RunButton label="Get Suggestion" onClick={run} />
      </div>
    );
  }

  const protocolName = String(result.protocol ?? result.suggested_protocol ?? result.name ?? 'Unknown');
  const reason = String(result.reason ?? result.rationale ?? result.explanation ?? '');
  const params = (result.parameters ?? result.params ?? result.key_parameters ?? {}) as Record<string, unknown>;
  const confidence = Number(result.confidence ?? result.confidence_score ?? 0);

  const paramEntries = Object.entries(
    typeof params === 'object' && params !== null ? params : {}
  ).slice(0, 8);

  return (
    <div className="space-y-3">
      {/* Protocol name badge */}
      <div className="flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-violet-500/15 border border-cyan-500/20">
          <span className="text-[13px] font-medium text-cyan-400">{protocolName}</span>
        </div>
        {confidence > 0 && (
          <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {(confidence * (confidence <= 1 ? 100 : 1)).toFixed(0)}% confidence
          </span>
        )}
      </div>

      {/* Reason */}
      {reason && (
        <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{reason}</div>
      )}

      {/* Key parameters */}
      {paramEntries.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Key Parameters</div>
          <div className="grid grid-cols-2 gap-1">
            {paramEntries.map(([k, v]) => (
              <div key={k} className="px-2 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.04] min-w-0">
                <div className="text-[8px] capitalize truncate" style={{ color: 'var(--text-faint)' }}>{k.replace(/_/g, ' ')}</div>
                <div className="text-[11px] text-cyan-400/70 tabular-nums font-mono truncate">
                  {typeof v === 'number' ? (Number.isInteger(v) ? v : Number(v).toFixed(3)) : String(v)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <RunButton label="Get New Suggestion" onClick={run} />
    </div>
  );
}

// ─── Experiment definitions ──────────────────────────────────────────────────

interface ExperimentDef {
  title: string;
  desc: string;
  render: (datasetId: string) => React.ReactNode;
}

const EXPERIMENTS: ExperimentDef[] = [
  {
    title: 'DishBrain Pong',
    desc: 'Train organoid to play Pong using structured vs random stimulation feedback',
    render: (id) => <PongCard datasetId={id} />,
  },
  {
    title: 'Logic Gate Benchmark',
    desc: 'Test AND, OR, XOR, NAND, XNOR computation',
    render: (id) => <LogicCard datasetId={id} />,
  },
  {
    title: 'Brainoware Vowels',
    desc: 'Reservoir computing: classify 240 Japanese vowel samples',
    render: (id) => <VowelCard datasetId={id} />,
  },
  {
    title: 'Memory Battery',
    desc: 'Working, short-term, long-term, associative memory tests',
    render: (id) => <MemoryCard datasetId={id} />,
  },
  {
    title: 'Closed-Loop Control',
    desc: 'DishBrain mode: real-time feedback loop simulation',
    render: (id) => <ClosedLoopCard datasetId={id} />,
  },
  {
    title: 'Protocol Advisor',
    desc: 'Get recommended stimulation protocol based on organoid state',
    render: (id) => <ProtocolCard datasetId={id} />,
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ExperimentsPage() {
  const { datasetId, status, spikes } = useDashboardContext();

  if (status === 'loading' && spikes.length === 0) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!datasetId) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Generate or upload a dataset to run experiments</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-4"
      >
        <h1 className="text-[16px] sm:text-[18px] font-display" style={{ color: 'var(--text-primary)' }}>Experiments Hub</h1>
        <p className="text-[11px] sm:text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          6 computational experiments inspired by DishBrain & Brainoware research
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {EXPERIMENTS.map((exp, i) => (
          <motion.div
            key={exp.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 * i }}
          >
            <ChartCard title={exp.title} description={exp.desc}>
              {exp.render(datasetId)}
            </ChartCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
