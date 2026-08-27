'use client';

import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[AgriMart ErrorBoundary caught error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: 'var(--background, #F7F5F0)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm" style={{ backgroundColor: 'var(--success-bg, #DCFCE7)' }}>
            <span className="text-2xl">🌱</span>
          </div>
          <h2 className="text-xl font-bold mb-2 font-display" style={{ color: 'var(--foreground, #1C1917)' }}>
            AgriMart
          </h2>
          <p className="text-sm max-w-sm mb-6 text-muted-foreground" style={{ color: 'var(--muted-foreground, #78716C)' }}>
            Restoring your view...
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="px-5 py-2.5 rounded-xl font-semibold text-white shadow-sm transition-all active:scale-95"
            style={{ backgroundColor: 'var(--primary, #1A6B3A)' }}
          >
            Continue to AgriMart
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ClientRecoveryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Handle any unhandled stream or network promise rejections gracefully
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason?.message || String(event?.reason || '');
      if (
        reason.includes('unexpected EOF') ||
        reason.includes('stream reading') ||
        reason.includes('Load failed') ||
        reason.includes('Failed to fetch')
      ) {
        event.preventDefault(); // Prevent fatal uncaught runtime popups on mobile
        console.warn('[AgriMart] Handled streaming/network EOF notice safely:', reason);
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = event?.message || '';
      if (
        msg.includes('unexpected EOF') ||
        msg.includes('stream reading') ||
        msg.includes('ChunkLoadError')
      ) {
        event.preventDefault();
        console.warn('[AgriMart] Handled chunk/stream error safely:', msg);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
