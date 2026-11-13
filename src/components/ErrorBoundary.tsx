import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-[#161B22] border border-red-500/30 text-white shadow-xl my-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 text-red-400 mb-3">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <h3 className="text-lg font-bold">
              {this.props.fallbackTitle || 'Ocurrió un problema en esta sección'}
            </h3>
          </div>
          <p className="text-sm text-gray-300 mb-4">
            {this.state.error?.message || 'Se produjo un error inesperado al renderizar.'}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reintentar
            </button>
            {this.props.onReset && (
              <button
                type="button"
                onClick={this.props.onReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all cursor-pointer"
              >
                Volver a Caja
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
