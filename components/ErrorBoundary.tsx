'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
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

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
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
