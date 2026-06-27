@echo off
title TecMan Discovery Agent - Instalacion Manual
cd /d "%~dp0"

:: ── Verificar Admin ──────────────────────────────────────────────────────────
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Solicitando permisos de administrador...
    powershell -Command "Start-Process cmd -ArgumentList '/c ""%~f0""' -Verb RunAs"
    exit /b
)

:: ── Banner ──────────────────────────────────────────────────────────────────
cls
echo.
echo  ============================================
echo     TecMan Discovery Agent
echo     Instalacion Manual con Observacion
echo  ============================================
echo.

:: ── Server URL (reemplazado automaticamente por el servidor) ─────────────────
set "SERVER_URL=SERVER_PLACEHOLDER"
set "API_KEY=API_KEY_PLACEHOLDER"

echo [INFO] Servidor detectado: %SERVER_URL%
echo.

:: Validar que la URL no sea el placeholder
if "%SERVER_URL%"=="SERVER_PLACEHOLDER" (
    echo [ERROR] URL del servidor no configurada.
    echo El instalador debe descargarse desde el servidor TecMan.
    echo.
    pause
    exit /b 1
)

:: ── Solicitar observacion (ubicacion del equipo) ─────────────────────────────
echo ──────────────────────────────────────────────────────────────
echo  INFORMACION DE UBICACION
echo ──────────────────────────────────────────────────────────────
echo.
echo  Por favor ingresa la ubicacion o descripcion del equipo.
echo  Esta informacion se guardara como etiqueta para identificar
echo  el equipo en el sistema de inventario.
echo.
echo  Ejemplos:
echo    - Piso 3, Oficina 301
echo    - Laboratorio de Computo A
echo    - Sala de Servidores Principal
echo    - Recepcion, Escritorio 5
echo.
set /p OBSERVACION="Ubicacion/Descripcion: "

if "%OBSERVACION%"=="" (
    set "OBSERVACION=Sin especificar"
)

echo.
echo [INFO] Ubicacion registrada: %OBSERVACION%
echo.

:: ── Confirmar instalacion ────────────────────────────────────────────────────
echo ──────────────────────────────────────────────────────────────
echo  CONFIRMACION
echo ──────────────────────────────────────────────────────────────
echo.
echo  Servidor:    %SERVER_URL%
echo  Ubicacion:   %OBSERVACION%
echo.
set /p CONFIRMAR="¿Deseas continuar con la instalacion? (S/N): "

if /i not "%CONFIRMAR%"=="S" (
    echo.
    echo [INFO] Instalacion cancelada por el usuario.
    pause
    exit /b 0
)

echo.
echo ──────────────────────────────────────────────────────────────
echo  INSTALANDO AGENTE
echo ──────────────────────────────────────────────────────────────
echo.

:: ── Instalar como tarea programada ──────────────────────────────────────────
echo [1/4] Configurando agente con ubicacion: %OBSERVACION%
echo.

:: Crear archivo de configuracion con la observacion
echo { > "%~dp0tecman-discovery-config.json"
echo   "ServerUrl": "%SERVER_URL%", >> "%~dp0tecman-discovery-config.json"
echo   "ApiKey": "%API_KEY%", >> "%~dp0tecman-discovery-config.json"
echo   "Observation": "%OBSERVACION%" >> "%~dp0tecman-discovery-config.json"
echo } >> "%~dp0tecman-discovery-config.json"

echo [2/4] Descargando script de discovery...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$url = '%SERVER_URL%/api/agents/powershell/run?apiKey=%API_KEY%';" ^
  "try { $script = (New-Object System.Net.WebClient).DownloadString($url); Set-Content -Path '%~dp0tecman-discovery.ps1' -Value $script -Encoding UTF8; Write-Host '[OK] Script descargado' -ForegroundColor Green }" ^
  "catch { Write-Host ('[ERROR] ' + $_.Exception.Message) -ForegroundColor Red; exit 1 }"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo descargar el script desde %SERVER_URL%
    pause
    exit /b 1
)

echo [3/4] Instalando tarea programada...
echo.

:: Instalar tarea programada con la observacion
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$taskName = 'TecManDiscoveryAgent';" ^
  "$scriptPath = '%~dp0tecman-discovery.ps1';" ^
  "$serverUrl = '%SERVER_URL%';" ^
  "$apiKey = '%API_KEY%';" ^
  "$observation = '%OBSERVACION%';" ^
  "$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument \"-NoProfile -ExecutionPolicy Bypass -File `\"$scriptPath`\" -ServerUrl `\"$serverUrl`\" -ApiKey `\"$apiKey`\"\";" ^
  "$trigger = New-ScheduledTaskTrigger -AtLogOn;" ^
  "$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest;" ^
  "$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable;" ^
  "try { Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force; Write-Host '[OK] Tarea programada instalada - se ejecuta al iniciar sesion' -ForegroundColor Green }" ^
  "catch { Write-Host ('[ERROR] ' + $_.Exception.Message) -ForegroundColor Red; exit 1 }"

echo [4/4] Ejecutando envio inicial...
echo.

:: Ejecutar una primera vez para enviar los datos
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$url = '%SERVER_URL%/api/agents/powershell/run?apiKey=%API_KEY%';" ^
  "$script = (New-Object System.Net.WebClient).DownloadString($url);" ^
  "Invoke-Expression $script"

echo.
echo ──────────────────────────────────────────────────────────────
echo  INSTALACION COMPLETADA
echo ──────────────────────────────────────────────────────────────
echo.
echo  El agente TecMan Discovery ha sido instalado:
echo.
echo    - Tarea programada: TecManDiscoveryAgent
echo    - Frecuencia: Al iniciar sesion
echo    - Ubicacion: %OBSERVACION%
echo    - Servidor: %SERVER_URL%
echo.
echo  El equipo sera inventorado automaticamente.
echo.
pause
