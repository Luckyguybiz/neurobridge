'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Subset } from './api';

/**
 * Dataset time-slice selector.
 *
 * Heavy analysis endpoints (transfer-entropy, consciousness, IIT) can't
 * complete on the full 118h FinalSpark recording — complexity scales with
 * BINS × PAIRS. The user picks a subset ("1h"/"10h"/"full") from the header;
 * that choice is appended as ?subset= to every heavy fetch.
 *
 * Persisted in sessionStorage so the choice survives navigation but not
 * "I'm opening a fresh tab" — we want new visitors to start at a fast
 * default (1h) rather than inheriting someone else's 10h setting.
 */

const STORAGE_KEY = 'nb:subset';
const DEFAULT_SUBSET: Subset = '1h';

type SubsetContextValue = {
  subset: Subset;
  setSubset: (s: Subset) => void;
  clearCacheOnChange: boolean;
};

const SubsetContext = createContext<SubsetContextValue | null>(null);

// Read prior choice from sessionStorage on first client render. On SSR returns
// the default — a one-frame flash is acceptable since the selector is at the
// top of the header and no fetches fire before hydration completes.
function readInitialSubset(): Subset {
  if (typeof window === 'undefined') return DEFAULT_SUBSET;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === '1h' || stored === '10h' || stored === 'full') return stored;
  } catch {
    // sessionStorage unavailable (private mode) — use default silently
  }
  return DEFAULT_SUBSET;
}

export function SubsetProvider({ children }: { children: ReactNode }) {
  const [subset, setSubsetState] = useState<Subset>(readInitialSubset);

  const setSubset = useCallback((s: Subset) => {
    setSubsetState(s);
    try {
      if (s) sessionStorage.setItem(STORAGE_KEY, s);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Swallow — non-critical
    }
  }, []);

  return (
    <SubsetContext.Provider value={{ subset, setSubset, clearCacheOnChange: true }}>
      {children}
    </SubsetContext.Provider>
  );
}

export function useSubset(): SubsetContextValue {
  const ctx = useContext(SubsetContext);
  if (!ctx) {
    // Fallback for components that render outside the provider (storybook,
    // tests). Returns a stable no-op so they don't crash.
    return { subset: DEFAULT_SUBSET, setSubset: () => {}, clearCacheOnChange: false };
  }
  return ctx;
}
