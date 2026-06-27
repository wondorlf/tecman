@echo off
title TecMan Fix - Soporte Remoto (AnyDesk)
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Instalar soporte remoto                   ║
echo  ║  AnyDesk para asistencia remota                     ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script realizara las siguientes acciones:
echo.
echo    1. Descargar AnyDesk desde el sitio oficial
echo    2. Instalar AnyDesk de forma automatica
echo    3. Mostrar el codigo de acceso
echo.
echo  IMPORTANTE: Comparte el codigo de acceso con el
echo  equipo de soporte para recibir asistencia remota.
echo.
echo  NOTA: Se requieren permisos de Administrador.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  EJECUTANDO INSTALACION...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/3] Verificando si AnyDesk ya esta instalado...
if exist "C:\Program Files (x86)\AnyDesk\AnyDesk.exe" (
    echo      [INFO] AnyDesk ya esta instalado. Abriendo...
    start "" "C:\Program Files (x86)\AnyDesk\AnyDesk.exe"
    goto :show_id
)
if exist "C:\Program Files\AnyDesk\AnyDesk.exe" (
    echo      [INFO] AnyDesk ya esta instalado. Abriendo...
    start "" "C:\Program Files\AnyDesk\AnyDesk.exe"
    goto :show_id
)
echo      [INFO] AnyDesk no encontrado. Descargando...
echo.
echo [2/3] Descargando AnyDesk...
powershell -Command "(New-Object System.Net.WebClient).DownloadFile('https://download.anydesk.com/AnyDesk.exe', '%TEMP%\AnyDesk.exe')"
if not exist "%TEMP%\AnyDesk.exe" (
    echo      [ERROR] No se pudo descargar AnyDesk.
    echo      Descarga manualmente desde: https://anydesk.com
    goto :end
)
echo      [OK] AnyDesk descargado
echo.
echo [3/3] Instalando AnyDesk...
"%TEMP%\AnyDesk.exe" --install "C:\Program Files\AnyDesk" --start-with-win --silent >nul 2>&1
timeout /t 5 /nobreak >nul
start "" "C:\Program Files\AnyDesk\AnyDesk.exe" >nul 2>&1
echo      [OK] AnyDesk instalado e iniciado
echo.
:show_id
timeout /t 3 /nobreak >nul
echo ─────────────────────────────────────────────────────────
echo  INSTALACION COMPLETADA
echo.
echo  AnyDesk esta abierto. Busca el "Codigo de acceso"
echo  en la ventana de AnyDesk y compartelo con soporte.
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
:end
timeout /t 1 >nul
exit
