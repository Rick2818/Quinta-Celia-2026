import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }


  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Quinta Celia ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleResetSafe = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleClearCache = () => {
    if (window.confirm('¿Deseas restaurar la configuración y datos locales por defecto para resolver el problema?')) {
      try {
        localStorage.removeItem('quinta_celia_clientes');
        localStorage.removeItem('quinta_celia_clientes_v1');
        localStorage.removeItem('quinta_celia_pagos_v1');
      } catch (e) {
        console.warn('Error clearing storage:', e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🛡️
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white font-display">
                Protección Activa de Sistema
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                El sistema detectó una excepción inesperada y evitó el bloqueo de la aplicación. Tus datos no se han perdido.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left text-[11px] font-mono text-amber-300/90 overflow-x-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleResetSafe}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Reintentar Vista
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Recargar App
              </button>
            </div>

            <button
              onClick={this.handleClearCache}
              className="text-[11px] text-slate-500 hover:text-slate-400 underline decoration-slate-600 transition-colors cursor-pointer"
            >
              Restaurar datos predeterminados
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
