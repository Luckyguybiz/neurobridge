'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
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

export function SubsetProvider({ children }: { children: ReactNode }) {
  const [subset, setSubsetState] = useState<Subset>(DEFAULT_SUBSET);

  // Hydrate from sessionStorage on client mount. SSR renders with the default,
  // then effect picks up any prior choice. A one-frame flash of the default is
  // acceptable — the selector is at the top of the header and the network
  // request hasn't fired yet by the time this runs.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === '1h' || stored === '10h' || stored === 'full') {
        setSubsetState(stored);
      }
    } catch {
      // sessionStorage unavailable (private mode, SSR) — use default silently
    }
  }, []);

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
