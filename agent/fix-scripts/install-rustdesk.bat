@echo off
title TecMan Fix - Soporte Remoto (RustDesk)
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Instalar soporte remoto                   ║
echo  ║  RustDesk (alternativa open source)                 ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script realizara las siguientes acciones:
echo.
echo    1. Descargar RustDesk desde el sitio oficial
echo    2. Instalar RustDesk de forma automatica
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
echo [1/3] Verificando si RustDesk ya esta instalado...
if exist "C:\Program Files\RustDesk\rustdesk.exe" (
    echo      [INFO] RustDesk ya esta instalado. Abriendo...
    start "" "C:\Program Files\RustDesk\rustdesk.exe"
    goto :show_id
)
if exist "%LOCALAPPDATA%\Programs\RustDesk\rustdesk.exe" (
    echo      [INFO] RustDesk ya esta instalado. Abriendo...
    start "" "%LOCALAPPDATA%\Programs\RustDesk\rustdesk.exe"
    goto :show_id
)
echo      [INFO] RustDesk no encontrado. Descargando...
echo.
echo [2/3] Descargando RustDesk...
powershell -Command "(New-Object System.Net.WebClient).DownloadFile('https://github.com/rustdesk/rustdesk/releases/download/1.3.7/rustdesk-1.3.7-x86_setup.exe', '%TEMP%\rustdesk-setup.exe')"
if not exist "%TEMP%\rustdesk-setup.exe" (
    echo      [ERROR] No se pudo descargar RustDesk.
    echo      Descarga manualmente desde: https://rustdesk.com
    goto :end
)
echo      [OK] RustDesk descargado
echo.
echo [3/3] Instalando RustDesk...
"%TEMP%\rustdesk-setup.exe" /S >nul 2>&1
timeout /t 8 /nobreak >nul
start "" "C:\Program Files\RustDesk\rustdesk.exe" >nul 2>&1
echo      [OK] RustDesk instalado e iniciado
echo.
:show_id
timeout /t 3 /nobreak >nul
echo ─────────────────────────────────────────────────────────
echo  INSTALACION COMPLETADA
echo.
echo  RustDesk esta abierto. Busca el "ID" y "Contrasena"
echo  en la ventana de RustDesk y compartelos con soporte.
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
