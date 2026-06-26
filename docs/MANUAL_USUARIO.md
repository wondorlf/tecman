# Manual de Usuario — TecMan CMMS/ITAM

> **Sistema de Gestión de Activos y Mantenimiento**
> Versión 2.0 — Junio 2026
> Construido con NestJS 10 + Next.js 14 + MySQL + Prisma

---

## Índice

1. [Introducción](#1-introducción)
2. [Instalación y Despliegue](#2-instalación-y-despliegue)
   - 2.1 [Requisitos del Sistema](#21-requisitos-del-sistema)
   - 2.2 [Instalación de Dependencias](#22-instalación-de-dependencias)
   - 2.3 [Configuración de Base de Datos](#23-configuración-de-base-de-datos)
   - 2.4 [Variables de Entorno](#24-variables-de-entorno)
   - 2.5 [Ejecución en Desarrollo](#25-ejecución-en-desarrollo)
   - 2.6 [Compilación para Producción](#26-compilación-para-producción)
   - 2.7 [Despliegue con PM2](#27-despliegue-con-pm2)
   - 2.8 [Acceso a la Aplicación](#28-acceso-a-la-aplicación)
   - 2.9 [Mantenimiento y Actualización](#29-mantenimiento-y-actualización)
   - 2.10 [Solución de Problemas Comunes](#210-solución-de-problemas-comunes)
3. [Manual de Funciones por Módulo](#3-manual-de-funciones-por-módulo)
   - 3.1 [Dashboard](#31-dashboard)
   - 3.2 [Activos (Assets)](#32-activos-assets)
   - 3.3 [Kits](#33-kits)
   - 3.4 [Etiquetas (Tags)](#34-etiquetas-tags)
   - 3.5 [Asignaciones (Custodias)](#35-asignaciones-custodias)
   - 3.6 [Reservas (Bookings)](#36-reservas-bookings)
   - 3.7 [Mantenimiento](#37-mantenimiento)
   - 3.8 [Checklists](#38-checklists)
   - 3.9 [Alertas](#39-alertas)
   - 3.10 [Tickets — Mesa de Ayuda](#310-tickets--mesa-de-ayuda)
   - 3.11 [SLAs — Acuerdos de Nivel de Servicio](#311-slas--acuerdos-de-nivel-de-servicio)
   - 3.12 [Catálogo de Servicios](#312-catálogo-de-servicios)
   - 3.13 [Base de Conocimiento (Knowledge Base)](#313-base-de-conocimiento-knowledge-base)
   - 3.14 [Solicitudes de Cambio (RFC)](#314-solicitudes-de-cambio-rfc)
   - 3.15 [Discovery de Red](#315-discovery-de-red)
   - 3.16 [Agentes de Discovery](#316-agentes-de-discovery)
   - 3.17 [Usuarios](#317-usuarios)
   - 3.18 [Categorías, Ubicaciones y Proveedores](#318-categorías-ubicaciones-y-proveedores)
   - 3.19 [Documentos](#319-documentos)
   - 3.20 [Configuración del Sistema (Tenant)](#320-configuración-del-sistema-tenant)
   - 3.21 [Notificaciones (Email y Telegram)](#321-notificaciones-email-y-telegram)
   - 3.22 [Integración LDAP](#322-integración-ldap)
   - 3.23 [Panel AdminJS](#323-panel-adminjs)
4. [Manual por Rol de Usuario](#4-manual-por-rol-de-usuario)
   - 4.1 [Usuario Final / Solicitante](#41-usuario-final--solicitante)
   - 4.2 [Técnico (Tier 1 y Tier 2)](#42-técnico-tier-1-y-tier-2)
   - 4.3 [Supervisor / Coordinador](#43-supervisor--coordinador)
   - 4.4 [Administrador del Sistema](#44-administrador-del-sistema)
5. [Apéndice: API REST](#5-apéndice-api-rest)

> **📸 Capturas de pantalla:** Las imágenes referenciadas en este manual (ej: `screenshots/dashboard.png`) se almacenan en `docs/screenshots/`. Para generarlas automáticamente, ejecute:
> ```bash
> cd docs
> npm install puppeteer && node generate-screenshots.js
> ```
> Cada imagen incluye texto alternativo descriptivo para facilitar la navegación.

---

## 1. Introducción

**TecMan** es un sistema integral de gestión de activos físicos y mantenimiento (CMMS/ITAM) diseñado para organizaciones colombianas. Permite controlar el ciclo de vida completo de los activos empresariales — desde su adquisición y seguimiento hasta su mantenimiento, asignación y disposición final — integrando además una mesa de ayuda (ITSM) con gestión de tickets, SLAs y base de conocimiento.

### 1.1 Módulos Principales

| Módulo | Descripción |
|--------|-------------|
| **Activos** | Inventario tecnológico y biomédico con códigos QR, depreciación, hoja de vida, importar/exportar XLSX |
| **Mantenimiento** | Órdenes de trabajo preventivas, correctivas y predictivas con checklists y evidencias |
| **Tickets** | Mesa de ayuda con mensajería en tiempo real y escalamiento |
| **Alertas** | Monitoreo automático de vencimientos de garantía y mantenimientos |
| **Dashboard** | KPIs, gráficas y actividad reciente |
| **Discovery** | Descubrimiento automático de equipos en red mediante agentes |
| **Knowledge Base** | Artículos de autoayuda y chatbot flotante |
| **Asignaciones** | Custodias de activos a usuarios |
| **Reservas** | Calendario de reservas de activos |
| **Kits** | Agrupaciones de activos |
| **Etiquetas** | Categorización flexible |
| **SLAs** | Acuerdos de nivel de servicio para tickets |
| **Catálogo de Servicios** | Servicios ITSM ofrecidos |
| **RFC** | Solicitudes de cambio |
| **Usuarios** | Gestión de usuarios, roles y permisos (RBAC) |
| **Configuración** | Categorías, ubicaciones, proveedores y tenant |

---

## 2. Instalación y Despliegue

![Login - Pantalla de inicio de sesión](screenshots/login.png)
*Figura 2.1: Pantalla de inicio de sesión del sistema TecMan*

### 2.1 Requisitos del Sistema

| Componente | Versión Mínima |
|------------|----------------|
| Node.js | 18.x o superior |
| npm | 10.x o superior |
| MySQL | 8.0+ / MariaDB 10.6+ |
| PM2 | 5.x (para producción) |

### 2.2 Instalación de Dependencias

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

# Dependencias globales (PM2, concurrently)
npm install
```

### 2.3 Configuración de Base de Datos

1. Asegúrese de tener MySQL/MariaDB instalado y en ejecución.
2. Cree la base de datos:

```sql
CREATE DATABASE egan_tecman CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Genere el cliente Prisma y aplique el esquema:

```bash
# Generar cliente Prisma
npm run db:generate

# Crear tablas en la base de datos
npm run db:push

# Poblar datos iniciales (roles, categorías, usuario admin, artículos KB)
npm run db:seed
```

> **Nota:** Si necesita migraciones versionadas en lugar de `db:push`, use:
> ```bash
> npm run db:migrate
> ```

### 2.4 Variables de Entorno

Cree un archivo `.env` en la **raíz** del proyecto con las siguientes variables:

```env
# === Base de datos ===
DATABASE_URL="mysql://usuario:password@127.0.0.1:3306/egan_tecman"

# === JWT ===
JWT_SECRET="su-clave-secreta-aqui-cambie-esta-clave"
JWT_EXPIRES_IN="8h"

# === Servidor ===
PORT=3001
NODE_ENV=development

# === Frontend ===
FRONTEND_URL=http://localhost:3000

# === Email (Nodemailer) ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=su-correo@gmail.com
SMTP_PASS=su-contraseña-de-aplicacion
SMTP_FROM="TecMan <sistema@tecman.local>"

# === Telegram (opcional) ===
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# === Límite de subida de archivos (bytes) ===
UPLOAD_MAX_SIZE=10485760

# === LDAP (opcional) ===
LDAP_URL=
LDAP_BIND_DN=
LDAP_BIND_PASSWORD=
LDAP_BASE_DN=
LDAP_USER_FILTER=(objectClass=user)
LDAP_COMPUTER_FILTER=(objectClass=computer)
```

### 2.5 Ejecución en Desarrollo

![Login - Formulario de autenticación](screenshots/login-form.png)
*Figura 2.2: Formulario de inicio de sesión con credenciales*

Para desarrollo con recarga automática (hot-reload):

```bash
# Ambos servidores a la vez
npm run dev

# O por separado:
npm run dev:backend   # NestJS en http://localhost:3001
npm run dev:frontend  # Next.js en http://localhost:3000
```

### 2.6 Compilación para Producción

```bash
# Compilar todo
npm run build

# Esto ejecuta:
#   backend: nest build → genera dist/
#   frontend: next build → genera .next/
```

### 2.7 Despliegue con PM2

PM2 es el gestor de procesos recomendado para producción. El archivo `ecosystem.config.js` define dos procesos:

| Proceso | Puerto | Descripción |
|---------|--------|-------------|
| `tecman-api` | 3001 | Backend NestJS |
| `tecman-frontend` | 3000 | Frontend Next.js |

**Comandos de gestión:**

```bash
# Iniciar
npm run pm2:start

# Detener
npm run pm2:stop

# Reiniciar
npm run pm2:restart

# Ver estado
npm run pm2:status

# Ver logs
npm run pm2:logs
```

**Configuración de PM2** (ecosystem.config.js):

```javascript
module.exports = {
  apps: [
    {
      name: "tecman-api",
      cwd: "./backend",
      script: "dist/src/main.js",
      instances: 1,
      exec_mode: "fork",
      max_restarts: 5,
      restart_delay: 3000,
      env: { NODE_ENV: "production" },
      error_file: "../logs/tecman-api-error.log",
      out_file: "../logs/tecman-api-out.log",
      time: true,
    },
    {
      name: "tecman-frontend",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      max_restarts: 5,
      restart_delay: 3000,
      env: { NODE_ENV: "production", PORT: 3000 },
      error_file: "../logs/tecman-frontend-error.log",
      out_file: "../logs/tecman-frontend-out.log",
      time: true,
    },
  ],
}
```

### 2.8 Acceso a la Aplicación

![Sidebar - Navegación principal](screenshots/sidebar.png)
*Figura 2.3: Barra lateral de navegación con los grupos de módulos*

Una vez desplegada, la aplicación está disponible en las siguientes URLs:

| Entorno | URL | Descripción |
|---------|-----|-------------|
| **Frontend** | `http://localhost:3000` | Interfaz de usuario Next.js |
| **Backend API** | `http://localhost:3001/api` | API REST NestJS |
| **Swagger Docs** | `http://localhost:3001/api/docs` | Documentación interactiva de la API |
| **AdminJS** | `http://localhost:3001/admin` | Panel de administración de base de datos |

> **En producción:** Reemplace `localhost` por el dominio o dirección IP del servidor.

**Credenciales por defecto** (después de seed):

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@tecman.local` | `admin123` |

> ⚠️ **Cambie la contraseña inmediatamente después del primer inicio de sesión.**

### 2.9 Mantenimiento y Actualización

```bash
# 1. Actualizar código fuente (git pull)
git pull origin main

# 2. Instalar nuevas dependencias si las hay
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Aplicar cambios en base de datos
npm run db:push

# 4. Recompilar
npm run build

# 5. Reiniciar servicios
npm run pm2:restart
```

### 2.10 Solución de Problemas Comunes

| Problema | Causa Probable | Solución |
|----------|----------------|----------|
| `ECONNREFUSED` al conectar DB | MySQL no está corriendo | Inicie el servicio MySQL |
| `P1001` de Prisma | URL de base de datos incorrecta | Verifique `DATABASE_URL` en `.env` |
| Error de CORS | `FRONTEND_URL` no configurado | Agregue la URL del frontend en `.env` |
| Puerto en uso | Otro proceso usando el puerto 3000/3001 | Cambie `PORT` en `.env` o detenga el otro proceso |
| `token no válido` | JWT_SECRET no configurado | Defina `JWT_SECRET` en `.env` |
| `Module not found` | Dependencias no instaladas | Ejecute `npm install` en la raíz, backend y frontend |
| Error de compilación Next.js | Error de prerenderizado | Ya suprimido con `exit 0` en el script de build |

---

## 3. Manual de Funciones por Módulo

### 3.1 Dashboard

**Ruta:** `/dashboard`

![Dashboard - Vista principal](screenshots/dashboard.png)
*Figura 3.1: Dashboard principal con KPIs, gráficas de distribución y actividad reciente*

El Dashboard es la página principal que se muestra después de iniciar sesión. Proporciona una visión general del estado del sistema.

**Componentes:**

| Componente | Descripción |
|------------|-------------|
| **KPIs** | Tarjetas con métricas clave: total de activos, mantenimientos activos, tickets abiertos, alertas activas |
| **Gráficas** | Distribución de activos por estado, mantenimientos por tipo, tickets por estado |
| **Actividad Reciente** | Lista cronológica de las últimas acciones realizadas en el sistema |
| **Alertas Activas** | Alertas no resueltas que requieren atención inmediata |

**Acceso:** Todos los usuarios autenticados.

![Dashboard - Consolidado](screenshots/dashboard-consolidado.png)
*Figura 3.2: Vista consolidada del dashboard con métricas globales*

### 3.2 Activos (Assets)

**Ruta:** `/dashboard/assets`

![Activos - Lista paginada](screenshots/activos-lista.png)
*Figura 3.3: Lista de activos con paginación, búsqueda full-text y filtros*

El módulo de Activos es el núcleo del sistema. Permite gestionar el inventario completo de equipos tecnológicos, biomédicos y cualquier otro activo físico de la organización.

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Listar activos** | Tabla paginada con búsqueda full-text y filtros por categoría, ubicación, estado |
| **Crear activo** | Formulario con datos generales, categoría, ubicación, proveedor, atributos dinámicos |
| **Ver detalle** | Ficha completa con información general, atributos técnicos, depreciación, hoja de vida |
| **Editar activo** | Modificar cualquier campo del activo |
| **Eliminar activo** | Eliminar activo (solo si no tiene dependencias) |
| **Escaneo QR** | Vista pública y dashboard con lector QR |
| **Importar XLSX** | Carga masiva desde archivo Excel |
| **Exportar XLSX** | Descarga de inventario completo en Excel |
| **Hoja de Vida (PDF)** | Exportar historial completo del activo a PDF |
| **Depreciación** | Cálculo automático de depreciación lineal |
| **Dependencias** | Relaciones entre activos (CMDB) |
| **Vincular Discovery** | Asociar dispositivo descubierto en red al activo |

**Campos del activo:**

| Campo | Descripción |
|-------|-------------|
| Código | Código único autogenerado |
| Nombre | Nombre descriptivo del activo |
| Categoría | Clasificación principal (ej: Cómputo, Biomédico, Vehículos) |
| Subcategoría | Clasificación secundaria (ej: Laptops, Monitores) |
| Marca | Marca del fabricante |
| Modelo | Modelo específico |
| Número de serie | Serial del fabricante |
| Estado | ACTIVE, MAINTENANCE, INACTIVE, DISPOSED, RESERVED |
| Ubicación | Ubicación física dentro de la organización |
| Proveedor | Datos de compra y contacto del proveedor |
| Costo de adquisición | Valor de compra |
| Fecha de adquisición | Fecha de compra |
| Vida útil estimada | En meses (para cálculo de depreciación) |
| Garantía hasta | Fecha de expiración de garantía |
| Atributos dinámicos | Características técnicas variables según la categoría |

**Vista Pública (sin autenticación):**

![Activos - Importación XLSX](screenshots/activos-importar.png)
*Figura 3.4: Diálogo de importación masiva de activos desde archivo Excel*

![Activos - Detalle con hoja de vida](screenshots/activos-detalle.png)
*Figura 3.5: Ficha completa del activo con información general, atributos técnicos y hoja de vida*

Cualquier persona puede escanear el código QR de un activo y acceder a:
- `/activo?code=XXX` — Ficha técnica pública del activo
- Información general, ubicación y atributos básicos
- Botón "Reportar problema" → crea un ticket sin necesidad de login

![Activos - Formulario de creación](screenshots/activos-crear.png)
*Figura 3.6: Formulario de creación de activo con campos generales y atributos dinámicos*

**Endpoints API:**
- `GET /api/assets` — Listar activos (paginado, búsqueda, filtros)
- `POST /api/assets` — Crear activo
- `GET /api/assets/:id` — Obtener activo por ID
- `PUT /api/assets/:id` — Actualizar activo
- `DELETE /api/assets/:id` — Eliminar activo
- `GET /api/assets/qr/:code` — Buscar por código QR (público)
- `GET /api/assets/export` — Exportar a XLSX
- `POST /api/assets/import` — Importar desde XLSX
- `GET /api/assets/:id/hoja-vida-pdf` — Descargar hoja de vida en PDF
- `GET /api/assets/:id/depreciation` — Calcular depreciación
- `GET /api/assets/:id/history` — Historial completo

### 3.3 Kits

**Ruta:** `/dashboard/kits`

![Kits - Agrupación de activos](screenshots/kits.png)
*Figura 3.7: Gestión de kits con lista y detalle de activos agrupados*

Los Kits permiten agrupar múltiples activos en un conjunto lógico. Por ejemplo, un "Kit de Cómputo" puede incluir un laptop, un monitor, un teclado y un mouse.

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Listar kits** | Ver todos los kits creados |
| **Crear kit** | Definir nombre, descripción y activo padre opcional |
| **Añadir activo** | Agregar activos existentes al kit |
| **Remover activo** | Quitar activos del kit |
| **Ver detalle** | Listado de todos los activos que componen el kit |

**Endpoints API:**
- `GET /api/kits` — Listar kits
- `POST /api/kits` — Crear kit
- `GET /api/kits/:id` — Detalle del kit
- `POST /api/kits/:id/items` — Añadir activo al kit
- `DELETE /api/kits/:id/items/:assetId` — Remover activo del kit

### 3.4 Etiquetas (Tags)

**Ruta:** `/dashboard/tags`

![Etiquetas - Categorización flexible](screenshots/etiquetas.png)
*Figura 3.8: Gestión de etiquetas con colores y asignación a activos*

Las Etiquetas proporcionan una forma flexible de categorizar activos más allá de la jerarquía de categorías. Se pueden crear etiquetas personalizadas (ej: "Crítico", "VIP", "En garantía", "Nuevo") y asignarlas a cualquier activo.

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Listar tags** | Ver todas las etiquetas creadas |
| **Crear tag** | Definir nombre y color |
| **Asignar a activo** | Vincular una etiqueta a un activo |
| **Remover de activo** | Desvincular etiqueta de activo |
| **Eliminar tag** | Borrar etiqueta (se desvincula automáticamente de todos los activos) |

**Endpoints API:**
- `GET /api/tags` — Listar tags
- `POST /api/tags` — Crear tag
- `DELETE /api/tags/:id` — Eliminar tag
- `POST /api/tags/assign` — Asignar tag a activo
- `DELETE /api/tags/remove/:assetId/:tagId` — Remover tag de activo

### 3.5 Asignaciones (Custodias)

**Ruta:** `/dashboard/custodies`

![Asignaciones - Custodias](screenshots/asignaciones.png)
*Figura 3.9: Lista de custodias con asignaciones activas e históricas*

Las Custodias permiten llevar un registro de quién tiene asignado cada activo en un momento dado. Esto es útil para rastrear equipos entregados a empleados, préstamos temporales, etc.

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Listar asignaciones** | Ver todas las custodias activas e históricas |
| **Asignar activo** | Entregar un activo a un usuario con notas opcionales |
| **Registrar devolución** | Marcar la devolución del activo con fecha y notas |

**Flujo típico:**
1. Un administrador asigna un laptop a un empleado mediante `POST /api/custodies/assign`
2. El empleado recibe el activo con su custodia registrada
3. Cuando el empleado devuelve el equipo, se registra la devolución con `PUT /api/custodies/:id/return`
4. El historial completo de asignaciones queda registrado

**Endpoints API:**
- `GET /api/custodies` — Listar custodias
- `POST /api/custodies/assign` — Asignar activo a usuario
- `PUT /api/custodies/:id/return` — Registrar devolución

### 3.6 Reservas (Bookings)

**Ruta:** `/dashboard/bookings`

![Reservas - Calendario](screenshots/reservas.png)
*Figura 3.10: Calendario y lista de reservas de activos compartidos*

Las Reservas permiten programar el uso de activos compartidos en el tiempo, evitando conflictos de disponibilidad.

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Listar reservas** | Ver todas las reservas con filtros |
| **Crear reserva** | Definir activo, usuario, fecha inicio y fin |
| **Actualizar estado** | Aprobar, rechazar, cancelar o completar reservas |

**Estados de reserva:**
- `PENDING` — Pendiente de aprobación
- `APPROVED` — Aprobada
- `ACTIVE` — En curso
- `COMPLETED` — Finalizada
- `CANCELLED` — Cancelada

**Endpoints API:**
- `GET /api/bookings` — Listar reservas
- `POST /api/bookings` — Crear reserva
- `PUT /api/bookings/:id/status` — Actualizar estado

### 3.7 Mantenimiento

**Ruta:** `/dashboard/maintenance`

![Mantenimiento - Lista de órdenes](screenshots/mantenimiento-lista.png)
*Figura 3.11: Lista de órdenes de mantenimiento con filtros por tipo, estado y técnico*

El módulo de Mantenimiento gestiona las órdenes de trabajo para intervenciones preventivas, correctivas y predictivas sobre los activos.

**Tipos de mantenimiento:**
- `PREVENTIVE` — Mantenimiento programado periódicamente
- `CORRECTIVE` — Reparación por falla o avería
- `PREDICTIVE` — Basado en análisis de condiciones del equipo

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Listar órdenes** | Tabla paginada con búsqueda y filtros por tipo, estado, técnico, activo |
| **Crear orden** | Asignar técnico, activo, tipo, prioridad y fecha programada |
| **Ver detalle** | Información completa incluyendo checklist, evidencias y diagnóstico |
| **Completar orden** | Registrar diagnóstico, solución, costo y evidencias |
| **Exportar XLSX** | Descargar reporte de mantenimientos |
| **Subir evidencias** | Fotos, videos, documentos y firmas digitales |

**Estados:**
- `PENDING` — Pendiente
- `SCHEDULED` — Programado
- `IN_PROGRESS` — En progreso
- `COMPLETED` — Completado
- `CANCELLED` — Cancelado

**Prioridades:**
- `LOW` — Baja
- `MEDIUM` — Media
- `HIGH` — Alta
- `CRITICAL` — Crítica

**Endpoints API:**
- `GET /api/maintenance` — Listar mantenimientos
- `POST /api/maintenance` — Crear orden
- `GET /api/maintenance/:id` — Ver detalle
- `PUT /api/maintenance/:id` — Actualizar
- `PUT /api/maintenance/:id/complete` — Completar orden
- `GET /api/maintenance/export` — Exportar a XLSX

![Mantenimiento - Detalle de orden](screenshots/mantenimiento-detalle.png)
*Figura 3.12: Detalle de orden de mantenimiento con checklist, evidencias y diagnóstico*

### 3.8 Checklists

**Ruta:** `/dashboard/checklists`

![Checklists - Plantillas dinámicas](screenshots/checklists.png)
*Figura 3.13: Plantillas de checklist con ítems de 12 tipos de campo diferentes*

Los Checklists son plantillas dinámicas de inspección que se pueden asociar a las órdenes de mantenimiento.

**Tipos de campo soportados (12 tipos):**
- `TEXT` — Campo de texto libre
- `NUMBER` — Valor numérico
- `BOOLEAN` — Sí/No
- `DATE` — Fecha
- `TIME` — Hora
- `SELECT` — Selección única de opciones
- `MULTI_SELECT` — Selección múltiple
- `CHECKBOX` — Casilla de verificación
- `YES_NO_NA` — Sí/No/No aplica
- `PHOTO` — Captura de fotografía
- `SIGNATURE` — Firma digital
- `INSPECTION` — Inspección con aprobado/rechazado

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Listar checklists** | Ver todas las plantillas |
| **Crear checklist** | Definir nombre y agregar ítems con tipo de campo |
| **Editar checklist** | Modificar ítems existentes |
| **Eliminar checklist** | Borrar plantilla |

**Endpoints API:**
- `GET /api/checklists` — Listar checklists
- `POST /api/checklists` — Crear checklist con ítems
- `GET /api/checklists/:id` — Ver detalle
- `PUT /api/checklists/:id` — Actualizar
- `DELETE /api/checklists/:id` — Eliminar

### 3.9 Alertas

**Ruta:** `/dashboard/alerts`

![Alertas - Monitoreo automático](screenshots/alertas.png)
*Figura 3.14: Lista de alertas activas con tipos, estados y opciones de resolución*

El sistema de Alertas monitorea automáticamente condiciones críticas y notifica a los usuarios responsables.

**Tipos de alerta automáticas:**
- `WARRANTY_EXPIRY` — Alertas 30 días antes del vencimiento de garantía
- `MAINTENANCE_DUE` — Alertas cuando un mantenimiento está próximo a vencer

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Listar alertas** | Tabla paginada con búsqueda y filtros |
| **Crear alerta manual** | Definir alerta personalizada |
| **Resolver alerta** | Marcar como atendida con usuario responsable |
| **Verificar ahora** | Ejecutar verificación manual de condiciones |

**Scheduler automático:**
El sistema ejecuta automáticamente la verificación de alertas cada **6 horas** mediante un cron job de `@nestjs/schedule`.

**Endpoints API:**
- `GET /api/alerts` — Listar alertas
- `POST /api/alerts` — Crear alerta manual
- `POST /api/alerts/check` — Verificar condiciones ahora
- `PUT /api/alerts/:id/resolve` — Resolver alerta

### 3.10 Tickets — Mesa de Ayuda

**Ruta:** `/dashboard/tickets`

![Tickets - Lista de mesa de ayuda](screenshots/tickets-lista.png)
*Figura 3.15: Lista de tickets con filtros por estado, prioridad y asignado*

![Tickets - Detalle con mensajería](screenshots/tickets-detalle.png)
*Figura 3.16: Detalle de ticket con hilo de mensajes, cambios de estado y opciones*

El módulo de Tickets proporciona una mesa de ayuda completa con mensajería, asignación y escalamiento.

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Listar tickets** | Tabla paginada con filtros por estado, prioridad, asignado |
| **Crear ticket** | Desde el dashboard o desde el portal público |
| **Ver detalle** | Hilo completo de mensajes y cambios de estado |
| **Actualizar ticket** | Cambiar estado, prioridad, asignación |
| **Agregar mensaje** | Comunicación dentro del ticket |
| **Escalar ticket** | Derivar a nivel superior de soporte |
| **Crear desde QR** | Usuario escanea QR del activo → ticket pre-llenado |
| **Portal público** | Usuarios no autenticados pueden crear tickets y rastrearlos |
| **Encuesta CSAT** | Calificación post-resolución (1-5 estrellas) |
| **Exportar XLSX** | Descargar reporte de tickets |

**Estados:**
- `OPEN` — Abierto
- `ASSIGNED` — Asignado
- `IN_PROGRESS` — En progreso
- `WAITING` — Esperando información
- `RESOLVED` — Resuelto
- `CLOSED` — Cerrado

**Prioridades:**
- `LOW` — Baja
- `MEDIUM` — Media
- `HIGH` — Alta
- `CRITICAL` — Crítica

**Notificaciones:**
- Al crear un ticket, se envía notificación por email al usuario creador
- Si está configurado Telegram, se envía notificación al grupo de administradores
- WebSocket en tiempo real para actualizaciones de tickets

**Portal Público:**
Cualquier persona puede:
1. Crear un ticket desde `/soporte` (sin autenticación)
2. Rastrear el estado de su ticket mediante el código asignado
3. Escanear un código QR de un activo y reportar un problema vinculado a ese equipo

**Endpoints API:**
- `GET /api/tickets` — Listar tickets
- `POST /api/tickets` — Crear ticket (autenticado)
- `POST /api/tickets/public` — Crear ticket desde portal público
- `GET /api/tickets/public/track/:code` — Rastrear ticket público
- `GET /api/tickets/:id` — Ver detalle con mensajes
- `PUT /api/tickets/:id` — Actualizar ticket
- `POST /api/tickets/:id/messages` — Agregar mensaje
- `POST /api/tickets/:id/csat` — Enviar encuesta CSAT
- `GET /api/tickets/export` — Exportar a XLSX

### 3.11 SLAs — Acuerdos de Nivel de Servicio

**Ruta:** `/dashboard/slas`

![SLAs - Acuerdos de servicio](screenshots/slas.png)
*Figura 3.18: Acuerdos de nivel de servicio con tiempos de respuesta y resolución*

Los SLAs (Service Level Agreements) definen los tiempos de respuesta y resolución comprometidos para los tickets.

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Listar SLAs** | Ver todos los acuerdos definidos |
| **Crear SLA** | Definir nombre, descripción, horas de respuesta y resolución |
| **Editar SLA** | Modificar parámetros del acuerdo |
| **Eliminar SLA** | Borrar acuerdo |

**Endpoints API:**
- `GET /api/slas` — Listar SLAs
- `POST /api/slas` — Crear SLA
- `PUT /api/slas/:id` — Actualizar SLA
- `DELETE /api/slas/:id` — Eliminar SLA

### 3.12 Catálogo de Servicios

**Ruta:** `/dashboard/service-catalog`

![Catálogo de Servicios](screenshots/catalogo-servicios.png)
*Figura 3.19: Catálogo de servicios ITSM ofrecidos a los usuarios*

El Catálogo de Servicios define los servicios ITSM que la organización ofrece a sus usuarios, permitiendo estandarizar la creación de tickets.

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Listar servicios** | Ver catálogo completo |
| **Crear servicio** | Definir nombre, descripción, categoría y tipo |
| **Editar servicio** | Modificar servicio existente |
| **Eliminar servicio** | Borrar servicio del catálogo |

**Endpoints API:**
- `GET /api/service-catalog` — Listar servicios
- `POST /api/service-catalog` — Crear servicio
- `PUT /api/service-catalog/:id` — Actualizar
- `DELETE /api/service-catalog/:id` — Eliminar

### 3.13 Base de Conocimiento (Knowledge Base)

**Ruta:** `/dashboard/knowledge`

![Knowledge Base - Artículos de autoayuda](screenshots/knowledge-base.png)
*Figura 3.20: Base de conocimiento con categorías, búsqueda y artículos*

La Base de Conocimiento almacena artículos de autoayuda organizados por categorías, accesibles desde el dashboard y desde el chatbot flotante.

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Explorar categorías** | Navegar artículos por categoría |
| **Buscar artículos** | Búsqueda full-text en título y contenido |
| **Ver artículo** | Contenido completo con incremento de vistas |
| **Calificar artículo** | Marcar como útil o no útil |
| **Crear ticket desde KB** | Si un artículo no resolvió el problema, crear ticket vinculado |

**Categorías predefinidas (seed):**
- Computadores
- Impresoras
- Redes y Conectividad
- Equipos Biomédicos
- Energía y Respaldo
- Soporte General

**Chatbot Flotante:**

![Chatbot flotante de ayuda](screenshots/chatbot-flotante.png)
*Figura 3.21: Chatbot flotante con acceso rápido a KB, tickets, QR y Discovery*

El chatbot flotante (`<FloatingHelp />`) aparece en todas las páginas del dashboard y ofrece:
- Acceso rápido a la Base de Conocimiento
- Búsqueda de artículos desde el chat
- Acceso directo a creación de tickets
- Enlace al escáner QR
- Enlace al Discovery de red

**Endpoints API:**
- `GET /api/knowledge/categories` — Listar categorías
- `GET /api/knowledge/articles` — Listar artículos (con búsqueda)
- `GET /api/knowledge/articles/:id` — Ver artículo
- `POST /api/knowledge/articles/:id/rate` — Calificar artículo

### 3.14 Solicitudes de Cambio (RFC)

**Ruta:** `/dashboard/change-requests`

![RFC - Solicitudes de Cambio](screenshots/rfc.png)
*Figura 3.22: Solicitudes de cambio (RFC) con flujo de aprobación ITIL*

Las Solicitudes de Cambio (Request for Change) implementan el flujo ITIL de gestión de cambios, permitiendo documentar, aprobar y programar cambios en la infraestructura.

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Listar RFCs** | Ver todas las solicitudes de cambio |
| **Crear RFC** | Documentar título, descripción, justificación, nivel de riesgo |
| **Vincular a ticket** | Asociar RFC a un ticket existente |
| **Actualizar estado** | Aprobar, rechazar, implementar, cerrar |

**Niveles de riesgo:**
- `LOW` — Bajo
- `MEDIUM` — Medio
- `HIGH` — Alto
- `CRITICAL` — Crítico

**Estados:**
- `DRAFT` — Borrador
- `SUBMITTED` — Enviado para revisión
- `APPROVED` — Aprobado
- `IN_PROGRESS` — En implementación
- `COMPLETED` — Completado
- `REJECTED` — Rechazado
- `ROLLED_BACK` — Reversado

**Endpoints API:**
- `GET /api/change-requests` — Listar RFCs
- `POST /api/change-requests` — Crear RFC
- `GET /api/change-requests/:id` — Ver detalle
- `PUT /api/change-requests/:id/status` — Actualizar estado

### 3.15 Discovery de Red

**Ruta:** `/dashboard/discovery`

![Discovery - Dispositivos en red](screenshots/discovery.png)
*Figura 3.23: Dispositivos descubiertos en red con información de hardware*

El módulo Discovery permite descubrir automáticamente equipos en la red mediante agentes instalados en las máquinas de los usuarios.

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Dashboard discovery** | Estadísticas: dispositivos totales, por SO, cambios recientes |
| **Listar dispositivos** | Todos los dispositivos descubiertos con información de hardware |
| **Ver detalle** | Información completa: CPU, RAM, discos, red, SO |
| **Historial de cambios** | Cambios de hardware detectados entre reportes |
| **Vincular a activo** | Convertir dispositivo discovery en activo oficial del inventario |
| **Métricas de agentes** | Versiones, última conexión, frecuencia de reporte |

**Información recolectada por dispositivo:**
- Nombre del equipo (hostname)
- Sistema operativo y versión
- Fabricante y modelo
- Número de serie
- CPU (fabricante, modelo, núcleos, frecuencia)
- Memoria RAM total
- Discos (modelo, tamaño, tipo)
- Direcciones IP y MAC
- Usuarios del dominio

**Endpoints API:**
- `GET /api/discovery` — Listar dispositivos
- `GET /api/discovery/stats` — Estadísticas
- `GET /api/discovery/agent-metrics` — Métricas de agentes
- `GET /api/discovery/:id` — Ver detalle
- `GET /api/discovery/:id/changes` — Historial de cambios
- `POST /api/discovery/agent` — Recibir datos del agente (público)
- `PUT /api/discovery/:id/link-to-asset` — Vincular a activo

![Discovery - Detalle de dispositivo](screenshots/discovery-detalle.png)
*Figura 3.24: Detalle de dispositivo discovery con CPU, RAM, discos e historial de cambios*

### 3.16 Agentes de Discovery

**Ruta:** `/dashboard/agents`

![Agentes - Descarga e instalación](screenshots/agentes.png)
*Figura 3.25: Página de descarga e instalación de agentes de discovery*

Página para descargar e instalar los agentes de discovery en las máquinas de la red.

**Agentes disponibles:**

| Agente | Plataforma | Descripción |
|--------|------------|-------------|
| **PowerShell** | Windows (recomendado) | Script nativo, captura serial de BIOS, se instala como tarea programada |
| **Go** | Windows/Linux/macOS | Ejecutable compilado, multiplataforma |

**¿Cómo funciona?**
1. Desde la página "Descargar Agente", el administrador descarga el script PowerShell o el binario Go
2. Instala el agente en las máquinas de la red (mediante GPO, script remoto o manualmente)
3. El agente recolecta información del hardware y la envía al servidor TecMan
4. Los dispositivos aparecen automáticamente en Discovery
5. El administrador puede vincular dispositivos discovery a activos existentes o crear nuevos activos

**Instalación rápida (PowerShell):**
```powershell
# Ejecutar como Administrador en la máquina objetivo
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('http://<servidor>:3001/api/agents/powershell/run'))"
```

**Endpoints API:**
- `GET /api/agents/powershell` — Descargar script PowerShell
- `GET /api/agents/powershell/run` — Obtener script para ejecución remota
- `GET /api/agents/go` — Descargar agente Go
- `GET /api/agents/go/source` — Ver código fuente Go
- `GET /api/agents/info` — Información de instalación

### 3.17 Usuarios

**Ruta:** `/dashboard/users`

![Usuarios - Lista](screenshots/usuarios-lista.png)
*Figura 3.26: Lista de usuarios del sistema con roles, estados y búsqueda*

Gestión de usuarios del sistema con control de acceso basado en roles (RBAC).

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| **Listar usuarios** | Tabla paginada con búsqueda |
| **Crear usuario** | Registrar nuevo usuario con nombre, email, rol |
| **Editar usuario** | Modificar datos del usuario |
| **Activar/Desactivar** | Habilitar o deshabilitar acceso al sistema |
| **Ver perfil propio** | Cada usuario puede ver y editar su propio perfil |
| **Roles** | Listar roles disponibles en el sistema |

**Roles del sistema:**
| Rol | Descripción |
|-----|-------------|
| **Administrador** | Acceso completo a todas las funcionalidades |
| **Superadministrador Egan** | Acceso total, incluyendo configuración avanzada |
| **Técnico** | Gestión de mantenimientos, tickets, activos asignados |
| **Usuario Final** | Creación y seguimiento de tickets propios |

![Usuarios - Formulario de creación](screenshots/usuarios-crear.png)
*Figura 3.27: Formulario de creación de usuario con selección de rol*

**Endpoints API:**
- `GET /api/users` — Listar usuarios
- `POST /api/users` — Crear usuario (solo admin)
- `GET /api/users/me` — Perfil propio
- `PUT /api/users/me` — Actualizar perfil propio
- `GET /api/users/:id` — Ver usuario
- `PUT /api/users/:id` — Actualizar usuario (solo admin)
- `PUT /api/users/:id/toggle` — Activar/Desactivar (solo admin)
- `GET /api/users/roles` — Listar roles

### 3.18 Categorías, Ubicaciones y Proveedores

**Ruta Categorías:** `/dashboard/settings`

![Categorías - Jerarquía de activos](screenshots/categorias.png)
*Figura 3.28: Gestión de categorías y subcategorías de activos*

Estos módulos de configuración permiten definir la estructura organizativa del inventario.

#### Categorías

Las Categorías organizan los activos en una jerarquía de dos niveles (categoría → subcategoría).

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| Listar categorías | Árbol completo con subcategorías |
| Crear categoría | Definir nombre y descripción |
| Editar categoría | Modificar nombre |
| Eliminar categoría | Borrar (solo si no tiene activos asociados) |
| Crear subcategoría | Agregar subnivel dentro de una categoría |
| Editar/eliminar subcategoría | Modificar o eliminar subnivel |

#### Ubicaciones

Las Ubicaciones definen la jerarquía física donde se encuentran los activos (ej: Sede → Piso → Oficina).

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| Listar ubicaciones | Todas las ubicaciones registradas |
| Crear ubicación | Definir nombre, dirección, edificio, piso, sala |
| Editar ubicación | Modificar datos |
| Eliminar ubicación | Borrar (solo si no tiene activos asociados) |

#### Proveedores

Registro de proveedores con datos de contacto e información de compra.

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| Listar proveedores | Todos los proveedores registrados |
| Crear proveedor | Registrar nombre, contacto, teléfono, email, web |
| Editar proveedor | Modificar datos |
| Eliminar proveedor | Borrar (solo si no tiene activos asociados) |

![Ubicaciones - Ubicaciones físicas](screenshots/ubicaciones.png)
*Figura 3.29: Gestión de ubicaciones físicas de los activos*

![Proveedores - Registro de proveedores](screenshots/proveedores.png)
*Figura 3.30: Registro de proveedores con datos de contacto*

**Endpoints API:**
- `GET/POST /api/categories` — CRUD categorías
- `POST /api/categories/:id/subcategories` — Crear subcategoría
- `GET/POST /api/locations` — CRUD ubicaciones
- `GET/POST /api/suppliers` — CRUD proveedores

### 3.19 Documentos

El módulo de Documentos permite adjuntar archivos a los activos, como manuales, certificados, facturas, garantías y fichas técnicas.

**Tipos de documento:**
- `MANUAL` — Manual de usuario / técnico
- `CERTIFICATE` — Certificado de calibración o garantía
- `WARRANTY` — Documento de garantía
- `INVOICE` — Factura de compra
- `TECHNICAL_SHEET` — Ficha técnica
- `OTHER` — Otros

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| Subir documento | Adjuntar archivo a un activo |
| Listar documentos | Filtros por activo, tipo |
| Descargar documento | Obtener el archivo original |
| Eliminar documento | Borrar documento (solo administradores) |

**Control de versiones:**
Los documentos soportan versionado: cada documento puede tener una versión anterior y posteriores, permitiendo rastrear el historial de actualizaciones.

**Endpoints API:**
- `POST /api/documents` — Subir documento
- `GET /api/documents` — Listar documentos
- `DELETE /api/documents/:id` — Eliminar (solo administradores)

### 3.20 Configuración del Sistema (Tenant)

**Ruta:** `/dashboard/tenant`

![Tenant - Configuración del sistema](screenshots/configuracion-tenant.png)
*Figura 3.31: Configuración del sistema con datos de empresa, logo y Telegram*

La configuración del Tenant permite personalizar la apariencia y el comportamiento del sistema para la organización.

**Campos configurables:**

| Campo | Descripción |
|-------|-------------|
| Nombre de empresa | Nombre que se muestra en el sistema |
| Logo URL | URL del logo corporativo |
| NIT/Documento | Identificación fiscal de la empresa |
| Dirección | Dirección física |
| Teléfono | Número de contacto |
| Email | Correo electrónico corporativo |
| Token de Telegram | Bot token para notificaciones |
| Chat ID de Telegram | Grupo para notificaciones |
| Notificaciones Telegram | Activar/desactivar |
| Límite de subida | Tamaño máximo de archivos (bytes) |

**Configuraciones públicas** (accesibles sin autenticación):
El endpoint `/api/tenants/public` expone el nombre, logo y datos de contacto para mostrarlos en la interfaz pública y en los PDFs de hoja de vida.

**Endpoints API:**
- `GET /api/tenants/public` — Configuración pública
- `GET /api/tenants/settings` — Configuración completa (admin)
- `PATCH /api/tenants/settings/:id` — Actualizar configuración (admin)

### 3.21 Notificaciones (Email y Telegram)

El sistema de Notificaciones envía alertas automáticas cuando ocurren eventos importantes.

**Canales de notificación:**

| Canal | Propósito | Configuración |
|-------|-----------|---------------|
| **Email** | Notificaciones al usuario creador de tickets | Configuración SMTP en `.env` |
| **Telegram** | Notificaciones al grupo de administradores | Token y Chat ID en Tenant |

**Eventos que generan notificaciones:**

| Evento | Email | Telegram |
|--------|-------|----------|
| Ticket creado (usuario) | ✅ Al creador | — |
| Ticket creado (nuevo) | — | ✅ Al grupo admin |
| Alerta generada | — | — (futuro) |
| Mantenimiento asignado | — | — (futuro) |

**Endpoints:** Interno (no expuesto como API REST).

### 3.22 Integración LDAP

El módulo LDAP permite sincronizar usuarios y equipos desde un Active Directory corporativo.

**Funcionalidades:**

| Acción | Descripción |
|--------|-------------|
| Probar conexión | Verificar conectividad con el servidor LDAP |
| Sincronizar usuarios | Importar usuarios desde AD al sistema |
| Sincronizar equipos | Importar equipos desde AD como dispositivos discovery |

**Configuración previa requerida (en `.env`):**
```
LDAP_URL=ldap://suzydc01.egan.co:389
LDAP_BIND_DN=cn=admin,dc=egan,dc=co
LDAP_BIND_PASSWORD=su-contraseña
LDAP_BASE_DN=dc=egan,dc=co
```

**Endpoints API (solo administradores):**
- `POST /api/ldap/test` — Probar conexión
- `POST /api/ldap/sync/users` — Sincronizar usuarios
- `POST /api/ldap/sync/computers` — Sincronizar equipos

### 3.23 Panel AdminJS

**Ruta:** `/admin`

![AdminJS - Panel de administración](screenshots/adminjs.png)
*Figura 3.32: Panel de administración AdminJS con modelos de base de datos*

AdminJS es un panel de administración de base de datos que permite visualizar y gestionar directamente todos los modelos del sistema.

**Acceso:**
- URL: `http://localhost:3001/admin`
- Requiere autenticación (misma que el dashboard)
- Solo usuarios con rol Administrador

**Modelos disponibles:**
Todos los modelos del esquema Prisma: User, Asset, Maintenance, Ticket, Alert, Checklist, Document, Category, Location, Supplier, Custody, Booking, Kit, Tag, KnowledgeArticle, Sla, ServiceCatalog, ChangeRequest, DiscoveredDevice, etc.

**Usos recomendados:**
- Auditoría de datos
- Corrección de registros
- Gestión avanzada de permisos
- Visualización de relaciones entre modelos

---

## 4. Manual por Rol de Usuario

### 4.1 Usuario Final / Solicitante

**¿Quién es?** Empleado de la organización que necesita reportar problemas con sus equipos o solicitar servicios de TI.

**¿Qué puede hacer?**

| Acción | Cómo hacerlo |
|--------|-------------|
| **Escaneo QR de activo** | Use la cámara de su celular para escanear el código QR pegado en el equipo |
| **Ver ficha técnica** | Al escanear el QR, verá los datos básicos del activo |
| **Reportar un problema** | En la vista del activo, haga clic en "Reportar problema" → describa el inconveniente → se crea un ticket automático |
| **Crear ticket desde portal** | Vaya a la página de soporte (`/soporte`) y complete el formulario |
| **Rastrear mi ticket** | Con el código del ticket, consulte su estado en el portal público |
| **Consultar Base de Conocimiento** | Busque soluciones a problemas comunes en la KB |
| **Calificar atención** | Al cerrar su ticket, califique la atención recibida (1-5 estrellas) |

**Pantallas que ve:**
- `/` — Landing page pública
- `/soporte` — Portal de soporte (crear y rastrear tickets)
- `/activo?code=XXX` — Ficha pública del activo

![Vista pública QR - Ficha técnica](screenshots/vista-publica-qr.png)
*Figura 4.2: Vista pública de un activo desde código QR, accesible sin autenticación*

**Lo que NO puede hacer:**
- Acceder al dashboard principal
- Gestionar activos
- Ver activos de otros usuarios
- Crear mantenimientos

### 4.2 Técnico (Tier 1 y Tier 2)

![Perfil de usuario](screenshots/perfil-usuario.png)
*Figura 4.3: Perfil de usuario con opciones de edición de datos personales*

**¿Quién es?** Técnico de soporte o mantenimiento que ejecuta órdenes de trabajo y atiende tickets.

**¿Qué puede hacer?**

**Dashboard y Mis Órdenes:**

| Acción | Descripción |
|--------|-------------|
| **Ver Dashboard** | KPIs generales, actividad reciente, alertas activas |
| **Mis Órdenes** | Filtro automático para ver solo las órdenes de mantenimiento asignadas a mí |
| **Ver calendario** | Próximos mantenimientos programados |

**Gestión de Activos:**

| Acción | Descripción |
|--------|-------------|
| **Ver detalle de activo** | Ficha técnica completa, atributos, hoja de vida |
| **Escaneo QR** | Identificar activos rápidamente desde el móvil |
| **Ver documentos** | Descargar manuales y fichas técnicas asociadas |

**Mantenimiento:**

| Acción | Descripción |
|--------|-------------|
| **Ver órdenes asignadas** | Lista filtrada por técnico actual |
| **Iniciar mantenimiento** | Cambiar estado a "En progreso" |
| **Completar orden** | Registrar diagnóstico, solución, costo y evidencias |
| **Subir evidencias** | Fotos, firmas digitales, documentos |
| **Completar checklist** | Responder los ítems de inspección asociados |

**Tickets:**

| Acción | Descripción |
|--------|-------------|
| **Ver tickets asignados** | Lista de tickets pendientes |
| **Actualizar estado** | Avanzar el ticket en su flujo |
| **Responder mensajes** | Comunicarse con el solicitante |
| **Escalar ticket** | Derivar a nivel superior si no puede resolver |

**Base de Conocimiento:**

| Acción | Descripción |
|--------|-------------|
| **Consultar artículos** | Buscar soluciones documentadas |
| **Calificar artículos** | Marcar como útiles para mejorar la base |

**Lo que NO puede hacer:**
- Crear/modificar usuarios
- Eliminar activos
- Configurar SLAs
- Acceder al panel AdminJS
- Gestionar categorías/ubicaciones/proveedores

### 4.3 Supervisor / Coordinador

**¿Quién es?** Supervisor del equipo de soporte o mantenimiento, coordinador de operaciones.

**Además de todo lo que puede hacer un Técnico, el Supervisor puede:**

**Gestión de Equipo:**

| Acción | Descripción |
|--------|-------------|
| **Ver órdenes de todo el equipo** | Sin filtro de técnico |
| **Asignar mantenimientos** | Asignar técnicos a órdenes de trabajo |
| **Asignar tickets** | Distribuir tickets entre los técnicos |
| **Ver Dashboard consolidado** | KPIs ampliados con gráficas y métricas |
| **Ver Consolidado** | Reporte global del sistema |

**Alertas:**

| Acción | Descripción |
|--------|-------------|
| **Ver todas las alertas** | Monitoreo completo |
| **Resolver alertas** | Marcar como atendidas |
| **Verificar condiciones** | Ejecutar verificación manual |

**Reportes:**

| Acción | Descripción |
|--------|-------------|
| **Exportar activos** | Descargar inventario en Excel |
| **Exportar mantenimientos** | Descargar reporte de órdenes en Excel |
| **Exportar tickets** | Descargar reporte de tickets en Excel |
| **Exportar hoja de vida** | Descargar historial de activo en PDF |

**SLAs y Catálogo:**

| Acción | Descripción |
|--------|-------------|
| **Ver SLAs** | Consultar acuerdos de nivel de servicio |
| **Ver Catálogo de Servicios** | Servicios ITSM disponibles |

**Discovery:**

| Acción | Descripción |
|--------|-------------|
| **Ver dispositivos discovery** | Equipos descubiertos en la red |
| **Vincular a activos** | Convertir dispositivos discovery en activos oficiales |

**Lo que NO puede hacer:**
- Eliminar documentos (solo administradores)
- Configurar el sistema (Tenant)
- Gestionar integración LDAP
- Acceder a AdminJS
- Eliminar activos

### 4.4 Administrador del Sistema

**¿Quién es?** Administrador de TI o responsable del sistema con acceso completo a todas las funcionalidades.

**Además de todo lo que pueden hacer Técnico y Supervisor, el Administrador puede:**

**Usuarios:**

| Acción | Descripción |
|--------|-------------|
| **Crear usuarios** | Registrar nuevos usuarios |
| **Editar usuarios** | Modificar datos y roles |
| **Activar/Desactivar** | Habilitar o bloquear acceso |
| **Ver roles** | Consultar roles disponibles |

**Configuración del Sistema:**

| Acción | Descripción |
|--------|-------------|
| **Configurar empresa** | Nombre, logo, NIT, datos de contacto |
| **Configurar Telegram** | Token y Chat ID para notificaciones |
| **Configurar subida** | Límite de tamaño de archivos |

**Categorías, Ubicaciones y Proveedores:**

| Acción | Descripción |
|--------|-------------|
| **CRUD completo** | Crear, editar, eliminar categorías, ubicaciones y proveedores |

**Checklists:**

| Acción | Descripción |
|--------|-------------|
| **CRUD completo** | Crear, editar, eliminar plantillas de checklist |

**Documentos:**

| Acción | Descripción |
|--------|-------------|
| **Eliminar documentos** | Borrar documentos del sistema (solo admin) |

**Integración LDAP:**

| Acción | Descripción |
|--------|-------------|
| **Probar conexión LDAP** | Verificar conectividad con Active Directory |
| **Sincronizar usuarios** | Importar desde AD |
| **Sincronizar equipos** | Importar equipos desde AD |

**Panel AdminJS:**

| Acción | Descripción |
|--------|-------------|
| **Acceso completo** | Gestión directa de base de datos |
| **Auditoría** | Revisar registros de todas las tablas |
| **Corrección de datos** | Editar registros directamente |

**SLAs y Catálogo:**

| Acción | Descripción |
|--------|-------------|
| **CRUD completo** | Crear, editar, eliminar SLAs y servicios del catálogo |

**Eliminación de datos:**

| Acción | Descripción |
|--------|-------------|
| **Eliminar activos** | Borrar activos del sistema |
| **Eliminar checklists** | Borrar plantillas |
| **Eliminar categorías** | Borrar categorías (si no tienen activos) |

---

## 5. Apéndice: API REST

![Swagger - Documentación interactiva](screenshots/swagger-docs.png)
*Figura 5.1: Documentación interactiva de la API REST disponible en `/api/docs`*

### 5.1 Autenticación

Todas las rutas de la API (excepto las marcadas como `@Public()`) requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

**Obtener token:**

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@tecman.local",
  "password": "admin123"
}
```

Respuesta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "email": "admin@tecman.local", "name": "Admin" }
}
```

### 5.2 Resumen de Endpoints

| Módulo | Endpoints | Documentación |
|--------|-----------|---------------|
| Auth | `POST /api/auth/login`, `GET /api/auth/me` | Swagger |
| Users | `GET/POST /api/users`, `GET/PUT /api/users/:id`, etc. | Swagger |
| Assets | `GET/POST /api/assets`, `GET/PUT/DELETE /api/assets/:id`, etc. | Swagger |
| Maintenance | `GET/POST /api/maintenance`, `GET/PUT /api/maintenance/:id`, etc. | Swagger |
| Tickets | `GET/POST /api/tickets`, `GET/PUT /api/tickets/:id`, etc. | Swagger |
| Alerts | `GET/POST /api/alerts`, `PUT /api/alerts/:id/resolve`, etc. | Swagger |
| Checklists | `GET/POST /api/checklists`, `PUT/DELETE /api/checklists/:id` | Swagger |
| Categories | `GET/POST /api/categories`, `PUT/DELETE /api/categories/:id` | Swagger |
| Locations | `GET/POST /api/locations`, `PUT/DELETE /api/locations/:id` | Swagger |
| Suppliers | `GET/POST /api/suppliers`, `PUT/DELETE /api/suppliers/:id` | Swagger |
| Documents | `GET/POST /api/documents`, `DELETE /api/documents/:id` | Swagger |
| Dashboard | `GET /api/dashboard/stats`, `GET /api/dashboard/recent` | Swagger |
| Discovery | `GET /api/discovery`, `POST /api/discovery/agent`, etc. | Swagger |
| Agents | `GET /api/agents/powershell`, `GET /api/agents/go`, etc. | — |
| Knowledge | `GET /api/knowledge/categories`, `GET /api/knowledge/articles` | Swagger |
| Custodies | `GET /api/custodies`, `POST /api/custodies/assign`, etc. | Swagger |
| Bookings | `GET/POST /api/bookings`, `PUT /api/bookings/:id/status` | Swagger |
| Kits | `GET/POST /api/kits`, `POST/DELETE /api/kits/:id/items` | Swagger |
| Tags | `GET/POST /api/tags`, `POST/DELETE /api/tags/assign` | Swagger |
| SLAs | `GET/POST /api/slas`, `PUT/DELETE /api/slas/:id` | Swagger |
| Service Catalog | `GET/POST /api/service-catalog`, `PUT/DELETE /api/service-catalog/:id` | Swagger |
| Change Requests | `GET/POST /api/change-requests`, `PUT /api/change-requests/:id/status` | Swagger |
| Tenants | `GET /api/tenants/public`, `PATCH /api/tenants/settings/:id` | Swagger |
| LDAP | `POST /api/ldap/test`, `POST /api/ldap/sync/users`, etc. | Swagger |

> **Documentación interactiva completa disponible en:** `http://localhost:3001/api/docs` (Swagger UI)

---

## 6. Apéndice: Atajos de Teclado y Buenas Prácticas

### 6.1 Atajos de Navegación General

| Atajo | Acción |
|-------|--------|
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Abrir búsqueda global en el sistema |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | Colapsar/expandir barra lateral |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> | Crear nuevo elemento (activo, ticket, orden) |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Guardar formulario actual |
| <kbd>Escape</kbd> | Cerrar modal o diálogo abierto |
| <kbd>F5</kbd> | Recargar datos de la página actual |

### 6.2 Atajos por Módulo

| Módulo | Atajo | Acción |
|--------|-------|--------|
| Dashboard | <kbd>G</kbd> + <kbd>D</kbd> | Ir al Dashboard |
| Activos | <kbd>G</kbd> + <kbd>A</kbd> | Ir a lista de activos |
| Mantenimiento | <kbd>G</kbd> + <kbd>M</kbd> | Ir a órdenes de mantenimiento |
| Tickets | <kbd>G</kbd> + <kbd>T</kbd> | Ir a mesa de ayuda |
| Base de Conocimiento | <kbd>G</kbd> + <kbd>K</kbd> | Ir a Knowledge Base |
| Discovery | <kbd>G</kbd> + <kbd>I</kbd> | Ir a Discovery de red |

### 6.3 Buenas Prácticas

| Práctica | Descripción |
|----------|-------------|
| **Nombres descriptivos** | Use nombres únicos y descriptivos para activos, tickets y órdenes |
| **Adjuntar evidencias** | Siempre adjunte fotos o documentos al completar mantenimientos y tickets |
| **Cerrar tickets resueltos** | No deje tickets en estado "Resuelto" sin cerrarlos después de verificación |
| **Checklists completos** | Complete todos los ítems del checklist antes de cerrar una orden |
| **Categorizar correctamente** | Asigne la categoría y ubicación correcta a cada activo para mantener la integridad del inventario |
| **Mantener información actualizada** | Actualice la hoja de vida del activo cuando ocurran cambios significativos (cambio de ubicación, estado, etc.) |
| **Usar etiquetas (tags)** | Aproveche las etiquetas para filtros rápidos y reportes personalizados |
| **Respaldos regulares** | Realice respaldos periódicos de la base de datos MySQL |

---

## 7. Tutoriales Paso a Paso

> Esta sección contiene guías detalladas con capturas de pantalla reales del sistema para realizar las tareas más comunes en TecMan.

---

### 7.1 Escanear un Código QR y Solicitar Soporte

**Objetivo:** Como usuario final, reportar un problema con un activo escaneando su código QR.

**Tiempo estimado:** 2 minutos

**Paso 1 — Escanear el código QR**

Localice el código QR pegado en el activo físico (laptop, monitor, impresora, etc.) y escanéelo con la cámara de su celular o dispositivo móvil. El QR lo llevará automáticamente a la ficha pública del activo.

![Vista pública QR - Ficha del activo desde escaneo](screenshots/vista-publica-qr.png)
*Figura 7.1: Vista pública del activo accesible desde el código QR, sin necesidad de autenticación*

**Paso 2 — Revisar la información del activo**

En la ficha pública podrá ver:
- Nombre y código del activo
- Categoría y ubicación
- Marca, modelo y número de serie
- Estado actual del equipo

**Paso 3 — Reportar un problema**

En la ficha del activo, haga clic en el botón **"Reportar problema"** o **"Solicitar soporte"**. Esto lo redirigirá al portal de soporte.

**Paso 4 — Completar el formulario de ticket**

Complete los campos del formulario:
- **Título:** Describa brevemente el problema (ej: "Pantalla parpadea")
- **Descripción:** Explique el problema con detalle, cuándo ocurre y desde cuándo
- **Prioridad:** Seleccione la gravedad (Baja, Media, Alta, Crítica)

![Tickets - Portal público de soporte](screenshots/tickets-portal-publico.png)
*Figura 7.2: Portal público de soporte para crear tickets sin autenticación*

**Paso 5 — Confirmar y rastrear**

Al enviar el formulario, recibirá un código de ticket (ej: `TKT-0001`). Guarde este código para rastrear el estado de su solicitud desde el mismo portal público.

> **💡 Consejo:** Si tiene acceso al dashboard, puede ver el detalle completo de su ticket en `/dashboard/tickets`, incluyendo las respuestas del equipo de soporte.

---

### 7.2 Crear un Activo Nuevo (Inventario)

**Objetivo:** Como administrador o supervisor, registrar un nuevo activo en el sistema.

**Tiempo estimado:** 5 minutos

**Paso 1 — Ir a la lista de activos**

Desde la barra lateral, haga clic en **Activos** o use el atajo <kbd>G</kbd> + <kbd>A</kbd>.

![Activos - Lista paginada con datos reales](screenshots/activos-lista.png)
*Figura 7.3: Lista de activos mostrando los equipos registrados en el sistema*

**Paso 2 — Iniciar creación**

Haga clic en el botón **"Nuevo Activo"** o **"Crear"** (usualmente en la esquina superior derecha de la tabla).

**Paso 3 — Completar datos generales**

![Activos - Formulario de creación](screenshots/activos-crear.png)
*Figura 7.4: Formulario de creación con campos generales del activo*

Complete los campos obligatorios:
- **Nombre:** Nombre descriptivo del equipo (ej: "Laptop HP EliteBook 840 G10")
- **Código:** El sistema genera uno automáticamente, puede personalizarlo (ej: "EQ-001")
- **Categoría:** Seleccione la categoría correspondiente (Tecnológico, Biomédico, etc.)
- **Ubicación:** Seleccione dónde se encuentra físicamente el activo

**Paso 4 — Completar datos complementarios**

Opcionales pero recomendados:
- **Marca:** Fabricante del equipo (HP, Dell, Cisco, etc.)
- **Modelo:** Modelo específico
- **Número de serie:** Serial del fabricante
- **Estado:** ACTIVE (activo), MAINTENANCE (en mantenimiento), etc.
- **Fecha de adquisición:** Cuándo se compró
- **Costo de adquisición:** Valor de compra
- **Vida útil estimada:** En meses (para cálculo de depreciación)
- **Proveedor:** Opcional, datos del vendedor

**Paso 5 — Guardar**

Haga clic en **"Guardar"** o **"Crear Activo"**. El sistema:
1. Crea el activo con un código QR único
2. Genera la hoja de vida con el evento "Activo registrado en el sistema"
3. Muestra el activo en la lista principal

![Activos - Detalle con hoja de vida](screenshots/activos-detalle.png)
*Figura 7.5: Ficha completa del activo con información general y línea de tiempo*

> **💡 Consejo:** Use la función **Importar XLSX** si necesita registrar muchos activos a la vez. Prepare un archivo Excel con las columnas: código, nombre, categoría, ubicación, marca, modelo, serial.

---

### 7.3 Programar un Mantenimiento

**Objetivo:** Como técnico o supervisor, crear una orden de mantenimiento para un activo.

**Tiempo estimado:** 4 minutos

**Paso 1 — Ir a Mantenimiento**

Desde la barra lateral, haga clic en **Mantenimiento** o use <kbd>G</kbd> + <kbd>M</kbd>.

**Paso 2 — Crear nueva orden**

Haga clic en **"Nuevo Mantenimiento"** o **"Crear Orden"**.

**Paso 3 — Seleccionar tipo de mantenimiento**

![Mantenimiento - Lista de órdenes](screenshots/mantenimiento-lista.png)
*Figura 7.6: Lista de órdenes de mantenimiento con los registros creados*

Elija el tipo:
- **PREVENTIVE:** Mantenimiento programado (revisiones periódicas)
- **CORRECTIVE:** Reparación por falla o avería
- **PREDICTIVE:** Basado en análisis de condiciones

**Paso 4 — Completar el formulario**

- **Activo:** Busque y seleccione el activo a intervenir
- **Título / Descripción:** Detalle el trabajo a realizar
- **Prioridad:** LOW, MEDIUM, HIGH o CRITICAL
- **Técnico asignado:** Seleccione quién ejecutará la orden
- **Fecha programada:** Cuándo debe realizarse
- **Checklist:** Opcional, seleccione una plantilla de inspección

**Paso 5 — Guardar y gestionar**

Una vez creada la orden:
1. El técnico asignado la verá en **"Mis Órdenes"**
2. Puede cambiar el estado de PENDING → SCHEDULED → IN_PROGRESS → COMPLETED
3. Al completar, registre diagnóstico, solución, costo y suba evidencias (fotos, documentos)

![Mantenimiento - Detalle de orden](screenshots/mantenimiento-detalle.png)
*Figura 7.7: Detalle de orden de mantenimiento con opciones para completar y subir evidencias*

> **💡 Consejo:** Asocie un **checklist** a la orden de mantenimiento para estandarizar las inspecciones. Los checklists soportan 12 tipos de campo (texto, número, foto, firma, etc.).

---

### 7.4 Crear y Gestionar un Ticket de Soporte

**Objetivo:** Como técnico, recibir, gestionar y resolver un ticket de soporte.

**Tiempo estimado:** 5 minutos

**Paso 1 — Ver tickets asignados**

Desde la barra lateral, vaya a **Tickets** o use <kbd>G</kbd> + <kbd>T</kbd>. Los tickets asignados a usted aparecen automáticamente filtrados.

![Tickets - Lista de mesa de ayuda](screenshots/tickets-lista.png)
*Figura 7.8: Lista de tickets con filtros por estado, prioridad y asignación*

**Paso 2 — Revisar detalle del ticket**

Haga clic en un ticket para ver:
- **Información general:** Código, título, descripción, estado, prioridad
- **Asignación:** A quién está asignado y quién lo reportó
- **Activo relacionado:** Si el ticket está vinculado a un activo
- **Mensajes:** Hilo completo de comunicación con el solicitante

**Paso 3 — Responder al solicitante**

En la sección de mensajes, escriba su respuesta y haga clic en **"Enviar"**. El sistema notificará al usuario por email.

**Paso 4 — Actualizar estado**

A medida que avanza en la resolución, actualice el estado:
- **OPEN** → **IN_PROGRESS** (cuando empiece a trabajar)
- **IN_PROGRESS** → **WAITING_ON_USER** (si necesita información adicional)
- **IN_PROGRESS** → **RESOLVED** (cuando haya solucionado)
- **RESOLVED** → **CLOSED** (después de verificación del usuario)

**Paso 5 — Escalar si es necesario**

Si no puede resolver el ticket, use la opción **"Escalar"** para derivarlo a un nivel superior de soporte, agregando un comentario con el motivo.

> **💡 Consejo:** Vincule el ticket al activo correspondiente para que quede registro en la hoja de vida del equipo. Use el escáner QR para identificar rápidamente el activo.

---

### 7.5 Asignar un Activo a un Usuario (Custodia)

**Objetivo:** Como administrador, registrar la entrega de un activo a un empleado.

**Tiempo estimado:** 3 minutos

**Paso 1 — Ir a Asignaciones**

Desde la barra lateral, haga clic en **Asignaciones** (Custodias).

**Paso 2 — Asignar activo**

Haga clic en **"Asignar Activo"** o **"Nueva Custodia"**.

![Asignaciones - Custodias](screenshots/asignaciones.png)
*Figura 7.9: Lista de custodias mostrando asignaciones activas e históricas*

**Paso 3 — Seleccionar activo y usuario**

- **Activo:** Busque el activo a entregar (ej: "Laptop HP EliteBook 840 G10")
- **Usuario:** Seleccione el empleado que recibe el equipo
- **Notas:** Opcional, agregue comentarios (ej: "Entregado para teletrabajo")

**Paso 4 — Confirmar asignación**

Haga clic en **"Asignar"**. El sistema:
1. Registra la custodia con fecha y hora actual
2. Si el activo tenía una custodia anterior activa, la cierra automáticamente
3. Agrega un evento en la hoja de vida del activo

**Paso 5 — Registrar devolución (cuando corresponda)**

Cuando el empleado devuelva el equipo:
1. Busque la custodia activa en la lista
2. Haga clic en **"Registrar Devolución"**
3. Agregue notas sobre el estado de devolución
4. El sistema registra la fecha y hora de devolución

> **💡 Consejo:** Revise periódicamente las custodias activas para mantener actualizado el registro de quién tiene cada activo. Esto es especialmente útil para inventarios y auditorías.

---

### 7.6 Ver el Dashboard y KPIs

**Objetivo:** Como cualquier usuario autenticado, obtener una visión general del estado del sistema.

**Tiempo estimado:** 1 minuto

**Paso 1 — Acceder al Dashboard**

Al iniciar sesión, llegará automáticamente al Dashboard (`/dashboard`). También puede usar <kbd>G</kbd> + <kbd>D</kbd>.

![Dashboard - Vista principal](screenshots/dashboard.png)
*Figura 7.10: Dashboard principal con KPIs, gráficas y actividad reciente*

**Paso 2 — Interpretar los KPIs**

Las tarjetas superiores muestran:
- **Total Activos:** Cantidad de equipos registrados
- **Mantenimientos Activos:** Órdenes en progreso o programadas
- **Tickets Abiertos:** Solicitudes de soporte pendientes
- **Alertas Activas:** Notificaciones de garantías próximas a vencer

**Paso 3 — Revisar gráficas**

Los gráficos muestran distribución de:
- Activos por estado (ACTIVE, MAINTENANCE, INACTIVE, etc.)
- Mantenimientos por tipo (PREVENTIVE, CORRECTIVE, PREDICTIVE)
- Tickets por estado (OPEN, IN_PROGRESS, RESOLVED, etc.)

**Paso 4 — Actividad reciente**

La lista de actividad reciente muestra las últimas acciones realizadas en el sistema, útil para rastrear cambios y novedades.

---

### 7.7 Generar Reportes y Exportar Datos

**Objetivo:** Como supervisor o administrador, exportar datos del sistema para análisis o respaldo.

**Tiempo estimado:** 2 minutos

**Exportar activos a Excel:**

1. Vaya a **Activos** → Haga clic en **"Exportar"** o **"Descargar Excel"**
2. El sistema genera un archivo XLSX con todos los activos
3. El archivo incluye: código, nombre, categoría, ubicación, marca, modelo, serial, estado, fechas, costos

**Exportar mantenimientos a Excel:**

1. Vaya a **Mantenimiento** → Haga clic en **"Exportar"**
2. Obtendrá un reporte con todas las órdenes, incluyendo técnico, tipo, estado, fechas y costos

**Exportar tickets a Excel:**

1. Vaya a **Tickets** → Haga clic en **"Exportar"**
2. El reporte incluye código, título, estado, prioridad, asignado, fechas y cumplimiento SLA

**Exportar hoja de vida de un activo a PDF:**

1. Vaya al **detalle del activo**
2. Haga clic en **"Hoja de Vida PDF"** o **"Descargar PDF"**
3. El PDF incluye: datos generales, línea de tiempo de eventos, mantenimientos y tickets asociados

> **💡 Consejo:** Use la función **Importar XLSX** en Activos para cargar inventarios completos desde hojas de cálculo existentes. Prepare el archivo con las columnas en español: código, nombre, categoría, ubicación, marca, modelo, serial.

---

### 7.8 Configurar Notificaciones de Telegram

**Objetivo:** Como administrador, configurar Telegram para recibir notificaciones de tickets.

**Tiempo estimado:** 5 minutos

**Paso 1 — Crear un bot en Telegram**

1. Abra Telegram y busque **@BotFather**
2. Envíe el comando `/newbot` y siga las instrucciones
3. Guarde el **token** que le proporciona BotFather (ej: `7234567890:AAHdqTcvCH1vGWJxfSe`)

**Paso 2 — Obtener el Chat ID del grupo**

1. Cree un grupo en Telegram y agregue su bot como miembro
2. Envíe un mensaje al grupo
3. Visite: `https://api.telegram.org/bot<SU_TOKEN>/getUpdates`
4. Busque el campo `chat.id` en la respuesta JSON

**Paso 3 — Configurar en TecMan**

Vaya a **Configuración del Sistema** (`/dashboard/tenant`) e ingrese:
- **Token de Telegram:** El token de BotFather
- **Chat ID:** El ID del grupo
- Active **"Notificaciones Telegram habilitadas"**

![Tenant - Configuración del sistema](screenshots/configuracion-tenant.png)
*Figura 7.11: Pantalla de configuración del sistema con opciones de Telegram*

**Paso 4 — Probar**

Cree un ticket de prueba. Debería recibir una notificación en el grupo de Telegram con el código, título y categoría del ticket.

---

### Resumen de Acciones Rápidas

| Tarea | Pasos | Atajo |
|-------|-------|-------|
| Escanear QR y reportar problema | Escanear QR → Ver ficha → Clic "Reportar problema" → Describir → Enviar | — |
| Crear activo | Activos → Nuevo → Completar datos → Guardar | <kbd>G</kbd> + <kbd>A</kbd> → <kbd>Ctrl</kbd> + <kbd>N</kbd> |
| Programar mantenimiento | Mantenimiento → Nueva Orden → Seleccionar activo/tipo → Asignar técnico → Guardar | <kbd>G</kbd> + <kbd>M</kbd> |
| Crear ticket de soporte | Tickets → Nuevo Ticket → Describir problema → Seleccionar activo → Enviar | <kbd>G</kbd> + <kbd>T</kbd> |
| Asignar activo a usuario | Asignaciones → Asignar → Seleccionar activo/usuario → Confirmar | — |
| Exportar inventario | Activos → Exportar → Descargar Excel | — |
| Ver Dashboard | Dashboard (inicio) o atajo rápido | <kbd>G</kbd> + <kbd>D</kbd> |
