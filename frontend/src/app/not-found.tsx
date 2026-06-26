import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black text-slate-200">404</h1>
        <h2 className="text-xl font-bold text-slate-800">Página no encontrada</h2>
        <p className="text-slate-500 text-sm max-w-sm">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
