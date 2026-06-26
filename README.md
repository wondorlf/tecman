# TecMan — Sistema de Gestión de Activos y Mantenimiento

CMMS/ITAM completo para organizaciones colombianas. Construido con NestJS 10 + Next.js 14 + MySQL + Prisma.

---

## Arranque rápido

### Primera vez (instalar dependencias)

```bash
# Desde la raíz del proyecto
cd C:\egan_projects\egan-tecman

# Backend
cd backend
npm install --legacy-peer-deps
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### Desarrollo (ambos servidores)

```bash
# Desde la raíz — arranca backend en :3001 y frontend en :3000
npm run dev
```

O por separado:

```bash
npm run dev:backend    # NestJS en http://localhost:3001
npm run dev:frontend   # Next.js en http://localhost:3000
```

### Producción con PM2

```bash
npm run build          # Compila backend y exporta frontend estático
npm run pm2:start      # Inicia ambos procesos con PM2
```

---

## Variables de entorno

### Backend (`backend/.env`)

Copia `backend/.env.example` → `backend/.env`.

```env
# ── Base de datos ──────────────────────────────────────────────────────────
DATABASE_URL="mysql://root:password@127.0.0.1:3306/egan_tecman"

# ── Autenticación JWT ──────────────────────────────────────────────────────
# ¡OBLIGATORIO! Secreto para firmar JWT. Si no se define, el backend lanza
# error al arrancar. Genera uno fuerte:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=""

# Tiempo de expiración del access token (formato ms: "15m", "1h", "8h")
JWT_EXPIRES_IN="15m"

# Tiempo de expiración del refresh token (formato: "7d", "14d", "30d")
# Se almacena en cookie httpOnly (no va en localStorage)
JWT_REFRESH_EXPIRES_IN="7d"

# ── Servidor ────────────────────────────────────────────────────────────────
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# ── Discovery Agent ─────────────────────────────────────────────────────────
# API Key para autenticar agentes de descubrimiento (header X-API-Key).
# ¡Cambiar antes de producción! Genera una fuerte:
#   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
DISCOVERY_API_KEY=""
```

### Frontend (`frontend/.env.local`)

Copia `frontend/.env.example` → `frontend/.env.local`. Solo necesario si el frontend se sirve desde un puerto diferente al 3000 (sin proxy):

```env
# NEXT_PUBLIC_API_URL="http://localhost:3001"
```

> **Nota:** En desarrollo con `next dev` (puerto 3000), el `next.config.mjs` hace proxy de `/api/*` al backend automáticamente. No necesitas definir `NEXT_PUBLIC_API_URL`.

---

## Base de datos

```bash
# Aplicar el schema
npm run db:push

# Poblar datos iniciales
npm run db:seed
```

---

## URLs

| Entorno | URL |
|---------|-----|
| Frontend (dev) | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Swagger docs | http://localhost:3001/api/docs |
| AdminJS panel | http://localhost:3001/admin |

---

## Módulos del sistema

- **Activos** — Inventario con QR, depreciación, hoja de vida, importar/exportar XLSX
- **Mantenimiento** — Órdenes preventivas, correctivas y predictivas
- **Checklists** — Plantillas dinámicas con 12 tipos de campo
- **Alertas** — Monitoreo automático de vencimientos y condiciones críticas
- **Tickets** — Mesa de ayuda con mensajería
- **Usuarios** — Gestión de roles y permisos (RBAC)
- **Configuración** — Categorías, ubicaciones y proveedores
- **Dashboard** — KPIs, gráficas y actividad reciente
- **Documentos** — Gestión documental por activo
- **Notificaciones** — Email automático (tickets)

### Características transversales

- **Paginación** — Todos los listados soportan `?page=1&limit=20`
- **Búsqueda** — Búsqueda full-text con `?search=texto` en activos, mantenimiento, tickets, alertas y usuarios
- **Importar XLSX** — `POST /api/assets/import` con archivo Excel
- **Exportar XLSX** — `GET /api/assets/export` descarga Excel
- **Alertas automáticas** — `POST /api/alerts/check` verifica garantías y mantenimientos vencidos
- **Auditoría** — Registro automático de toda acción (POST/PUT/DELETE)

---

## Stack técnico

| Capa | Tecnología |
|------|-----------| 
| Backend | NestJS 10, TypeScript, Passport JWT |
| ORM | Prisma 5.22 + MySQL |
| Frontend | Next.js 14, React 18, TailwindCSS |
| UI | Radix UI, shadcn/ui, Recharts |
| HTTP | Axios + TanStack Query v5 |
| Admin | AdminJS 7 |
| Deploy | PM2 |

---

## Documentación

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para arquitectura completa y avance por fases.
