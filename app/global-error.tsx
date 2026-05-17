'use client';

import { useEffect } from 'react';

/**
 * Root-level error boundary — fires when the ROOT layout itself crashes
 * (e.g. ThemeProvider blows up, font loading throws). Since `app/layout` is
 * dead, we must render our OWN <html> and <body> here. Use only inline
 * styles — globals.css may not have loaded.
 *
 * This is the last line of defence before Next's default crash screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/global-error.tsx]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#05060a',
          color: 'rgba(255,255,255,0.85)',
          fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <div style={{ fontSize: 48, color: '#FF5252', marginBottom: 12 }}>⚠</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Critical error
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 24px', lineHeight: 1.5 }}>
            The application crashed at the root level. Reload the page to recover.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'SF Mono, Menlo, monospace', marginBottom: 24 }}>
              error ref: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 40,
              padding: '0 20px',
              borderRadius: 12,
              background: '#1DE9B6',
              color: '#0a0c14',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
