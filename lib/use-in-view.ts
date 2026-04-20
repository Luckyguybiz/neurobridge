'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Detects when an element scrolls into (near) the viewport.
 *
 * Once seen, stays `true` forever — we don't want to unload data just because
 * the user scrolled past. `rootMargin` pre-arms loading a bit before the card
 * actually appears so content is ready when the user gets there.
 */
export function useInView<T extends Element = HTMLDivElement>(
  rootMargin: string = '200px',
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;

    // Fallback for old browsers / SSR — assume visible
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, rootMargin]);

  return [ref, inView];
}
