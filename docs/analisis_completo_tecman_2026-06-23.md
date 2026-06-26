# ANÁLISIS COMPLETO DEL PROYECTO TECMAN
### CMMS/ITAM — Desde la perspectiva de Ingeniería de Sistemas y Soporte TI
> Fecha: 2026-06-23

---

## 1. FORTALEZAS

### Arquitectura y Stack
- **Stack moderno y coherente**: NestJS + Prisma + Next.js + Tailwind + shadcn/ui — tecnologías maduras con buenas prácticas
- **39 modelos Prisma** con relaciones bien definidas, cubriendo el dominio ITSM completo
- **27 módulos backend** (~8,266 líneas) con patrón consistente controller/service/DTO
- **RBAC con 3 capas**: JWT + RolesGuard + permisos string-based
- **Auditoría automática**: AuditInterceptor registra POST/PUT/DELETE con redacción de campos sensibles
- **WebSocket para tickets**: Notificaciones en tiempo real con Socket.IO
- **AdminJS**: Panel administrativo funcional con 20+ modelos expuestos
- **LDAP/AD integration**: Sincronización de usuarios y computadores desde Active Directory
- **Dual agentes**: Go (binario) + PowerShell (script) para descubrimiento de red en Windows

### Funcionalidades ITSM
- **Mesa de ayuda completa**: Tickets, mensajes internos, CSAT, categorías por tipo
- **Hoja de vida automática** de activos con eventos tipados
- **Checklists dinámicos**: 12 tipos de campo (fotos, firmas, GPS)
- **Gestión de activos**: QR, depreciación, importar/exportar XLSX
- **Portal público**: `/soporte` permite crear tickets sin autenticación
- **Asignación de custodia** y reservas de activos
- **SLA Management, catálogo de servicios, change requests** (Fase 3)
- **Base de conocimiento** con categorías y métricas de utilidad

---

## 2. DEBILIDADES Y PENDIENTES CRÍTICOS

### Seguridad (Prioridad CRÍTICA)

| # | Hallazgo | Severidad | Archivo |
|---|----------|-----------|---------|
| 1 | **JWT secrets hardcoded con fallback** — `"tecman-secret-key-2024"` se usa si falta la env var. Bypass completo de autenticación | **CRÍTICO** | `jwt.strategy.ts:16` |
| 2 | **Usuario guest con rol Administrador** — `guest@tecman.local` con password débil y permisos de admin total | **CRÍTICO** | `tenants.service.ts:26-41` |
| 3 | **Endpoint de descubrimiento sin auth** — `POST /api/discovery/agent` acepta JSON arbitrario sin autenticación ni validación | **CRÍTICO** | `discovery.controller.ts:42-48` |
| 4 | **Descarga de agentes con header injection** — `install.bat` inyecta URL desde headers no sanitizados | **CRÍTICO** | `agents.controller.ts:44` |
| 5 | **Sin rate limiting** en endpoints de login | **ALTO** | `main.ts` |
| 6 | **Sin security headers** (helmet) — no HSTS, CSP, X-Frame-Options | **ALTO** | `main.ts` |
| 7 | **Credenciales reales en seed** — passwords débiles (`admin123`, `egan`, `1003804743`) en control de versiones | **ALTO** | `seed.ts:50-86` |
| 8 | **Tokens en localStorage** — vulnerables a XSS, sin rotación de refresh tokens | **ALTO** | `api.ts:23` |
| 9 | **`forbidNonWhitelisted: false`** — deshabilita validación de campos extra en requests | **ALTO** | `main.ts:20` |
| 10 | **Sin complejidad de passwords** — acepta cualquier contraseña | **MEDIO** | `users.service.ts:88` |

### Flujo de Datos

| Hallazgo | Impacto |
|----------|---------|
| **No hay refresh tokens implementados** — el JWT expira en 15 min sin renovación silenciosa | Usuarios deben re-autenticarse frecuentemente |
| **CORS permite `null` origin** — archivos locales o iframes sandboxed pueden hacer requests autenticados | Potencial CSRF |
| **Logs de debug sin filtrar por entorno** — `console.log` de login con emails y IDs en producción | Fuga de información |
| **LDAP solo sincroniza, no autentica** — usuarios sincronizados no pueden loguearse con credenciales AD | Confusión en usuarios corporativos |

### Arquitectura Frontend

| Hallazgo | Impacto |
|----------|---------|
| **Auth solo client-side** — localStorage token, sin middleware server-side en Next.js | Bypassable con herramientas de desarrollo |
| **`tsconfig.json` con `strict: false`** — solo `strictNullChecks: true` activado | Menor detección de errores TypeScript |
| **Dos layouts de dashboard** — shell completo vs. ligero sin WebSocket/FloatingHelp | Inconsistencia UX para usuarios que navegan entre secciones |
| **Módulo `agents` incompleto** — tiene controller pero no service | Funcionalidad parcialmente rota |

---

## 3. ANÁLISIS POR ROL DE USUARIO

### Usuario Final (Final User)
**Flujo actual**: Login → Dashboard → Crear ticket / Consultar activo / Portal público

**Fortalezas**:
- Portal público `/soporte` permite crear tickets sin cuenta
- Base de conocimiento para auto-servicio
- FloatingHelp widget con búsqueda de artículos

**Debilidades**:
- Sin portal self-service completo (Fase 4 pendiente)
- Sin notificaciones push para actualizaciones de ticket
- CSAT post-resolución limitado a 1-5 sin seguimiento
- Sin portal de seguimiento público con historial completo

**Oportunidades**: Portal self-service con auto-servicio, chatbot con IA, portal de seguimiento público expandido

### Técnico (Technician)
**Flujo actual**: Login → Órdenes asignadas → Completar checklist → Subir evidencia

**Fortalezas**:
- Página "Mis Órdenes" (`/dashboard/mis-ordenes`) dedicada
- Checklists dinámicos con 12 tipos de campo (fotos, firmas, GPS)
- Evidencia multimedia en mantenimientos

**Debilidades**:
- Sin app móvil / PWA offline para campo
- Sin planificación visual de rutas de mantenimiento
- Sin escáner QR integrado en móvil para identificar activos
- Sin filtros guardados persistentes por técnico

**Oportunidades**: PWA offline, escáner QR en móvil, firma digital en campo, geolocalización GPS

### Administrador (Admin)
**Flujo actual**: Dashboard → Gestión de activos/usuarios/configuración → Panel AdminJS

**Fortalezas**:
- Panel AdminJS completo con 20+ modelos
- Importar/exportar XLSX para migración de datos
- LDAP/AD para sincronización de usuarios
- Gestión de tenants con configuración de marca

**Debilidades**:
- Sin exportación de reportes personalizados
- Sin dashboard de auditoría dedicado (solo tabla Audit)
- Sin herramientas de bulk operations más allá de import XLSX
- Sin configuración de flujos de aprobación

**Oportunidades**: Reportes programados (PDF/Excel), dashboard de auditoría, bulk operations avanzadas, configuración de workflows

### Toma de Decisiones (Management)
**Flujo actual**: Dashboard KPIs → Consolidated reports

**Fortalezas**:
- Dashboard con KPIs: activos, mantenimientos, tickets, resueltos
- Gráficas de activos por estado y mantenimientos por tipo
- Reportes consolidados

**Debilidades**:
- Sin métricas de SLA (tiempo de respuesta/resolución vs承诺)
- Sin tendencias temporales (comparativa mes a mes)
- Sin ROI de mantenimiento (costo vs downtime)
- Sin dashboards configurables
- Sin reportes ejecutivos automatizados
- Sin benchmarking entre sedes/áreas

**Oportunidades**: Dashboard ejecutivo con métricas ITIL, reportes programados, análisis predictivo de costos, KPIs de satisfacción

---

## 4. RUPTURAS Y PUNTOS DE QUEBRE

| Componente | Estado | Riesgo |
|------------|--------|--------|
| **Refresh tokens** | No implementado | Sesiones se cortan cada 15 min |
| **Rate limiting** | Ausente | Vulnerable a brute-force y DoS |
| **Security headers** | Ausente | Vulnerable a clickjacking, XSS reflejado |
| **Módulo agents** | Controller sin service | Endpoints potencialmente rotos |
| **WebSocket CORS** | `origin: true` | Acepta conexiones desde cualquier origen |
| **`build:frontend` script** | `#` comment en cmd.exe | Puede fallar en Windows con ciertas versiones de npm |
| **Test script** | Linux-only `.sh` con error de syntax en línea 345 | No ejecutable en Windows |
| **Config agent** | UTF-8 BOM en JSON | Go agent puede fallar al parsear |

---

## 5. OPORTUNIDADES DE MEJORA EN FLUJOS

### Flujo de Ticket (Usuario → Técnico → Admin)
```
ACTUAL:  Crear → Asignar → Resolver → CSAT
PROPUESTO: Crear → Clasificar(IA) → Asignar(auto) → Resolver → Verificar → CSAT → Aprendizaje
```
- **Clasificación automática** por IA del tipo de incidente
- **Asignación automática** por capacidad y disponibilidad del técnico
- **Escalamiento automático** por SLA vencido
- **CSAT con seguimiento** y acción correctiva

### Flujo de Mantenimiento
```
ACTUAL:  Planificar → Ejecutar → Completar → Evidencia
PROPUESTO: Predictivo → Planificar → Rutar → Ejecutar → Verificar → Analizar
```
- **Mantenimiento predictivo** basado en datos de uso y sensores
- **Optimización de rutas** para técnicos móviles
- **Verificación remota** de completado
- **Análisis de tendencias** para optimizar intervalos

### Flujo de Descubrimiento
```
ACTUAL:  Agente reporta → Backend almacena → Manual vincular a activo
PROPUESTO: Agente descubre → Auto-clasificar → Auto-vincular → Alertar cambios
```
- **Auto-vinculación** con activos existentes por serial/MAC
- **Alertas de cambios** de hardware en tiempo real
- **Inventario automático** vs inventario formal (reconciliación)

---

## 6. INTEGRACIÓN EN ENTORNO WINDOWS

### Estado Actual
- **Go agent**: Windows service con WMI/CIM queries — funcional
- **PowerShell agent**: Alternativa nativa con Task Scheduler — funcional
- **LDAP/AD**: Sincronización de usuarios y computadores — funcional
- **PM2**: Fork mode (correcto para Windows) — funcional
- **Path handling**: Todos usan `path.join()` — correcto

### Problemas Identificados
| Problema | Impacto |
|----------|---------|
| `install-agent.bat` usa `iex` de scripts remotos | Trigger de antivirus/EDR |
| Config agent con UTF-8 BOM | Go puede fallar al parsear |
| BUILD_WINDOWS.md referencia nombre de binario incorrecto | Confusión en deployment |
| Test E2E es Linux-only | No ejecutable en Windows |
| `build:frontend` con comment bash `#` | Puede fallar en cmd.exe |

### Recomendaciones Windows
1. **Whitelist** del agente en Windows Defender/EDR antes de deployment
2. **Eliminar BOM** del config JSON o manejarlo en el agente Go
3. **PowerShell script de deployment** unificado que reemplace el .bat
4. **Servicio Windows** registrado via `nssm` o el propio agente Go
5. **Group Policy** para distribución masiva del agente

---

## 7. PRIORIDADES RECOMENDADAS

### Inmediato (Semana 1-2)
1. Eliminar JWT hardcoded fallback y generar secrets fuertes
2. Cambiar guest user de Administrador a un rol limitado
3. Autenticar endpoint de discovery o agregar API key
4. Instalar `@nestjs/throttler` y `helmet`
5. Implementar refresh tokens
6. Mover tokens de localStorage a httpOnly cookies

### Corto plazo (Mes 1)
7. Agregar validación de password complexity
8. Implementar rate limiting en todos los endpoints públicos
9. Configurar CORS restrictivo en WebSocket
10. Filtrar logs debug por NODE_ENV
11. Completar módulo agents (service faltante)
12. Corregir scripts build para Windows

### Mediano plazo (Mes 2-3)
13. Portal self-service para usuarios
14. PWA offline para técnicos en campo
15. Dashboard ejecutivo con métricas ITIL
16. Reportes programados (PDF/Excel)
17. Escáner QR mejorado en móvil
18. Filtros guardados persistentes

---

**Conclusión**: El proyecto tiene una base sólida con un dominio ITSM completo bien modelado. Las debilidades críticas están en seguridad (JWT, auth, rate limiting) y en la experiencia de los 4 roles de usuario. La integración Windows es buena pero necesita ajustes en deployment y distribución del agente. Las oportunidades de mejora están en self-service, analytics ejecutivo, y automatización de flujos ITIL.
