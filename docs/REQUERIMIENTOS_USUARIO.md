# Requerimientos de Usuario — CMMS/ITAM TecMan
## Investigación: Foros Técnicos, Empresas de TI y Estándares de Mercado (2025-2026)

**Fuentes consultadas:**
- Foros: r/techsupport, r/sysadmin, r/ITAssetManagement, r/helpdesk, r/IndustrialMaintenance
- Blogs técnicos: Limble CMMS, OxMaint, eMaint, Accruent, FMX, Makula, AssetWatch
- Comparativas: G2, Capterra, Software Advice, OxMaint Top 10 2026
- Estándares: ITIL, ISO 55001 (EAM), OEE, MTBF/MTTR

---

## 1. Flujo Diario del Técnico (Tier 1 y Tier 2)

### 1.1 Inicio de turno
- **Vista de MIS ORDENES DE TRABAJO** — El técnico ve solo sus tareas asignadas del día.
- Indicadores visuales: órdenes vencidas (rojo), en progreso (amarillo), completadas hoy (verde).
- Acceso inmediato a hoja de vida del equipo con un clic.

### 1.2 Ejecución en campo / planta
- **Escaneo QR/código de barras** desde el móvil o tablet.
- Al escanear, el sistema muestra:
  - Ficha técnica completa del activo.
  - Últimos mantenimientos realizados (historial).
  - Checklist de inspección si aplica.
  - Órdenes de trabajo abiertas para ese equipo.
- **Completar orden sin volver a la oficina:**
  - Subir evidencias (fotos, videos, firmas).
  - Registrar materiales/repuestos usados.
  - Cerrar orden con diagnóstico y solución.

### 1.3 Escalamiento (Tier 1 → Tier 2 → Tier 3)
- Botón **"Escalar"** con comentario obligatorio y adjuntos.
- Notificación automática al técnico de nivel superior.
- El ticket mantiene todo el historial visible en una sola cadena.

---

## 2. Flujo del Solicitante (Usuario Final / Mesa de Ayuda)

### 2.1 Solicitud de soporte
- **Portal web o QR:** Escanea código del equipo → se pre-llena activo y ubicación → describe problema.
- O desde el **chatbot flotante**: escribe "mi equipo no enciende" → sugiere artículos KB o deriva a ticket.

### 2.2 Seguimiento
- El usuario ve el estado de su solicitud (Abierto → Asignado → En Progreso → Resuelto).
- Recibe notificaciones por correo/telegram al cambiar de estado.

### 2.3 Satisfacción
- Encuesta corta al cerrar el ticket (CSAT: 1-5 estrellas).
- Si califica bajo, se crea alerta para el supervisor.

---

## 3. Dashboard y Métricas (Lo que piden ver a primera vista)

### 3.1 KPIs principales (nivel gerencial)
| Métrico | Fórmula | Frecuencia |
|---------|---------|------------|
| **MTBF** | Tiempo total operación / Nro. fallas | Mensual |
| **MTTR** | Tiempo total reparación / Nro. reparaciones | Por orden |
| **OEE** | Disponibilidad × Rendimiento × Calidad | Diario |
| **PM Compliance** | PMs completados a tiempo / PMs programados | Semanal |
| **Backlog** | Horas estimadas de trabajo pendiente | Semanal |
| **Wrench Time** | Tiempo real de trabajo / Tiempo total | Por turno |
| **Disponibilidad de activos críticos** | % tiempo disponible | Diario |
| **Costo de mantenimiento por activo** | Suma costos MO + materiales / Nro. activos | Mensual |
| **Tickets abiertos por edad** | >24h, >72h, >7 días | Diario |
| **First Contact Resolution (FCR)** | Tickets resueltos en Tier 1 / Total | Semanal |

### 3.2 KPIs operativos (nivel coordinador/técnico)
- Mis órdenes del día (pendientes, completadas, vencidas).
- Alertas activas (críticas, warnings).
- Próximos mantenimientos preventivos (hoy y esta semana).
- Equipos sin inventario/repuestos disponibles.

### 3.3 Exportaciones
- **Formatos:** PDF (informes ejecutivos), Excel/CSV (datos crudos), PNG (gráficos).
- **Programación:** Enviar reporte automático por correo cada lunes (PM Compliance semanal).
- **Filtros:** Por ubicación, categoría, técnico, rango de fechas.

---

## 4. Programación de Mantenimiento (El "core" del CMMS)

### 4.1 Vistas requeridas
| Vista | Uso | Frecuencia |
|-------|-----|-----------|
| **Calendario mensual** | Ver todos los PMs del mes por equipo/técnico | Planificación mensual |
| **Calendario semanal** | Asignar turnos y recursos | Planificación semanal |
| **Gantt / Timeline** | Ver solapamientos, duraciones, dependencias | Planificación detallada |
| **Lista de tareas** | Vista simple tipo checklist para técnico | Operación diaria |

### 4.2 Recurrencias
- Diaria, semanal, quincenal, mensual, bimestral, trimestral, semestral, anual.
- por horometro/kilometraje (para vehículos/equipos móviles).
- por temporada (ej: mantenimiento de climatización en verano).

### 4.3 Asignación inteligente
- Asignar por **habilidad del técnico** (tipo de equipo, certificación).
- Asignar por **ubicación** (minimizar desplazamientos).
- Validar **carga de trabajo** antes de asignar (no saturar).

---

## 5. Vistas Simplificadas vs. Avanzadas (Role-Based UI)

### 5.1 Usuario Final / Solicitante
- Vista SIMPLE: Formulario "Reportar problema" + botón de escanear QR.
- Solo ve SUS propios tickets.

### 5.2 Técnico (Tier 1 / Tier 2)
- Vista INTERMEDIA: Mis órdenes, escanear QR, completar checklist, cerrar orden.
- Ve activos de su ubicación/categoría asignada.

### 5.3 Supervisor / Coordinador
- Vista AVANZADA: Panel completo de métricas, Gantt de programación, aprobación de PMs.
- Ve todo el equipo a su cargo.
- Puede generar reportes y exportar.

### 5.4 Administrador
- Vista ADMIN: Configuración del sistema, roles, permisos, tenant settings, categorías, locaciones.
- Acceso a AdminJS para gestión avanzada de datos.

---

## 6. Entregables y Documentación

### 6.1 Hojas de Vida
- **Generación automática** en PDF con:
  - Datos del activo + foto.
  - Historial cronológico de eventos.
  - Mantenimientos realizados (con fechas, técnico, costo).
  - Documentos adjuntos (manuale, garantías, certificados).

### 6.2 Checklists
- Exportables a PDF (formato impresión).
- Exportables a Excel (para análisis de cumplimiento).

### 6.3 Reportes
- **Mensual:** Cumplimiento de PMs, costo de mantenimiento, ranking de activos con más fallas.
- **Semanal:** Backlog, órdenes vencidas, nuevas solicitudes.
- **Diario:** Alertas críticas, órdenes del día.
- **Anual:** Resumen ejecutivo, tendencias, proyecciones.

### 6.4 Certificados
- Certificado de calibración (para equipos biomédicos/instrumentos).
- Certificado de mantenimiento preventivo (requerido en auditorías).
- Acta de entrega/recepción de activo.

---

## 7. Interacciones y Flujos Críticos

### 7.1 Flujo: Escaneo QR → Ticket
1. Usuario escanea QR en el equipo.
2. Sistema muestra ficha técnica del activo.
3. Usuario selecciona **"Reportar problema"**.
4. Se crea ticket pre-llenado con:
   - Activo vinculado.
   - Ubicación automática.
   - Categoría sugerida (según tipo de equipo).

### 7.2 Flujo: Solicitud → Mantenimiento Correctivo → Cierre → Informe
1. Usuario crea ticket (web/chatbot/QR).
2. Coordinador asigna a técnico.
3. Técnico diagnostica en campo (app móvil).
4. Si necesita materiales, crea solicitud de almacén.
5. Al cerrar: registra costo MO, materiales usados, tiempo real.
6. Sistema calcula MTTR automáticamente.
7. Si PM programado coincide, se marca como realizado.

### 7.3 Flujo: Planificación PM → Programación → Ejecución → Cumplimiento
1. Coordinador crea plan de PM anual (por categoría de activo).
2. Sistema genera órdenes automáticas según calendario.
3. Vista Gantt muestra carga de trabajo semanal.
4. Técnico ejecuta desde móvil, escanea QR, completa checklist.
5. Dashboard muestra % de cumplimiento en tiempo real.

---

## 8. Funcionalidades Faltantes Prioritarias (sin romper línea actual)

### 8.1 Alta prioridad (implementar en siguiente sprint)
- [ ] **Escaneo QR desde móvil** (usar cámara del navegador, no app nativa).
- [ ] **Vista "Mis órdenes"** para técnico (filtro por usuario asignado).
- [ ] **Gantt simplificado** (react-big-calendar con vista resource/timeline).
- [ ] **Exportación de hoja de vida** a PDF.
- [ ] **Filtros guardados** (presets de búsqueda por usuario).
- [ ] **Notificaciones Telegram** para nuevas órdenes asignadas.

### 8.2 Media prioridad
- [ ] **Checklists móviles** con checklistData renderizado como formulario.
- [ ] **Solicitud de materiales** vinculada a orden de trabajo.
- [ ] **Encuesta CSAT** al cerrar ticket.
- [ ] **Comparativas** Mes actual vs. Mes anterior en KPIs.
- [ ] **Alertas predictivas** (si MTBF cae, sugirir PM adicional).

### 8.3 Baja prioridad (roadmap posterior)
- [ ] App nativa móvil (React Native / PWA).
- [ ] Integración IoT (sensores de temperatura, vibración).
- [ ] Mapa de calor de fallas por ubicación.
- [ ] Chatbot con IA (LLM) para autodiagnóstico avanzado.
- [ ] Firma digital en orden de trabajo.

---

## 9. Recomendaciones de Experiencia de Usuario (UX)

### 9.1 Principios
- **3 clics o menos** para acciones principales (crear ticket, escanear QR, cerrar orden).
- **Sin formación requerida** para usuarios finales (portal de soporte intuitivo).
- **Mobile-first** para técnicos (botones grandes, formularios cortos, modo offline).
- **Contexto siempre visible** (nombre del activo, ubicación, técnico asignado).

### 9.2 Accesibilidad
- Cumplir WCAG 2.1 AA (contraste, navegación por teclado).
- Soporte para lectores de pantalla en portal de soporte.

---

## 10. Matriz de Cumplimiento — Estado Actual vs. Requerido

| Requerimiento | Estado Actual | Acción Necesaria |
|---------------|---------------|-------------------|
| QR → activo → ticket | Parcial | Conectar escáner móvil a formulario ticket |
| Vista "Mis órdenes" | No existe | Filtrar Maintenance por técnico asignado |
| Gantt mensual/semanal | No existe | Integrar react-big-calendar timeline |
| Hoja de vida PDF | No existe | Generar PDF con datos de HojaVida + Documentos |
| ChecklistData móvil | No usable | Transformar JSON a formulario renderizado |
| KPIs dashboard | Parcial | Ampliar con MTBF, MTTR, OEE, PM compliance |
| Exportaciones | No existe | Endpoint PDF/Excel + botón en UI |
| Notificaciones Telegram | Parcial | Vincular a asignación de orden |
| Filtros guardados | No existe | CRUD de presets por usuario |
| CSAT al cerrar ticket | No existe | Encuesta post-resolución |

---

## 11. Próximos Pasos Sugeridos

1. **Priorizar** los ítems de 8.1 en orden de valor para el usuario.
2. **Diseñar mockups** de las vistas nuevas (especialmente móvil).
3. **Validar** con 2-3 técnicos reales antes de construir.
4. **Iterar** en sprints de 2 semanas, manteniendo fronteras de módulos existentes.
5. **Documentar** cada flujo nuevo en este archivo y en el historial de implementación.

---

**Documento generado:** 2026-06-17  
**Responsable:** Equipo de Desarrollo TecMan  
**Próxima revisión:** Después de implementar ítems de 8.1
