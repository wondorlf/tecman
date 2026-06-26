# TecMan — Arquitectura y Avance del Proyecto

> **CMMS/ITAM** — Sistema de Gestión de Activos y Mantenimiento
> Actualizado: 2026-04-27

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS 10, TypeScript, Passport JWT |
| ORM | Prisma 5.22 + MySQL |
| Frontend | Next.js 14, React 18, TailwindCSS |
| UI | Radix UI, shadcn/ui, Recharts |
| HTTP | Axios + TanStack Query v5 |
| Admin | AdminJS 7 |
| Deploy | PM2 (monolítico) |

## Estructura

```
egan-tecman/
├── backend/               # NestJS API REST
│   ├── prisma/            # Schema + seed
│   └── src/
│       ├── common/        # Guards, interceptors, decorators
│       ├── prisma/        # Servicio Prisma
│       └── modules/       # 15 módulos de negocio
├── frontend/              # Next.js 14
│   └── src/
│       ├── app/           # Páginas (App Router)
│       ├── components/    # Componentes reutilizables
│       └── lib/           # API client, tipos, utilidades
├── docs/                  # Documentación del proyecto
└── ecosystem.config.js    # PM2 producción
```

## Módulos del Backend

| Módulo | Endpoints | Descripción |
|--------|-----------|-------------|
| auth | 2 | Login JWT, perfil |
| assets | 7 | CRUD + depreciación + hoja de vida + importar/exportar |
| maintenance | 5 | Órdenes de trabajo, completar, evidencia |
| tickets | 5 | Mesa de ayuda, mensajería |
| alerts | 3 | Alertas + scheduler automático |
| checklists | 5 | Plantillas dinámicas (12 tipos de campo) |
| dashboard | 2 | KPIs y actividad reciente |
| users | 6 | CRUD usuarios, roles, activar/desactivar |
| categories | 4 | CRUD con jerarquía padre/hijo |
| locations | 4 | CRUD con jerarquía |
| suppliers | 4 | CRUD proveedores |
| documents | 3 | Upload, listar, eliminar |
| notifications | — | Email con Nodemailer |
| storage | — | Almacenamiento de archivos |
| admin | — | Panel AdminJS |

## Modelo de Datos (27 modelos + 12 enums)

Modelos principales:
- **User** → Role (RBAC)
- **Asset** → Category, Subcategory, Location, Supplier
- **HojaVida** → HojaVidaEvent (historial del activo)
- **Maintenance** → Asset, User (técnico), Checklist, Evidence
- **Ticket** → User (creador/asignado), TicketMessage
- **Alert** → Asset, User (asignado/resuelve)
- **Checklist** → ChecklistItem (12 tipos de campo)
- **Document** → Asset (versionamiento)
- **Audit** → User (registro de toda acción)
- **CategoryAttribute** → AssetAttributeValue

---

## Avance por Fases

### ✅ Fase 0 — Base (completada)
- [x] Arquitectura monolítica NestJS + Next.js
- [x] Autenticación JWT + RBAC
- [x] CRUD completo de todos los módulos
- [x] Hoja de vida automática de activos
- [x] Cálculo de depreciación lineal
- [x] Generación de QR
- [x] Sistema de tickets con mensajería
- [x] Checklists dinámicos (12 tipos de campo)
- [x] Swagger auto-generado
- [x] Panel AdminJS
- [x] AuditInterceptor global
- [x] Notificaciones por email (tickets)

### ✅ Fase 1 — Robustez (completada)
- [x] Paginación en todos los endpoints de listado
- [x] Búsqueda full-text en activos, mantenimiento, tickets
- [x] Importación masiva desde XLSX
- [x] Exportación a XLSX
- [x] Generación atómica de códigos (MNT/TKT)
- [x] Scheduler automático para alertas (@nestjs/schedule)

### 🚧 Fase 2 — Capacidades Shelf.nu (En progreso)
- [x] Backend: Custody tracking (asignación de activos a personas)
- [x] Backend: Bookings / reservas con calendario
- [x] Backend: Kits / bundles de activos
- [x] Backend: Tags / etiquetas flexibles
- [ ] Frontend: UI de asignaciones y devoluciones
- [ ] Frontend: Calendario de reservas
- [ ] Frontend: Gestión de Kits y Tags
- [ ] Scanner QR con acciones masivas
- [ ] Filtros guardados (presets)

### 📋 Fase 3 — Capacidades ITSM (iTop)
- [ ] SLA Management
- [ ] Catálogo de servicios + contratos
- [ ] Workflow / máquina de estados
- [ ] Análisis de impacto
- [ ] Gestión de cambios (RFC)
- [ ] Motor de notificaciones configurables
- [ ] Auditoría de calidad de datos

### 📋 Fase 4 — Escalabilidad
- [ ] Multi-tenant / workspaces
- [ ] Portal self-service
- [ ] i18n (ES/EN)
- [ ] Dashboards configurables
- [ ] WebSockets (tiempo real)
- [ ] PWA mejorado (offline + push)
- [ ] Soft-delete (papelera)
