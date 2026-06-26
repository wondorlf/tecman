@echo off
title TecMan Discovery Agent - Instalador Automatico
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
echo     TecMan Discovery Agent - Instalador
echo     Sistema de Gestion de Activos
echo  ============================================
echo.

:: ── Server URL (reemplazado automaticamente por el servidor) ─────────────────
set "SERVER_URL=SERVER_PLACEHOLDER"
set "API_KEY=API_KEY_PLACEHOLDER"
echo.
echo [INFO] Servidor: %SERVER_URL%
echo [INFO] Instalando agente PowerShell...
echo.

:: Validar que la URL no sea el placeholder
if "%SERVER_URL%"=="SERVER_PLACEHOLDER" (
    echo [ERROR] URL del servidor no configurada.
    echo El instalador debe descargarse desde el servidor TecMan.
    echo.
    pause
    exit /b 1
)

:: Descargar y ejecutar el script PS1 con la URL y API Key del servidor
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$url = '%SERVER_URL%/api/agents/powershell/run?apiKey=%API_KEY%';" ^
  "try { $script = (New-Object System.Net.WebClient).DownloadString($url); Write-Host '[OK] Script descargado' -ForegroundColor Green; Invoke-Expression $script }" ^
  "catch { Write-Host ('[ERROR] ' + $_.Exception.Message) -ForegroundColor Red; pause; exit 1 }"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo conectar con %SERVER_URL%
    echo Verifica que el servidor este accesible desde este equipo.
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Instalacion completada.
echo.
pause
