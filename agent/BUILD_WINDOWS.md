# TecMan Discovery Agent — Compilación para Windows

El agente de discovery está escrito en Go y puede compilarse como un servicio de Windows.

## Requisitos

- **Go 1.21+** instalado ([descargar](https://go.dev/dl/))
- Acceso a Internet para descargar dependencias

## Compilación Cruzada (Cross-compile)

Desde cualquier sistema (Linux, macOS, Windows), ejecuta:

```powershell
# Compilar para Windows 64-bit
cd agent
go mod tidy
$env:GOOS="windows"
$env:GOARCH="amd64"
go build -o tecman-agent.exe main.go
```

O en Linux/macOS:
```bash
cd agent
GOOS=windows GOARCH=amd64 go build -o tecman-agent.exe main.go
```

## Instalación como Servicio de Windows

1. **Compila** `tecman-agent.exe` con el comando anterior

2. **Copia** los archivos al equipo destino:
   - `tecman-agent.exe`
   
3. **Abre PowerShell como Administrador** y ejecuta:
   ```powershell
   .\tecman-agent.exe -install -server http://192.168.1.100:3001
   ```
   Reemplaza la URL con la dirección de tu servidor TecMan.

4. **Inicia el servicio:**
   ```powershell
   .\tecman-agent.exe -start
   ```

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `-install -server <URL>` | Instala el servicio de Windows |
| `-uninstall` | Desinstala el servicio |
| `-start` | Inicia el servicio |
| `-stop` | Detiene el servicio |

## Alternativa: Script PowerShell

Si prefieres no compilar el agente Go, usa el script PowerShell:

```powershell
# Una sola ejecución
.\tecman-discovery.ps1 -ServerUrl "http://192.168.1.100:3001"

# Instalar como tarea programada (se ejecuta cada hora)
.\tecman-discovery.ps1 -ServerUrl "http://192.168.1.100:3001" -InstallTask

# Desinstalar tarea programada
.\tecman-discovery.ps1 -UninstallTask
```

## Verificación

El agente envía la siguiente información al servidor TecMan:

- Hostname
- Dirección MAC (única para identificar el equipo)
- Dirección IP
- Sistema Operativo (versión completa)
- Modelo y núcleos de CPU
- RAM total
- Espacio total y usado del disco C:

Revisa los dispositivos descubiertos en:
`http://localhost:3001/dashboard/discovery`
