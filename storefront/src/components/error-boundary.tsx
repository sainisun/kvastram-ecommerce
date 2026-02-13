'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-2xl font-serif text-stone-900 mb-4">Something went wrong</h2>
            <p className="text-stone-600 mb-6">We apologize for the inconvenience. Please try again.</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="bg-stone-900 text-white px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
