'use client';

import { useState, useEffect } from 'react';
import * as api from '@/lib/api';
import ChartCard from './ChartCard';

type AnalysisSection = {
  key: string;
  title: string;
  desc: string;
  fetcher: (id: string) => Promise<Record<string, unknown>>;
  render: (data: Record<string, unknown>) => React.ReactNode;
};

function JsonBlock({ data, maxKeys = 12 }: { data: Record<string, unknown>; maxKeys?: number }) {
  const entries = Object.entries(data).slice(0, maxKeys);
  return (
    <div className="space-y-1.5 text-[11px] font-mono overflow-hidden">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2 min-w-0">
          <span className="shrink-0" style={{ color: 'var(--text-muted)' }}>{k}:</span>
          <span className="truncate" style={{ color: 'var(--accent-cyan)' }}>
            {typeof v === 'number' ? (Number.isInteger(v) ? v : Number(v).toFixed(4)) :
             typeof v === 'boolean' ? String(v) :
             typeof v === 'string' ? v :
             Array.isArray(v) ? `[${v.length} items]` :
             typeof v === 'object' && v !== null ? `{${Object.keys(v).length} keys}` :
             String(v)}
          </span>
        </div>
      ))}
      {Object.keys(data).length > maxKeys && (
        <div className="text-white/20">+ {Object.keys(data).length - maxKeys} more...</div>
      )}
    </div>
  );
}

function IQDisplay({ data }: { data: Record<string, unknown> }) {
  const score = Number(data.iq_score ?? data.score ?? 0);
  const grade = String(data.grade ?? '?');
  const dims = (data.dimensions ?? data.dimension_scores ?? {}) as Record<string, number>;

  const getColor = (s: number) => {
    if (s >= 80) return 'text-emerald-400';
    if (s >= 60) return 'text-cyan-400';
    if (s >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold tabular-nums">
          <span className={getColor(score)}>{score.toFixed(1)}</span>
          <span className="text-[16px] text-white/20">/100</span>
        </div>
        <div className={`text-2xl font-bold ${getColor(score)}`}>
          Grade {grade}
        </div>
      </div>
      {Object.keys(dims).length > 0 && (
        <div className="space-y-2">
          {Object.entries(dims).map(([dim, val]) => (
            <div key={dim} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/40 capitalize">{dim.replace(/_/g, ' ')}</span>
                <span className="text-white/60 tabular-nums">{Number(val).toFixed(1)}</span>
              </div>
              <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
                  style={{ width: `${Math.min(100, Number(val))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttractorDisplay({ data }: { data: Record<string, unknown> }) {
  const nAttractors = Number(data.n_attractors ?? 0);
  const memoryCandidates = Number(data.n_memory_candidates ?? data.memory_candidates ?? 0);

  return (
    <div className="space-y-3">
      <div className="flex gap-6">
        <div>
          <div className="text-2xl font-bold text-violet-400 tabular-nums">{nAttractors}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Attractors</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">{memoryCandidates}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Memory Candidates</div>
        </div>
      </div>
      <JsonBlock data={{
        n_attractors: data.n_attractors,
        n_memory_candidates: data.n_memory_candidates,
        stability: data.mean_stability ?? data.stability,
        max_basin_size: data.max_basin_size,
      } as Record<string, unknown>} maxKeys={4} />
    </div>
  );
}

function PhaseTransitionDisplay({ data }: { data: Record<string, unknown> }) {
  const transitions = (data.transitions ?? data.phase_transitions ?? []) as Array<Record<string, unknown>>;
  const nTransitions = Number(data.n_transitions ?? transitions.length);

  return (
    <div className="space-y-3">
      <div className="text-2xl font-bold text-amber-400 tabular-nums">
        {nTransitions} <span className="text-[14px] text-white/30">transitions detected</span>
      </div>
      {transitions.slice(0, 5).map((t, i) => (
        <div key={i} className="flex gap-3 text-[11px] py-1 border-b border-white/[0.04]">
          <span className="text-white/40">t={Number(t.time ?? t.time_sec ?? 0).toFixed(2)}s</span>
          <span className="text-amber-400/60">score: {Number(t.score ?? t.magnitude ?? 0).toFixed(3)}</span>
        </div>
      ))}
      {transitions.length > 5 && (
        <div className="text-[10px] text-white/20">+ {transitions.length - 5} more...</div>
      )}
    </div>
  );
}

const sections: AnalysisSection[] = [
  {
    key: 'iq',
    title: 'Organoid IQ',
    desc: 'Composite intelligence score (0-100) across 6 dimensions',
    fetcher: api.getOrganoidIQ,
    render: (d) => <IQDisplay data={d} />,
  },
  {
    key: 'attractors',
    title: 'Attractor Landscape',
    desc: 'Memory as dynamical attractors (Hopfield theory)',
    fetcher: api.getAttractors,
    render: (d) => <AttractorDisplay data={d} />,
  },
  {
    key: 'phase',
    title: 'Phase Transitions',
    desc: 'Neural reorganization moments + optimal stimulation timing',
    fetcher: api.getPhaseTransitions,
    render: (d) => <PhaseTransitionDisplay data={d} />,
  },
  {
    key: 'emergence',
    title: 'Causal Emergence (Phi)',
    desc: 'Integrated information — consciousness-like metric',
    fetcher: api.getEmergence,
    render: (d) => {
      const phi = Number(d.phi ?? d.phi_value ?? 0);
      return (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-cyan-400 tabular-nums">{phi.toFixed(4)}</span>
            <span className="text-[12px] text-white/30">bits</span>
          </div>
          <div className="text-[11px] text-white/40">
            {phi > 0.5 ? 'HIGH integration — system processes information as a whole' :
             phi > 0.1 ? 'Moderate integration — some whole-system processing' :
             'Low integration — mostly independent components'}
          </div>
          <JsonBlock data={d} maxKeys={6} />
        </div>
      );
    },
  },
  {
    key: 'weights',
    title: 'Synaptic Weights',
    desc: 'Inferred connectome from spike timing',
    fetcher: api.getWeights,
    render: (d) => <JsonBlock data={d} />,
  },
  {
    key: 'weightTracking',
    title: 'Weight Tracking',
    desc: 'Learning detection via weight changes over time',
    fetcher: api.getWeightTracking,
    render: (d) => <JsonBlock data={d} />,
  },
  {
    key: 'stdp',
    title: 'STDP Plasticity',
    desc: 'Spike-timing dependent plasticity curves',
    fetcher: api.getSTDP,
    render: (d) => <JsonBlock data={d} />,
  },
  {
    key: 'learning',
    title: 'Learning Episodes',
    desc: 'Temporal changes in plasticity = learning events',
    fetcher: api.getLearning,
    render: (d) => <JsonBlock data={d} />,
  },
  {
    key: 'predictiveCoding',
    title: 'Predictive Coding',
    desc: 'Does the organoid minimize prediction error?',
    fetcher: api.getPredictiveCoding,
    render: (d) => {
      const active = Boolean(d.predictive_coding_active ?? d.is_predictive ?? false);
      return (
        <div className="space-y-3">
          <div className={`text-2xl font-bold ${active ? 'text-emerald-400' : 'text-red-400'}`}>
            {active ? 'ACTIVE' : 'NOT DETECTED'}
          </div>
          <div className="text-[11px] text-white/40">
            {active ? 'Organoid shows free energy minimization' : 'No evidence of predictive processing'}
          </div>
          <JsonBlock data={d} maxKeys={6} />
        </div>
      );
    },
  },
  {
    key: 'replay',
    title: 'Neural Replay',
    desc: 'Memory consolidation during rest periods',
    fetcher: api.getReplay,
    render: (d) => <JsonBlock data={d} />,
  },
  {
    key: 'health',
    title: 'Organoid Health',
    desc: 'Viability assessment from signal quality',
    fetcher: api.getHealth,
    render: (d) => <JsonBlock data={d} />,
  },
  {
    key: 'multiscale',
    title: 'Multi-Timescale',
    desc: 'Complexity at 12 timescales',
    fetcher: api.getMultiscale,
    render: (d) => <JsonBlock data={d} />,
  },
];

export default function AdvancedAnalysis({ datasetId }: { datasetId: string }) {
  const [results, setResults] = useState<Record<string, Record<string, unknown>>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch all analyses in parallel
    sections.forEach(async (section) => {
      setLoading((prev) => ({ ...prev, [section.key]: true }));
      try {
        const data = await section.fetcher(datasetId);
        setResults((prev) => ({ ...prev, [section.key]: data }));
      } catch (e) {
        setErrors((prev) => ({ ...prev, [section.key]: e instanceof Error ? e.message : 'Failed' }));
      } finally {
        setLoading((prev) => ({ ...prev, [section.key]: false }));
      }
    });
  }, [datasetId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {sections.map((section) => (
        <ChartCard key={section.key} title={section.title} description={section.desc}>
          {loading[section.key] ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : errors[section.key] ? (
            <div className="text-[11px] text-red-400/60 py-4">{errors[section.key]}</div>
          ) : results[section.key] ? (
            section.render(results[section.key])
          ) : null}
        </ChartCard>
      ))}
    </div>
  );
}
