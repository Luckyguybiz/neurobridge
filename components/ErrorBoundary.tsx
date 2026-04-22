'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Compact mode: for per-card boundaries in grids — fits inside a card
   *  instead of taking over the whole viewport. */
  compact?: boolean;
  /** Optional label for the boundary — shows up in console logs for debugging. */
  label?: string;
}

interface State {
  hasError: boolean;
  error: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Surface the crash in the browser console with a stable label so it's
    // easy to trace which card died without clicking through React's
    // component stack. Remote logging hook-point for Sentry when it lands.
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      if (this.props.compact) {
        return (
          <div className="py-6 text-center">
            <div className="text-[20px] mb-2">⚠</div>
            <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>Card failed to render</p>
            <p className="text-[10px] mb-3 font-mono" style={{ color: 'var(--text-faint)' }}>{this.state.error.slice(0, 100)}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="text-[10px] px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400/70 hover:text-cyan-400"
            >
              Retry
            </button>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">⚠</div>
            <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="text-sm px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
