interface CatalogStatusProps {
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}

export const CatalogStatus = ({
  isLoading,
  hasError,
  onRetry,
}: CatalogStatusProps) => {
  if (!isLoading && !hasError) return null;

  if (isLoading) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-white/10 bg-[#141414] p-6 text-center text-sm text-gray-300"
      >
        Cargando la carta…
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="rounded-2xl border border-amber-500/30 bg-[#141414] p-6 text-center"
    >
      <p className="text-sm text-gray-200">
        No pudimos cargar la carta. Comprueba la conexión e inténtalo nuevamente.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15"
      >
        Reintentar
      </button>
    </div>
  );
};
