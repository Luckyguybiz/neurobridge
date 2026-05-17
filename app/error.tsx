'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Page-level error boundary. Catches errors thrown in client components
 * rendered by /app routes. Less catastrophic than `global-error` — the root
 * layout (and theme system) is still alive, so we can render styled UI.
 *
 * Next.js automatically renders this in place of the failing segment.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in console with stable label for log triage. Replace with
    // proper telemetry (Sentry) when wired in.
    console.error('[app/error.tsx]', error);
  }, [error]);

  return (
    <div
      className="min-h-[60vh] flex items-center justify-center px-4 relative overflow-hidden"
      style={{ color: 'var(--text-primary)' }}
    >
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: 'var(--bio-error-500)', opacity: 'calc(var(--ambient-blob-opacity) * 1.5)' }}
      />

      <div className="text-center max-w-md relative z-10 anim-spring-in">
        <div
          className="font-display"
          style={{
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: '-0.025em',
            color: 'var(--bio-error-500)',
            marginBottom: 'var(--space-3)',
          }}
        >
          ⚠
        </div>
        <h1
          className="font-display"
          style={{
            fontSize: 'var(--t-2xl)',
            fontWeight: 'var(--tw-semibold)',
            lineHeight: 1.15,
            letterSpacing: '-0.022em',
            marginBottom: 'var(--space-3)',
            color: 'var(--text-primary)',
          }}
        >
          Something went wrong
        </h1>
        <p
          className="type-body"
          style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}
        >
          The page crashed unexpectedly. You can retry or head back home.
        </p>
        {error.digest && (
          <p
            className="font-mono"
            style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: 'var(--space-6)' }}
          >
            error ref: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
          <button
            type="button"
            onClick={reset}
            className="motion-spring"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '40px',
              padding: '0 22px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bio-primary-500)',
              color: '#0a0c14',
              fontSize: 'var(--t-sm)',
              fontWeight: 'var(--tw-semibold)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.18), 0 6px 16px color-mix(in srgb, var(--bio-primary-500) 32%, transparent)',
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="motion-spring"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '40px',
              padding: '0 22px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--glass-thin)',
              backdropFilter: 'blur(30px) saturate(200%)',
              WebkitBackdropFilter: 'blur(30px) saturate(200%)',
              color: 'var(--text-primary)',
              fontSize: 'var(--t-sm)',
              fontWeight: 'var(--tw-medium)',
              boxShadow: 'inset 0 1px 0 var(--edge-top), inset 0 -1px 0 var(--edge-bottom), 0 0 0 1px var(--edge-outline)',
            }}
          >
            ← Home
          </Link>
        </div>
      </div>
    </div>
  );
}
