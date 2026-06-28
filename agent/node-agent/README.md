# TecMan Discovery Agent - Node.js

Agente de descubrimiento de hardware migrado de PowerShell/Go a Node.js.
Menor detección antivirus que scripts .bat/.ps1 tradicionales.

---

## Requisitos

- **Node.js** >= 18 ([descargar](https://nodejs.org/))
- **npm** (viene con Node.js)
- Windows 10/11

---

## Instalación

```bash
cd agent/node-agent
npm install
```

---

## Uso

### Ejecutar una vez (reporte instantáneo)

```bash
node index.js --server http://192.168.1.100:3001 --once
```

### Instalar como servicio PM2

```bash
node index.js --server http://192.168.1.100:3001 --install
```

### Modo continuo (cada hora)

```bash
node index.js --server http://192.168.1.100:3001 --interval 1
```

### Con API Key

```bash
node index.js --server http://192.168.1.100:3001 --api-key "tu-api-key" --install
```

### Desinstalar servicio

```bash
node index.js --uninstall
```

---

## Compilar a ejecutable (.exe)

Para generar un `.exe` standalone sin necesidad de Node.js:

```bash
npm run build
```

El ejecutable se genera en `../dist-agent/tecman-discovery.exe`.

Uso del ejecutable:
```bash
tecman-discovery.exe --server 192.168.1.100:3001 --install
tecman-discovery.exe --host servidor.local --once
tecman-discovery.exe --uninstall
```

---

## Generar Fix Scripts (.js)

Convierte los scripts `.bat` de `agent/fix-scripts/` a ejecutables Node.js:

```bash
npm run build:fix
```

Los scripts se generan en `../dist-fixes/`.

---

## Opciones CLI

| Opción | Alias | Descripción |
|--------|-------|-------------|
| `--server` | `-s` | URL del servidor (ej: http://192.168.1.100:3001) |
| `--host` | | Alias de --server |
| `--api-key` | `-k` | API Key para autenticación |
| `--install` | `-i` | Instalar como servicio PM2 |
| `--uninstall` | | Desinstalar servicio |
| `--once` | | Ejecutar una sola vez |
| `--interval` | | Intervalo en horas para modo continuo |
| `--help` | `-h` | Mostrar ayuda |

---

## Ejemplos

```bash
# Instalar agente con API key
node index.js -s http://tecmanserver:3001 -k "abc123" -i

# Ejecutar una vez sin instalar
node index.js --host 192.168.1.50:3001 --once

# Ver logs si está como servicio
pm2 logs tecman-discovery

# Detener servicio
pm2 stop tecman-discovery

# Reiniciar servicio
pm2 restart tecman-discovery
```

---

## Estructura

```
node-agent/
├── index.js          # Agente principal
├── fix-builder.js    # Constructor de fix scripts
├── build.js          # Compilador a .exe
├── package.json      # Dependencias
└── README.md         # Esta documentación
```

---

## Solución de problemas

**Error: Node.js no encontrado**
```bash
# Verificar instalación
node --version

# Si no existe, instalar desde https://nodejs.org/
```

**Error: PM2 no encontrado**
```bash
npm install -g pm2
```

**Error de conexión al servidor**
```bash
# Verificar que el servidor esté accesible
curl http://192.168.1.100:3001/api/health
```

**El agente no envía datos**
```bash
# Verificar configuración
cat tecman-discovery-config.json

# Ver logs de PM2
pm2 logs tecman-discovery --lines 50
```
