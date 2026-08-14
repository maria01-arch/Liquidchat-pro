import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Without this, ANY uncaught error anywhere in the component tree — a
 * missing field on a freshly created chat, a bad prop, anything — makes
 * React silently unmount the entire app, leaving a truly blank screen with
 * no indication of what broke. This catches that and shows the actual
 * error instead, which is the difference between "click it and see" and
 * "guess for an hour."
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Pigion] Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen w-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-6 space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-lg">Something broke</h2>
            <p className="text-xs text-slate-400 font-mono bg-slate-950 border border-slate-800 rounded-xl p-3 text-left break-words">
              {this.state.error.message || String(this.state.error)}
            </p>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
