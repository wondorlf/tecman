# Guía de Implementación — TecMan CMMS/ITAM (Versión Unificada)

Esta guía detalla los pasos necesarios para instalar, configurar y desplegar el sistema **TecMan** como una aplicación única y simplificada.

---

## 1. Arquitectura Unificada

El sistema ha sido simplificado para:
- Utilizar **un solo archivo `.env`** en la raíz del proyecto.
- Correr en un **único proceso y puerto** (el Backend sirve al Frontend).
- Facilitar el mantenimiento y despliegue.

---

## 2. Requisitos Previos

- **Node.js**: Versión 18 o superior.
- **npm**: Gestor de paquetes.
- **MySQL**: Versión 8.0+.

---

## 3. Instalación

1.  Instale las dependencias de todo el proyecto:
    ```bash
    npm install
    cd backend && npm install
    cd ../frontend && npm install
    ```

---

## 4. Configuración del Entorno

Utilice el archivo `.env` ubicado en la **raíz** del proyecto. No es necesario configurar archivos `.env` dentro de las carpetas `backend` o `frontend`.

```env
PORT=3001
DATABASE_URL="mysql://usuario:password@localhost:3306/tecman_db"
JWT_SECRET="su_secreto"
NEXT_PUBLIC_API_URL=  # Vacío para usar el mismo puerto
```

---

## 5. Base de Datos y Preparación

Desde la raíz:
```bash
# Generar cliente y tablas
npm run db:generate
npm run db:migrate
# Poblar datos iniciales
npm run db:seed
```

---

## 6. Ejecución y Despliegue

### Desarrollo
Para ejecutar ambos en modo desarrollo (con hot-reload):
```bash
npm run dev
```

### Producción (Aplicación Única)
1.  **Construir la aplicación:**
    ```bash
    npm run build
    ```
    *Esto generará los archivos estáticos del frontend en `frontend/out` y compilará el backend.*

2.  **Iniciar el servidor unificado:**
    ```bash
    npm run start
    ```
    La aplicación estará disponible en `http://localhost:3001` (o el puerto configurado).

### Despliegue con PM2
```bash
npm run pm2:start
```

---

## 7. Mantenimiento

- **Actualización:** Después de cualquier cambio en el código, ejecute `npm run build`.
- **Logs:** Use `npm run pm2:logs`.
- **Limpieza:** El sistema ahora es más limpio al no tener configuraciones duplicadas.
