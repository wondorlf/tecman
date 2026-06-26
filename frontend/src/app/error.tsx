'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black text-slate-200">500</h1>
        <h2 className="text-xl font-bold text-slate-800">Error del servidor</h2>
        <p className="text-slate-500 text-sm max-w-sm">
          Ocurrió un error inesperado. Intenta recargar la página.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
