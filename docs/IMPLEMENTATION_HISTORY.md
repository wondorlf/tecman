# Historial de Implementación — TecMan CMMS/ITAM

**Fecha de actualización:** 2026-06-17  
**Alcance:** Correcciones críticas, nuevas funcionalidades (Discovery, Knowledge Base, Chatbot flotante, Agentes), y mejoras de estabilidad.

---

## 1. Infraestructura y Configuración Base

| ID | Cambio | Archivo(s) | Descripción |
|----|--------|------------|-------------|
| INF-01 | `.gitignore` actualizado | `.gitignore` | Excluye artefactos temporales de backend (`*.log`, `*_result*.txt`, `test_relations.js`, `check-users*`, `fix-egan-user.ts`, `error.log`) y config local del agente (`agent/*.json`, `agent/tecman-discovery-config.json`). |
| INF-02 | CORS restringido | `backend/src/main.ts` | `origin: true` reemplazado por array dinámico basado en `FRONTEND_URL`. Soporta dominio o IP. En dev permite `localhost:3000` y `localhost:3001`. |
| INF-03 | Validación DTOs corregida | `backend/src/modules/assets/dto/create-asset.dto.ts`, `update-asset.dto.ts`, `complete-maintenance.dto.ts` | Se agrega `AttributeValueDto` con `@ValidateNested({ each: true })` y `@Type(() => AttributeValueDto)` a `attributeValues`. `checklistData` cambia de `@IsString()` a `@IsObject()`. |
| INF-04 | Seed de Knowledge Base | `backend/prisma/seed-knowledge.ts` | 6 categorías y 10 artículos de autoayuda (Computadores, Impresoras, Redes, Biomédico, Energía, Soporte General). Ejecutar: `npx ts-node prisma/seed-knowledge.ts`. |
| INF-05 | Módulos registrados | `backend/src/app.module.ts` | Se importan `KnowledgeModule` y `AgentsModule`. |

---

## 2. Estabilidad y Prevención de Pérdidas

| ID | Cambio | Archivo(s) | Descripción |
|----|--------|------------|-------------|
| EST-01 | Limpieza atómica de evidencias | `backend/src/modules/maintenance/maintenance.service.ts` | `remove()` ahora lista `evidence` y elimina archivos físicos vía `StorageService.deleteFile()` dentro de `$transaction` antes de borrar el mantenimiento. |
| EST-02 | Limpieza de documentos | `backend/src/modules/documents/documents.service.ts` | Ya eliminaba el archivo físico; se confirma que usa `StorageService` y captura errores sin romper la transacción. |
| EST-03 | Manejo P2003 en assets | `backend/src/modules/assets/assets.service.ts` | `remove()` captura `PrismaClientKnownRequestError` código `P2003` y retorna `BadRequestException` con mensaje amigable. |
| EST-04 | Upload limit configurable | `backend/src/modules/storage/storage.controller.ts` | `FileInterceptor` lee `UPLOAD_MAX_SIZE` (default 10MB) desde `.env` o variable de entorno. |
| EST-05 | `maxUploadSize` en Tenant | `backend/prisma/schema.prisma`, `backend/src/modules/tenants/tenants.service.ts` | Campo `maxUploadSize Int @default(10485760)` en modelo `Tenant`. `getPublicSettings()` expone el valor con fallback. |
| EST-06 | Serial en agente Go | `agent/main.go` | Se agrega `SerialNumber` al `AgentPayload` y función `getSerialNumber()` que lee `/sys/class/dmi/id/product_serial` en Linux. En Windows queda vacío (el PowerShell lo provee). |
| EST-07 | Sumas BigInt corregidas | `backend/src/modules/discovery/discovery.service.ts` | `totalRam` y `totalDisk` usan `.toString()` antes de `Number()` para evitar truncamiento de BigInt. Detección de cambios hardware también ajustada. |

---

## 3. Seguridad

| ID | Cambio | Archivo(s) | Descripción |
|----|--------|------------|-------------|
| SEC-01 | RolesGuard con permisos granulares | `backend/src/common/guards/roles.guard.ts` | Parsea `user.role.permissions` (JSON string). Permite wildcard `*` y coincidencias `module:action`. Mantiene fallback a nombres hardcodeados para compatibilidad. |

---

## 4. Discovery — Vinculación a Activos

| ID | Cambio | Archivo(s) | Descripción |
|----|--------|------------|-------------|
| DISC-01 | Endpoint link-to-asset | `backend/src/modules/discovery/discovery.controller.ts`, `discovery.service.ts` | `PUT /api/discovery/:id/link-to-asset` permite crear nuevo activo desde dispositivo discovery o vincular a existente por serial. |
| DISC-02 | Servicio `linkDiscoveryDevice` | `backend/src/modules/discovery/discovery.service.ts` | Crea `Asset` con datos del `DiscoveredDevice` (hostname, manufacturer, model, serialNumber) y genera QR automático. Vincula `assetId` en `DiscoveredDevice`. Crea evento en `HojaVida`. |
| DISC-03 | UI Discovery vinculación | `frontend/src/app/dashboard/discovery/page.tsx` | En detalle de dispositivo, botones para "Crear activo" y "Vincular a existente" (pendiente integración final con formulario). |

---

## 5. Agentes de Discovery — Descarga

| ID | Cambio | Archivo(s) | Descripción |
|----|--------|------------|-------------|
| AGT-01 | Controller de descarga | `backend/src/modules/agents/agents.controller.ts` | `GET /api/agents/go` descarga ejecutable o fuente Go. `GET /api/agents/powershell` descarga `.ps1`. `GET /api/agents/info` retorna metadatos de instalación. |
| AGT-02 | Módulo Agents | `backend/src/modules/agents/agents.module.ts` | Módulo NestJS que expone el controller. |
| AGT-03 | Página Descargar Agente | `frontend/src/app/dashboard/agents/page.tsx` | UI con tarjetas para Go y PowerShell, botones de descarga, badges de OS, comandos de instalación. |
| AGT-04 | PowerShell ya incluye serial | `agent/tecman-discovery.ps1` | Confirmado: línea 155 envía `serialNumber` obtenido de `Win32_BIOS.SerialNumber`. |

---

## 6. Knowledge Base y Chatbot Flotante

| ID | Cambio | Archivo(s) | Descripción |
|----|--------|------------|-------------|
| KB-01 | Modelos Prisma | `backend/prisma/schema.prisma` | `KnowledgeCategory` y `KnowledgeArticle` con campos: título, slug, excerpt, contenido, dificultad, tiempo estimado, vistas, helpful/notHelpful. |
| KB-02 | Servicio Knowledge | `backend/src/modules/knowledge/knowledge.service.ts` | CRUD completo: listar categorías, listar artículos (con búsqueda), ver detalle (incrementa vistas), calificar, crear, editar, eliminar. |
| KB-03 | Controller Knowledge | `backend/src/modules/knowledge/knowledge.controller.ts` | Endpoints: `GET /knowledge/categories`, `GET /knowledge/articles`, `GET /knowledge/articles/:id`, `POST /knowledge/articles/:id/rate`. |
| KB-04 | Página Knowledge Base | `frontend/src/app/dashboard/knowledge/page.tsx` | Grid con sidebar de categorías, búsqueda full-text, cards de artículos con badges de dificultad y tiempo, dialog de detalle con botón "Crear ticket si no fue útil". |
| KB-05 | Botón flotante chatbot | `frontend/src/components/floating-help.tsx` | Componente con estado abierto/cerrado. Mensaje de bienvenida con chips rápidos: Crear ticket, Escanear QR, Ver Discovery, Base de conocimiento. Busca en Knowledge Base cuando el usuario escribe una consulta. Navega automáticamente a la página relevante. |
| KB-06 | Integración en layout | `frontend/src/app/dashboard/dashboard-shell.tsx` | `<FloatingHelp />` inyectado en el layout del dashboard para que aparezca en todas las páginas. |
| KB-07 | Sidebar actualizado | `frontend/src/components/sidebar.tsx` | Agregados items: "Base de Conocimiento" (`/dashboard/knowledge`) y "Descargar Agente" (`/dashboard/agents`). |
| KB-08 | API client | `frontend/src/lib/api.ts` | Agregado `knowledgeApi` con `listCategories`, `listArticles`, `getArticle`, `rateArticle`. |

---

## 7. Pendientes / Roadmap

| ID | Tarea | Prioridad | Notas |
|----|-------|-----------|-------|
| PEN-01 | Flujo QR → Activo → Ticket/Mantenimiento | Alta | Escanear QR, ver ficha técnica, botón "Crear ticket" o "Crear mantenimiento" pre-llenados. |
| PEN-02 | Vincular discovery device a ticket desde detalle | Media | Al ver un dispositivo discovery, permitir crear ticket asociado. |
| PEN-03 | Frontend: Asignaciones y Devoluciones (Custodias) | Alta | UI completa para asignar/retornar activos a personas. |
| PEN-04 | Frontend: Calendario de Reservas (Bookings) | Alta | Implementar vista de calendario con react-big-calendar. |
| PEN-05 | Frontend: Gestión de Kits y Tags | Media | CRUD UI para kits (agregar/quitar items) y asignación de tags a assets. |
| PEN-06 | Filtros guardados (presets) | Media | Permitir guardar búsquedas filtradas como vistas rápidas. |
| PAP-01 | Próximas acciones sugeridas | - | Revisar backlog Fase 4: multi-tenant, WebSockets, soft-delete. |

---

## 8. Cómo Aplicar los Cambios

```bash
# 1. Backend: generar cliente Prisma y aplicar schema
cd backend
npx prisma generate
npx prisma db push

# 2. Poblar datos iniciales (roles, categorías, artículos KB)
npx prisma db seed
npx ts-node prisma/seed-knowledge.ts

# 3. Build backend
npm run build

# 4. Build frontend
cd ../frontend
npm run build

# 5. Ejecutar en desarrollo
cd ..
npm run dev
```

---

## 9. Notas Técnicas

- **Dominio/IP:** El backend ahora usa `FRONTEND_URL` para CORS. Configurar en `.env` raíz según despliegue (dominio o IP).
- **Agente recomendado:** PowerShell para Windows (captura serial de BIOS). Go para Linux/macOS.
- **Knowledge Base:** Los artículos son editables por administradores vía AdminJS (`/admin`) o futuros endpoints CRUD.
- **Chatbot:** Lógica de intenciones local (no requiere LLM externo). Escalable a IA en fases futuras.
