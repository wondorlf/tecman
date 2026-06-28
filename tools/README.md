# EGAN TECH Tools

Herramientas de mantenimiento y despliegue migradas de `.bat`/`.ps1` a **Node.js + child-shell + nexe**.

## Migración

| Script Original | Nuevo (Node.js) | Descripción |
|----------------|-----------------|-------------|
| `actualizar-github.bat` | `git-sync` | Sincronizar con GitHub |
| `descargar-github.bat` | `git-clone` | Descargar/Clonar proyecto |
| `deploy.ps1` | `deploy` | Despliegue completo |
| `Mantenimiento-Windows.bat` | `maintenance` | Mantenimiento Windows |

## Instalación

```bash
cd tools
npm install
```

## Uso (desarrollo)

```bash
# Ejecutar directamente
node index.js

# O con npm
npm start
```

## Compilar a ejecutable

```bash
# Instalar nexe globalmente (opcional)
npm install -g nexe

# Compilar
npm run build

# El ejecutable se genera en: dist/egan-tools.exe
```

## Uso del ejecutable

```bash
# Copiar egan-tools.exe a la carpeta del proyecto
# Ejecutar
egan-tools.exe
```

## Ventajas sobre .bat/.ps1

| Aspecto | .bat/.ps1 | Node.js + child-shell |
|---------|-----------|----------------------|
| Detección antivirus | Alta (falsos positivos) | Baja |
| SmartScreen | Bloquea frecuentemente | Menos problemas |
| Mantenimiento | Scripts sueltos | Código estructurado |
| Distribución | Requiere execution policy | Ejecutable standalone |
| UI | Limitada | Consola interactiva |

## Dependencias

- **child-shell**: Bindings de Node.js para PowerShell
- **chalk**: Colores en consola
- **inquirer**: Menús interactivos
- **nexe**: Compilación a ejecutable

## Estructura

```
tools/
├── index.js          # Punto de entrada principal
├── build.js          # Script de compilación
├── package.json      # Dependencias
└── README.md         # Esta documentación
```
