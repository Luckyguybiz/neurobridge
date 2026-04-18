'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useDashboardContext } from '@/lib/dashboard-context';
import { useCachedAnalysis } from '@/lib/use-cached-analysis';
import { getThemeColors } from '@/lib/utils';
import * as api from '@/lib/api';
import ChartCard from '@/components/dashboard/ChartCard';

// ─── Circular Gauge ───────────────────────────────────────────────────────────
// 270° sweep: from 7:30 (225° CW from top) to 4:30 (135° CW from top)
// Convention: angle 0 = top, positive = clockwise

function angleToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180); // -90 so 0° points up
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = angleToXY(cx, cy, r, startDeg);
  const end   = angleToXY(cx, cy, r, endDeg);
  const span  = endDeg - startDeg;
  const large = span > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)},${start.y.toFixed(2)} A ${r},${r} 0 ${large},1 ${end.x.toFixed(2)},${end.y.toFixed(2)}`;
}

const GAUGE_START = 225; // degrees CW from top
const GAUGE_SPAN  = 270; // total degrees

function CircularGauge({ value, max = 100, grade }: { value: number; max?: number; grade: string }) {
  const tc = getThemeColors();
  const cx = 110, cy = 110, r = 82, sw = 14;
  const vRatio  = Math.max(0, Math.min(1, value / max));
  const bgEnd   = GAUGE_START + GAUGE_SPAN;          // 495° (= 135° CW)
  const valEnd  = GAUGE_START + GAUGE_SPAN * vRatio;
  const noArc   = vRatio < 0.005;

  const getColor = (s: number) => {
    if (s >= 80) return '#4ade80';
    if (s >= 60) return '#22d3ee';
    if (s >= 40) return '#facc15';
    return '#f87171';
  };
  const color = getColor(value);

  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-[220px]">
      <defs>
        <linearGradient id="gaugeGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="220" y2="0">
          <stop offset="0%"   stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        {/* Glow filter */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background track */}
      <path
        d={arcPath(cx, cy, r, GAUGE_START, bgEnd)}
        fill="none"
        stroke={tc.grid}
        strokeWidth={sw}
        strokeLinecap="round"
      />

      {/* Tick marks */}
      {Array.from({ length: 11 }, (_, i) => {
        const deg = GAUGE_START + (GAUGE_SPAN / 10) * i;
        const inner = angleToXY(cx, cy, r - sw / 2 - 4, deg);
        const outer = angleToXY(cx, cy, r + sw / 2 + 4, deg);
        return (
          <line
            key={i}
            x1={inner.x} y1={inner.y}
            x2={outer.x} y2={outer.y}
            stroke={tc.axis}
            strokeWidth={i % 5 === 0 ? 2 : 1}
          />
        );
      })}

      {/* Value arc */}
      {!noArc && (
        <path
          d={arcPath(cx, cy, r, GAUGE_START, valEnd)}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={sw}
          strokeLinecap="round"
          filter="url(#glow)"
        />
      )}

      {/* Needle dot at end */}
      {!noArc && (() => {
        const dot = angleToXY(cx, cy, r, valEnd);
        return (
          <circle
            cx={dot.x} cy={dot.y} r={sw / 2 + 1}
            fill={color}
            filter="url(#glow)"
          />
        );
      })()}

      {/* Center content */}
      <text x={cx} y={cy - 14} textAnchor="middle" fill={tc.text} fontSize="36" fontWeight="700" fontFamily="monospace">{value.toFixed(0)}</text>
      <text x={cx} y={cy + 8}  textAnchor="middle" fill={tc.textMuted} fontSize="13">/100</text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill={color} fontSize="22" fontWeight="700">{grade}</text>

      {/* Min / max labels */}
      <text x={angleToXY(cx, cy, r + 20, GAUGE_START).x} y={angleToXY(cx, cy, r + 20, GAUGE_START).y + 4}
        textAnchor="middle" fill={tc.textFaint} fontSize="9">0</text>
      <text x={angleToXY(cx, cy, r + 20, bgEnd).x} y={angleToXY(cx, cy, r + 20, bgEnd).y + 4}
        textAnchor="middle" fill={tc.textFaint} fontSize="9">100</text>
    </svg>
  );
}

// ─── Subscore Bar ─────────────────────────────────────────────────────────────

function SubscoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 80 ? 'from-emerald-500 to-emerald-400'
              : pct >= 60 ? 'from-cyan-500 to-cyan-400'
              : pct >= 40 ? 'from-amber-500 to-amber-400'
              :             'from-red-500 to-red-400';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="capitalize" style={{ color: 'var(--text-muted)' }}>{label.replace(/_/g, ' ')}</span>
        <span className="tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

// ─── Health Display ───────────────────────────────────────────────────────────

function HealthDisplay({ data }: { data: Record<string, unknown> }) {
  const score = Number(data.health_score ?? data.viability_score ?? data.score ?? 0);
  const status = String(data.status ?? data.health_status ?? data.viability ?? '—');
  const entries = Object.entries(data).filter(([k]) => !['status', 'health_status', 'viability'].includes(k)).slice(0, 8);

  const getColor = (s: number) => s >= 70 ? 'text-emerald-400' : s >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className={`text-3xl font-bold tabular-nums ${getColor(score)}`}>{score.toFixed(1)}</span>
        <div>
          <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Health Score</div>
          <div className={`text-[13px] font-medium capitalize ${getColor(score)}`}>{status}</div>
        </div>
      </div>
      <div className="space-y-1 font-mono text-[10px]">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className="w-auto min-w-[80px] shrink-0" style={{ color: 'var(--text-muted)' }}>{k}:</span>
            <span className="text-cyan-400/60 break-all">
              {typeof v === 'number' ? (Number.isInteger(v) ? v : Number(v).toFixed(4)) :
               typeof v === 'boolean' ? (v ? '✓ yes' : '✗ no') :
               typeof v === 'string' ? v :
               Array.isArray(v) ? `[${(v as unknown[]).length} items]` :
               typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fingerprint Display ──────────────────────────────────────────────────────

function FingerprintDisplay({ data }: { data: Record<string, unknown> }) {
  const hash       = String(data.fingerprint ?? data.hash ?? data.fingerprint_hash ?? '—');
  const similarity = Number(data.similarity ?? data.self_similarity ?? 0);
  const uniqueness = Number(data.uniqueness ?? 0);

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Fingerprint Hash</div>
        <div className="font-mono text-[11px] text-cyan-400/70 break-all bg-white/[0.03] border border-white/[0.04] rounded-lg px-3 py-2">
          {hash}
        </div>
      </div>
      {similarity > 0 && (
        <div className="flex gap-4 text-[11px]">
          <div>
            <div className="mb-0.5" style={{ color: 'var(--text-muted)' }}>Self-Similarity</div>
            <div className="text-violet-400 tabular-nums">{(similarity * 100).toFixed(1)}%</div>
          </div>
          {uniqueness > 0 && (
            <div>
              <div className="mb-0.5" style={{ color: 'var(--text-muted)' }}>Uniqueness</div>
              <div className="text-cyan-400 tabular-nums">{(uniqueness * 100).toFixed(1)}%</div>
            </div>
          )}
        </div>
      )}
      <div className="space-y-1 font-mono text-[10px]">
        {Object.entries(data)
          .filter(([k]) => !['fingerprint', 'hash', 'fingerprint_hash'].includes(k))
          .slice(0, 6)
          .map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="w-auto min-w-[80px] shrink-0" style={{ color: 'var(--text-muted)' }}>{k}:</span>
              <span className="break-all" style={{ color: 'var(--text-secondary)' }}>
                {typeof v === 'number' ? Number(v).toFixed(4) :
                 typeof v === 'boolean' ? String(v) :
                 typeof v === 'string' ? v :
                 Array.isArray(v) ? `[${(v as unknown[]).length}]` :
                 typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IQPage() {
  const { datasetId, status, spikes } = useDashboardContext();

  const iq          = useCachedAnalysis(datasetId, 'iq',          () => api.getOrganoidIQ(datasetId!));
  const health      = useCachedAnalysis(datasetId, 'health',      () => api.getHealth(datasetId!));
  const fingerprint = useCachedAnalysis(datasetId, 'fingerprint', () => api.getFingerprint(datasetId!));
  const ethics      = useCachedAnalysis(datasetId, 'ethics',      () => api.getEthics(datasetId!));

  if (status === 'loading' && spikes.length === 0) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  const iqData = iq.data;
  const score = Number(iqData?.iq_score ?? iqData?.score ?? 0);
  const grade = String(iqData?.grade ?? '—');
  const dims  = (iqData?.dimensions ?? iqData?.dimension_scores ?? iqData?.subscores ?? iqData?.sub_scores ?? {}) as Record<string, number>;
  const dimEntries = Object.entries(dims);

  const getGradeDesc = (g: string) => {
    const map: Record<string, string> = {
      'A+': 'Exceptional — top 1% computational capability',
      A:   'Outstanding neural computational performance',
      'A-': 'Very strong information processing capacity',
      'B+': 'Above average with good learning potential',
      B:   'Average organoid intelligence benchmark',
      C:   'Below average — developing neural circuits',
      D:   'Early-stage or low-activity organoid',
      F:   'Minimal neural activity detected',
    };
    return map[g] ?? 'Organoid intelligence assessment result';
  };

  return (
    <div className="p-3 sm:p-4 space-y-3">
      {/* Hero: gauge + grade + subscores */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ChartCard title="Organoid IQ Score" description="Composite Computational Capacity Index — 6 dimensions based on Quiroga 2004, Schreiber 2000, Watts & Strogatz 1998, Bi & Poo 1998" loading={iq.loading} error={iq.error}>
          {iqData && (
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
              {/* Gauge column */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <CircularGauge value={score} grade={grade} />
                <div className="text-center max-w-[200px]">
                  <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{getGradeDesc(grade)}</div>
                </div>
              </div>

              {/* Subscores column */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Dimension Scores</div>
                {dimEntries.length > 0
                  ? dimEntries.map(([dim, val]) => (
                      <SubscoreBar key={dim} label={dim} value={val} />
                    ))
                  : (
                    <div className="space-y-1 font-mono text-[11px]">
                      {Object.entries(iqData)
                        .filter(([k]) => !['grade', 'iq_score', 'score', 'dimensions', 'dimension_scores'].includes(k))
                        .slice(0, 10)
                        .map(([k, v]) => (
                          <div key={k} className="flex gap-2 py-1 border-b border-white/[0.03]">
                            <span className="w-36 truncate" style={{ color: 'var(--text-muted)' }}>{k}:</span>
                            <span className="text-cyan-400/70">
                              {typeof v === 'number' ? (Number.isInteger(v) ? v : Number(v).toFixed(4)) :
                               typeof v === 'boolean' ? String(v) :
                               typeof v === 'string' ? v :
                               Array.isArray(v) ? `[${(v as unknown[]).length}]` :
                               typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )
                }
              </div>
            </div>
          )}
        </ChartCard>
      </motion.div>

      {/* Bottom row: Health + Fingerprint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ChartCard title="Organoid Health" description="Viability and signal quality assessment" loading={health.loading} error={health.error}>
            {health.data && <HealthDisplay data={health.data} />}
          </ChartCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <ChartCard title="Neural Fingerprint" description="Unique activity signature hash for organoid identification" loading={fingerprint.loading} error={fingerprint.error}>
            {fingerprint.data && <FingerprintDisplay data={fingerprint.data} />}
          </ChartCard>
        </motion.div>
      </div>

      {/* Ethics Badge */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <ChartCard title="Sentience Ethics" description="Risk assessment for organoid sentience" loading={ethics.loading} error={ethics.error}>
          {ethics.data && (() => {
            const sentience = (ethics.data.sentience_risk ?? {}) as Record<string, unknown>;
            const riskScore = Number(sentience.overall_score ?? ethics.data.sentience_score ?? ethics.data.risk_score ?? 0);
            const riskLevel = String(sentience.risk_level ?? ethics.data.risk_level ?? ethics.data.overall_risk_level ?? 'unknown');
            const isHigh = riskLevel.toLowerCase().includes('high') || riskLevel.toLowerCase().includes('critical');
            const isMed  = riskLevel.toLowerCase().includes('moderate') || riskLevel.toLowerCase().includes('medium');
            const badgeColor = isHigh ? 'bg-red-500/15 text-red-400 border-red-500/20'
                             : isMed  ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                             :          'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
            return (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-secondary)' }}>{(riskScore * 100).toFixed(1)}%</div>
                <div className={`px-3 py-1 rounded-lg border text-[11px] font-bold ${badgeColor}`}>
                  {riskLevel.toUpperCase()}
                </div>
                <Link
                  href="/dashboard/discovery"
                  className="ml-auto text-[11px] text-cyan-400/70 hover:text-cyan-400 transition-colors"
                >
                  View Details →
                </Link>
              </div>
            );
          })()}
        </ChartCard>
      </motion.div>

      {/* Radar Chart + Comparative row */}
      {datasetId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <ChartCard title="IQ Radar" description="6-dimension intelligence profile">
              {dimEntries.length > 0 ? (
                <RadarChart dimensions={dimEntries} />
              ) : (
                <div className="text-[11px] py-4" style={{ color: 'var(--text-muted)' }}>Loading dimensions...</div>
              )}
            </ChartCard>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
            <ChartCard title="Comparative Analysis" description="Your organoid vs known neural systems">
              <ComparativeCard datasetId={datasetId} />
            </ChartCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Radar Chart ─────────────────────────────────────────────────────────────

function RadarChart({ dimensions }: { dimensions: [string, number][] }) {
  const tc = getThemeColors();
  const n = dimensions.length;
  if (n < 3) return null;

  const cx = 100, cy = 100, r = 75;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (i: number, value: number) => {
    const angle = angleStep * i - Math.PI / 2;
    const dist = (value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const rings = [25, 50, 75, 100];
  const points = dimensions.map(([, v], i) => getPoint(i, v));

  return (
    <div className="flex justify-center py-2">
      <svg viewBox="0 0 200 200" className="w-full max-w-[240px]">
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={Array.from({ length: n }, (_, i) => {
              const p = getPoint(i, ring);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none" stroke={tc.grid} strokeWidth={0.5}
          />
        ))}
        {dimensions.map(([,], i) => {
          const end = getPoint(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={tc.grid} strokeWidth={0.5} />;
        })}
        <polygon points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(34,211,238,0.12)" stroke="rgba(34,211,238,0.5)" strokeWidth={1.5} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#22d3ee" />
        ))}
        {dimensions.map(([label], i) => {
          const lp = getPoint(i, 118);
          return (
            <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fill={tc.textMuted} className="text-[7px] capitalize">
              {label.replace(/_/g, ' ').slice(0, 12)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Comparative Card ────────────────────────────────────────────────────────

function ComparativeCard({ datasetId }: { datasetId: string }) {
  const { data, loading, error } = useCachedAnalysis(datasetId, 'comparative', () => api.getComparative(datasetId));

  if (error) return <div className="text-[11px] text-red-400/60 py-4">{error}</div>;
  if (loading || !data) return <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" /></div>;

  // Support both old format {most_similar_system, similarities: {name: {similarity, description}}}
  // and new format {ranking: [{name, similarity, description}], similarities: {...}}
  const rankRaw = data.ranking ?? [];
  const ranking = Array.isArray(rankRaw) ? rankRaw as Array<Record<string, unknown>> : [];
  const simRaw = data.similarities ?? {};
  const similaritiesRaw = (typeof simRaw === 'object' && simRaw !== null && !Array.isArray(simRaw) ? simRaw : {}) as Record<string, unknown>;

  // Build a normalized list of systems with similarity + description
  let systems: Array<[string, { similarity: number; description: string }]> = [];

  if (ranking.length > 0) {
    // New format: ranking is an array of objects
    systems = ranking.map((item) => [
      String(item.name ?? item.system ?? 'unknown'),
      {
        similarity: Number(item.similarity ?? item.score ?? 0),
        description: String(item.description ?? ''),
      },
    ]);
  } else if (typeof similaritiesRaw === 'object' && similaritiesRaw !== null) {
    // Old format: similarities is a dict {name: {similarity, description}}
    systems = Object.entries(similaritiesRaw)
      .map(([name, val]) => {
        const v = (typeof val === 'object' && val !== null ? val : {}) as Record<string, unknown>;
        return [name, {
          similarity: Number(v.similarity ?? v.score ?? 0),
          description: String(v.description ?? ''),
        }] as [string, { similarity: number; description: string }];
      });
  }

  systems.sort((a, b) => b[1].similarity - a[1].similarity);

  const topSystem = systems[0];
  const mostSimilar = String(data.most_similar_system ?? topSystem?.[0] ?? 'unknown');
  const mostSimilarScore = Number(data.most_similar_score ?? topSystem?.[1]?.similarity ?? 0);
  const mostSimilarDesc = String(data.most_similar_description ?? topSystem?.[1]?.description ?? '');

  return (
    <div className="space-y-3">
      <div className="px-3 py-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/10">
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Most similar to</div>
        <div className="text-sm font-bold text-violet-400 capitalize">{mostSimilar.replace(/_/g, ' ')}</div>
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{mostSimilarDesc}</div>
        <div className="text-[11px] text-violet-400/70 tabular-nums mt-1">{(mostSimilarScore * 100).toFixed(0)}% match</div>
      </div>
      <div className="space-y-2">
        {systems.map(([name, info]) => (
          <div key={name} className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="capitalize" style={{ color: 'var(--text-muted)' }}>{name.replace(/_/g, ' ')}</span>
              <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{(info.similarity * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${info.similarity * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${name === mostSimilar ? 'bg-gradient-to-r from-violet-500 to-cyan-500' : 'bg-white/10'}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
