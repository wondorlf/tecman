const fs = require('fs');
const path = require('path');

/**
 * Parse a .env file into a simple key-value object.
 * Supports VAR=value, quoted values, and comments (#).
 */
function parseEnv(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.substring(0, idx).trim();
    let value = trimmed.substring(idx + 1).trim();

    // ── Valores entre comillas: extraer contenido directamente ────────────
    // El contenido entre comillas está protegido: si contiene '#' se trata
    // como parte del valor, NO como comentario.
    const isQuoted = (value.startsWith('"') || value.startsWith("'")) && value.length >= 2;
    if (isQuoted) {
      const quote = value[0];
      const closeIdx = value.indexOf(quote, 1);
      if (closeIdx > 0) {
        value = value.slice(1, closeIdx);
      }
    } else {
      // ── Valores sin comillas: eliminar comentarios inline ──────────────
      // Ej: PORT=3001 # comentario  →  PORT=3001
      const commentIdx = value.search(/\s+#/);
      if (commentIdx >= 0) {
        value = value.substring(0, commentIdx).trimEnd();
      }
    }
    result[key] = value;
  }
  return result;
}

// ── Cargar variables de puerto desde el .env raíz ──────────────────────────
// El backend lee PORT del .env (ej: PORT=3001)
// El frontend lee FRONTEND_PORT del .env (ej: FRONTEND_PORT=3000)
const env = parseEnv(path.join(__dirname, '.env'));

module.exports = {
  apps: [
    {
      name: 'tecman-api',
      cwd: './backend',
      script: 'dist/src/main.js',
      env_file: '../.env',                 // Carga DATABASE_URL, JWT_SECRET, etc.
      instances: 1,
      exec_mode: 'fork',
      max_restarts: 10,
      restart_delay: 2000,
      exp_backoff_restart_delay: 2000,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: env.PORT || '2023',          // Desde .env raíz, fallback 2023
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: env.PORT || '2023',
      },
      error_file: '../logs/tecman-api-error.log',
      out_file: '../logs/tecman-api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      time: true,
    },
    {
      name: 'tecman-frontend',
      cwd: './frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      // NOTA: NO usar env_file aquí porque el .env raíz tiene PORT=... que
      // sobreescribiría nuestra variable PORT del bloque env (que debe ser FRONTEND_PORT).
      // Las vars necesarias (PORT=FRONTEND_PORT, API_PORT=PORT) se definen abajo.
      instances: 1,
      exec_mode: 'fork',
      max_restarts: 10,
      restart_delay: 2000,
      exp_backoff_restart_delay: 2000,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: env.FRONTEND_PORT || '2024', // Desde .env raíz, fallback 2024
        API_PORT: env.PORT || '2023',       // Para rewrites en next.config.mjs
      },
      error_file: '../logs/tecman-frontend-error.log',
      out_file: '../logs/tecman-frontend-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      time: true,
    },
  ],
};
