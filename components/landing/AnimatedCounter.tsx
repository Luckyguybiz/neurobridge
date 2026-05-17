'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

/** Parse "12K" / "2.6M" / "9" / "100" into a number + suffix part.
 *  We animate the NUMBER and append the suffix as-is — so "2.6M" goes
 *  0.0M → 2.6M (one decimal preserved), "12K" goes 0K → 12K, etc. */
function parseValue(s: string): { num: number; decimals: number; tail: string } | null {
  const m = s.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const numStr = m[1];
  const dotIx = numStr.indexOf('.');
  const decimals = dotIx >= 0 ? numStr.length - dotIx - 1 : 0;
  return { num: parseFloat(numStr), decimals, tail: m[2] };
}

export default function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reducedMotion = useReducedMotion();

  // useMemo — without this, parseValue returns a fresh object every render,
  // which (since it's in the effect deps) cancels & restarts the rAF loop
  // on every paint. The animation gets stuck near zero, never finishing.
  const parsed = useMemo(() => parseValue(value), [value]);

  const [display, setDisplay] = useState<string>(() =>
    parsed && !reducedMotion ? `${(0).toFixed(parsed.decimals)}${parsed.tail}` : value
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync to value prop change
    if (!parsed) { setDisplay(value); return; }
    if (!isInView) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync to reduced-motion preference change
    if (reducedMotion) { setDisplay(value); return; }

    const duration = 1400;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = parsed.num * eased;
      setDisplay(`${current.toFixed(parsed.decimals)}${parsed.tail}`);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value); // EXACT final string (avoids float rounding)
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, value, parsed, reducedMotion]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4 }}
      aria-label={value + suffix}
    >
      {display}{suffix}
    </motion.span>
  );
}
