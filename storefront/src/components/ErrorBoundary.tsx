'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Pass current pathname to auto-reset error state on navigation */
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Reset error state when navigating to a different route
  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'ErrorBoundary',
      },
      tags: {
        errorType: 'react_error_boundary',
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="text-center max-w-md px-6">
              <h2 className="text-2xl font-serif text-stone-900 mb-4">
                Something went wrong
              </h2>
              <p className="text-stone-600 mb-6">
                We apologize for the inconvenience. Please try refreshing the
                page.
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="bg-stone-900 text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
