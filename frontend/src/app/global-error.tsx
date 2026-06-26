'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>500</h1>
            <h2 style={{ fontSize: '1.25rem', color: '#1e293b' }}>Error del servidor</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Ocurrió un error inesperado. Intenta recargar la página.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: '#2563eb',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
