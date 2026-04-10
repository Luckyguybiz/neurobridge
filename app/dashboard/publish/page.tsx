'use client';

import { useState, useEffect, useCallback } from 'react';
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
      <span className="text-white/30 w-16 truncate shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-white/50 w-12 tabular-nums text-right shrink-0">
        {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
      </span>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface DraftResult {
  title: string;
  word_count?: number;
  sections?: string[];
  markdown: string;
}

interface Grant {
  name: string;
  funder: string;
  amount: string | number;
  match_score: number;
  deadline: string;
  gaps?: string[];
}

// ─── Paper Generator ─────────────────────────────────────────────────────────

function PaperGenerator({ datasetId }: { datasetId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError('');
    setCopied(false);
    try {
      const data = await api.generateDraft(datasetId);
      setDraft({
        title: String(data.title ?? data.paper_title ?? 'Untitled Draft'),
        word_count: Number(data.word_count ?? data.wordcount ?? data.words ?? 0) || undefined,
        sections: (data.sections ?? data.section_titles ?? data.outline ?? []) as string[],
        markdown: String(data.markdown ?? data.content ?? data.text ?? data.body ?? ''),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Draft generation failed');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  const copyToClipboard = useCallback(async () => {
    if (!draft?.markdown) return;
    try {
      await navigator.clipboard.writeText(draft.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = draft.markdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [draft]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} onRetry={generate} />;

  if (!draft) {
    return (
      <div className="space-y-2">
        <div className="text-[11px] text-white/40 leading-relaxed">
          Generate a publication-ready draft based on your organoid dataset analysis.
          Includes abstract, methods, results, and discussion sections.
        </div>
        <button
          onClick={generate}
          className="mt-3 px-4 py-1.5 rounded-full text-[11px] font-medium bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
        >
          Generate Draft
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Title & word count */}
      <div>
        <div className="text-[14px] font-display text-white/85">{draft.title}</div>
        {draft.word_count != null && draft.word_count > 0 && (
          <div className="text-[10px] text-white/30 mt-0.5 tabular-nums">
            {draft.word_count.toLocaleString()} words
          </div>
        )}
      </div>

      {/* Sections list */}
      {draft.sections && draft.sections.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] text-white/20 uppercase tracking-widest">Sections</div>
          <div className="flex flex-wrap gap-1.5">
            {draft.sections.map((section, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/40"
              >
                {section}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Markdown preview */}
      {draft.markdown && (
        <div className="space-y-1.5">
          <div className="text-[9px] text-white/20 uppercase tracking-widest">Preview</div>
          <pre className="max-h-64 overflow-auto rounded-lg bg-[#0a0b10] border border-white/[0.06] p-3 text-[10px] text-white/50 leading-relaxed font-mono whitespace-pre-wrap">
            {draft.markdown}
          </pre>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={copyToClipboard}
          className="px-4 py-1.5 rounded-full text-[11px] font-medium bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        <button
          onClick={generate}
          className="px-4 py-1.5 rounded-full text-[11px] font-medium bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white/70 transition-all duration-300"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}

// ─── Grant Matching ──────────────────────────────────────────────────────────

function GrantMatching({ datasetId }: { datasetId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grants, setGrants] = useState<Grant[]>([]);

  const fetchGrants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getGrantMatch(datasetId);
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as Record<string, unknown>).grants)
          ? ((data as Record<string, unknown>).grants as Grant[])
          : Array.isArray((data as Record<string, unknown>).matches)
            ? ((data as Record<string, unknown>).matches as Grant[])
            : [];
      // Sort by match_score descending
      const sorted = (list as Grant[]).sort(
        (a, b) => (Number(b.match_score) || 0) - (Number(a.match_score) || 0)
      );
      setGrants(sorted);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load grants');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    fetchGrants();
  }, [fetchGrants]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} onRetry={fetchGrants} />;

  if (grants.length === 0) {
    return (
      <div className="text-[11px] text-white/40 leading-relaxed">
        No matching grants found for this dataset.
      </div>
    );
  }

  const maxScore = Math.max(...grants.map((g) => Number(g.match_score) || 0), 1);

  return (
    <div className="space-y-3">
      {grants.map((grant, i) => {
        const score = Number(grant.match_score) || 0;
        const isTop = i === 0;
        const scorePct = score <= 1 ? score * 100 : score;
        const gaps = grant.gaps ?? [];

        // Color based on score
        const barColor =
          scorePct >= 80
            ? 'from-emerald-500 to-cyan-500'
            : scorePct >= 50
              ? 'from-cyan-500 to-violet-500'
              : 'from-violet-500 to-pink-500';

        return (
          <motion.div
            key={grant.name ?? i}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * i }}
            className={`rounded-xl p-3 space-y-2 border ${
              isTop
                ? 'bg-gradient-to-br from-emerald-500/[0.06] to-cyan-500/[0.06] border-emerald-500/20'
                : 'bg-white/[0.02] border-white/[0.04]'
            }`}
          >
            {/* Grant name & funder */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[12px] font-medium text-white/80">{grant.name}</div>
                <div className="text-[10px] text-white/30">{grant.funder}</div>
              </div>
              {isTop && (
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[9px] font-medium text-emerald-400">
                  Top Match
                </span>
              )}
            </div>

            {/* Amount & deadline */}
            <div className="flex gap-4 text-[10px]">
              <div>
                <span className="text-white/25">Amount: </span>
                <span className="text-white/50 tabular-nums">
                  {typeof grant.amount === 'number'
                    ? `$${grant.amount.toLocaleString()}`
                    : grant.amount}
                </span>
              </div>
              {grant.deadline && (
                <div>
                  <span className="text-white/25">Deadline: </span>
                  <span className="text-white/50 tabular-nums">{grant.deadline}</span>
                </div>
              )}
            </div>

            {/* Match score bar */}
            <Bar
              label="Match"
              value={scorePct}
              maxValue={maxScore <= 1 ? 100 : maxScore}
              color={barColor}
              delay={0.1 * i}
            />

            {/* Gaps */}
            {gaps.length > 0 && (
              <div className="space-y-0.5">
                {gaps.map((gap, gi) => (
                  <div key={gi} className="text-[9px] text-white/20 leading-relaxed">
                    {gap}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PublishPage() {
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
        <div className="text-[13px] text-white/30">Generate or upload a dataset to publish</div>
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
        <h1 className="text-[18px] font-display text-white/80">Publish & Funding</h1>
        <p className="text-[12px] text-white/30 mt-0.5">
          Generate publication drafts and find matching grant opportunities
        </p>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left: Paper Generator */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
        >
          <ChartCard title="Paper Generator" description="AI-powered publication draft from your dataset">
            <PaperGenerator datasetId={datasetId} />
          </ChartCard>
        </motion.div>

        {/* Right: Grant Matching */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          <ChartCard title="Grant Matching" description="Grants ranked by compatibility with your research">
            <GrantMatching datasetId={datasetId} />
          </ChartCard>
        </motion.div>
      </div>
    </div>
  );
}
