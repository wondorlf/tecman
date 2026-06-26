@echo off
title TecMan Discovery Agent - Ejecucion Automatica
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
echo     Ejecucion Automatica (Unattended)
echo  ============================================
echo.

:: ── Server URL (reemplazado automaticamente por el servidor) ─────────────────
set "SERVER_URL=SERVER_PLACEHOLDER"
set "API_KEY=API_KEY_PLACEHOLDER"

echo [INFO] Servidor detectado: %SERVER_URL%
echo [INFO] Ejecutando agente en modo automatico...
echo.

:: Validar que la URL no sea el placeholder
if "%SERVER_URL%"=="SERVER_PLACEHOLDER" (
    echo [ERROR] URL del servidor no configurada.
    echo El instalador debe descargarse desde el servidor TecMan.
    echo.
    pause
    exit /b 1
)

:: Descargar y ejecutar el script PS1 automaticamente
echo [1/3] Descargando script de discovery...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$url = '%SERVER_URL%/api/agents/powershell/run?apiKey=%API_KEY%';" ^
  "try { $script = (New-Object System.Net.WebClient).DownloadString($url); Write-Host '[OK] Script descargado correctamente' -ForegroundColor Green }" ^
  "catch { Write-Host ('[ERROR] ' + $_.Exception.Message) -ForegroundColor Red; exit 1 }"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo descargar el script desde %SERVER_URL%
    echo Verifica que el servidor este accesible desde este equipo.
    echo.
    pause
    exit /b 1
)

echo [2/3] Ejecutando discovery de hardware...
echo.

:: Ejecutar el script PS1 con parametros configurados
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$url = '%SERVER_URL%/api/agents/powershell/run?apiKey=%API_KEY%';" ^
  "$script = (New-Object System.Net.WebClient).DownloadString($url);" ^
  "Invoke-Expression $script"

echo.
echo [3/3] Proceso completado.
echo.
echo  ============================================
echo     Los datos del hardware han sido enviados
echo     al servidor TecMan correctamente.
echo  ============================================
echo.
pause
