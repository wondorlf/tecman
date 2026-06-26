import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Lee API_PORT desde el .env raíz directamente, sin depender de
 * variables de entorno del sistema/PM2 (que Next.js puede sobrescribir).
 */
// Cachear a nivel de módulo para evitar leer el disco en cada request
const _backendPort = (() => {
  // 1. Intentar desde variable de entorno
  if (process.env.API_PORT) return process.env.API_PORT;

  // 2. Leer desde el .env raíz del proyecto
  const envPath = join(__dirname, '..', '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    const match = content.match(/^API_PORT\s*=\s*(\S+)/m);
    if (match) return match[1].replace(/^["']|["']$/g, '');
  }

  // 3. Fallback
  return '2023';
})();

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Usamos servidor Next.js independiente (no static export)
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },

  // ── Single-port architecture ────────────────────────────────────────────
  // El frontend es el único puerto público.
  // Proxy de todas las rutas del backend hacia el puerto definido en API_PORT
  // o desde el .env raíz.
  async rewrites() {
    const backendPort = _backendPort;

    const backendUrl = `http://localhost:${backendPort}`;

    return [
      // API REST
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      // AdminJS panel
      {
        source: "/admin",
        destination: `${backendUrl}/admin`,
      },
      {
        source: "/admin/:path*",
        destination: `${backendUrl}/admin/:path*`,
      },
      // WebSockets (socket.io polling)
      {
        source: "/socket.io/:path*",
        destination: `${backendUrl}/socket.io/:path*`,
      },
    ]
  },
}

export default nextConfig
