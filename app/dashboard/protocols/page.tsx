'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface Protocol {
  name: string;
  description: string;
  reference_paper?: string;
  parameters?: Record<string, unknown>;
}

// ─── Protocol Card ───────────────────────────────────────────────────────────

function ProtocolItem({
  protocol,
  isRecommended,
  index,
}: {
  protocol: Protocol;
  isRecommended: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const params = protocol.parameters ?? {};
  const paramEntries = Object.entries(
    typeof params === 'object' && params !== null ? params : {}
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.06 * index }}
    >
      <ChartCard title={protocol.name} description={protocol.description}>
        <div className="space-y-3">
          {/* Recommended badge */}
          {isRecommended && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/25">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-400">Recommended</span>
            </div>
          )}

          {/* Reference paper */}
          {protocol.reference_paper && (
            <p className="text-[10px] text-white/30 italic leading-relaxed">
              {protocol.reference_paper}
            </p>
          )}

          {/* View Details toggle */}
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="px-4 py-1.5 rounded-full text-[11px] font-medium bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          >
            {expanded ? 'Hide Details' : 'View Details'}
          </button>

          {/* Expandable parameters section */}
          <AnimatePresence>
            {expanded && paramEntries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-1 pt-1">
                  <div className="text-[9px] text-white/20 uppercase tracking-widest">Parameters</div>
                  <div className="grid grid-cols-2 gap-1">
                    {paramEntries.map(([key, val]) => (
                      <div
                        key={key}
                        className="px-2 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.04]"
                      >
                        <div className="text-[8px] text-white/25 capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[11px] text-cyan-400/70 tabular-nums font-mono">
                          {typeof val === 'number'
                            ? Number.isInteger(val)
                              ? val
                              : Number(val).toFixed(3)
                            : typeof val === 'boolean'
                              ? val ? 'true' : 'false'
                              : String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No parameters fallback */}
          <AnimatePresence>
            {expanded && paramEntries.length === 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="text-[10px] text-white/20 pt-1">No parameters available</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ChartCard>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProtocolsPage() {
  const { datasetId, status, spikes } = useDashboardContext();

  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState('');

  const fetchProtocols = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getProtocols();
      // API may return { protocols: [...] } or an array directly
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as Record<string, unknown>).protocols)
          ? ((data as Record<string, unknown>).protocols as Protocol[])
          : Object.values(data).flat();
      setProtocols(list as Protocol[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load protocols');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuggestion = useCallback(async () => {
    if (!datasetId) return;
    setSuggestLoading(true);
    setSuggestError('');
    try {
      const data = await api.getSuggestProtocol(datasetId);
      const name = String(
        data.protocol ?? data.suggested_protocol ?? data.name ?? ''
      );
      setSuggestedName(name || null);
    } catch (e) {
      setSuggestError(e instanceof Error ? e.message : 'Suggestion failed');
    } finally {
      setSuggestLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    fetchProtocols();
  }, [fetchProtocols]);

  if (status === 'loading' && spikes.length === 0) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
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
        className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-[18px] font-display text-white/80">Protocol Library</h1>
          <p className="text-[12px] text-white/30 mt-0.5">
            Available stimulation protocols for organoid experiments
          </p>
        </div>

        {/* Suggest Protocol button */}
        {datasetId && (
          <button
            onClick={fetchSuggestion}
            disabled={suggestLoading}
            className="self-start px-5 py-2 rounded-full text-[12px] font-medium bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:from-violet-400 hover:to-cyan-400 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(139,92,246,0.2)]"
          >
            {suggestLoading ? 'Analyzing...' : 'Suggest Protocol'}
          </button>
        )}
      </motion.div>

      {/* Suggest error */}
      {suggestError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-3 text-[11px] text-red-400/80"
        >
          {suggestError}
        </motion.div>
      )}

      {/* Suggestion result banner */}
      {suggestedName && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20"
        >
          <span className="text-[11px] text-white/40">AI Recommendation: </span>
          <span className="text-[13px] font-medium text-emerald-400">{suggestedName}</span>
        </motion.div>
      )}

      {/* Loading state */}
      {loading && <Spinner />}

      {/* Error state */}
      {error && !loading && <ErrorMsg message={error} onRetry={fetchProtocols} />}

      {/* Protocol grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {protocols.map((protocol, i) => (
            <ProtocolItem
              key={protocol.name ?? i}
              protocol={protocol}
              isRecommended={
                suggestedName != null &&
                protocol.name?.toLowerCase() === suggestedName.toLowerCase()
              }
              index={i}
            />
          ))}

          {protocols.length === 0 && (
            <div className="col-span-full flex items-center justify-center py-20">
              <div className="text-[13px] text-white/30">No protocols available</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
