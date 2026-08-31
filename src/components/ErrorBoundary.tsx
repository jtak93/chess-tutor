import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chess Tutor Uncaught Error Boundary caught error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121211] text-zinc-100 flex items-center justify-center p-4">
          <div className="bg-[#1e1d1a] border border-zinc-800 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-zinc-100">Something went wrong</h2>
              <p className="text-xs text-zinc-400">
                An unexpected board state error occurred. Click below to reset the board.
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors shadow"
            >
              <RotateCcw size={14} />
              Reset Chess Tutor
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
