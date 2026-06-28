# TecMan Discovery Agent - Node.js

Agente de descubrimiento de hardware migrado de PowerShell/Go a Node.js.

## Ventajas sobre .bat/.ps1

| Aspecto | .bat/.ps1 | Node.js |
|---------|-----------|---------|
| Detección antivirus | Alta | Baja |
| SmartScreen | Bloquea frecuentemente | Menos problemas |
| Mantenimiento | Scripts sueltos | Código estructurado |
| Distribución | Requiere execution policy | Ejecutable standalone |

## Instalación

```bash
cd agent/node-agent
npm install
```

## Uso

```bash
# Ejecutar una vez
node index.js --server http://192.168.1.100:3001 --once

# Instalar como servicio PM2
node index.js --server http://192.168.1.100:3001 --install

# Modo continuo (cada hora)
node index.js --server http://192.168.1.100:3001 --interval 1
```

## Compilar a ejecutable

```bash
npm run build
# Genera: dist-agent/tecman-discovery.exe
```

## Fix Scripts Builder

Genera ejecutables desde scripts .bat:

```bash
npm run build:fix
# Genera: dist-fixes/*.exe
```

## Estructura

```
node-agent/
├── index.js          # Agente principal
├── fix-builder.js    # Constructor de fixes
├── build.js          # Script de compilación
├── package.json      # Dependencias
└── README.md         # Documentación
```
