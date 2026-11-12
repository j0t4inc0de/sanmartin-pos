import { WifiOff, RotateCw } from 'lucide-react';

interface CatalogStatusProps {
  isLoading?: boolean;
  hasError?: boolean;
  isOfflineFallback?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const CatalogStatus = ({
  isLoading = false,
  hasError = false,
  isOfflineFallback = false,
  onRetry,
  className = '',
}: CatalogStatusProps) => {
  // If there's an offline/cached fallback and we have data to display:
  if (isOfflineFallback && !hasError) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 backdrop-blur-sm ${className}`}
      >
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            Mostrando carta guardada · Precios vigentes al último turno
          </span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-100 transition-colors hover:bg-amber-500/30 cursor-pointer"
          >
            <RotateCw className="h-3 w-3" />
            <span>Actualizar</span>
          </button>
        )}
      </div>
    );
  }

  // Blocking loading state (only when no data is available yet)
  if (isLoading) {
    return (
      <div
        role="status"
        className={`rounded-2xl border border-white/10 bg-[#141414] p-6 text-center text-sm text-gray-300 ${className}`}
      >
        Cargando la carta…
      </div>
    );
  }

  // Fatal error state (only when completely unable to load even fallback)
  if (hasError) {
    return (
      <div
        role="alert"
        className={`rounded-2xl border border-amber-500/30 bg-[#141414] p-6 text-center ${className}`}
      >
        <p className="text-sm text-gray-200">
          No pudimos cargar la carta. Comprueba la conexión e inténtalo nuevamente.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15 cursor-pointer"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return null;
};
