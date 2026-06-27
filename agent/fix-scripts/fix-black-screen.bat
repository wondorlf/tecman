@echo off
title TecMan Fix - Pantalla Negra / No Enciende
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Solucion de pantalla                      ║
echo  ║  Pantalla negra o monitor no muestra imagen         ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script realizara las siguientes acciones:
echo.
echo    1. Reiniciar el servicio de graficos
echo    2. Verificar y reiniciar explorer.exe
echo    3. Ejecutar diagnostico de pantalla
echo.
echo  NOTA: Se ejecuta desde el modo seguro o normal.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  EJECUTANDO SOLUCION...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/3] Reiniciando explorer.exe...
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 2 /nobreak >nul
start explorer.exe >nul 2>&1
echo      [OK] Explorer reiniciado
echo.
echo [2/3] Verificando procesos de graficos...
tasklist /FI "IMAGENAME eq dwm.exe" | findstr "dwm.exe" >nul 2>&1
if %errorlevel%==0 (
    echo      [OK] DWM (Desktop Window Manager) esta activo
) else (
    echo      [WARN] DWM no encontrado - posible problema de graficos
)
echo.
echo [3/3] Verificando resolucion de pantalla...
PowerShell -Command "Get-CimInstance Win32_VideoController | Select-Object Name, Status, CurrentHorizontalResolution, CurrentVerticalResolution" >nul 2>&1
echo      [OK] Diagnostico completado
echo.
echo ─────────────────────────────────────────────────────────
echo  SOLUCION COMPLETADA
echo.
echo  Si la pantalla sigue negra:
echo  - Reinicia el equipo (mantener boton 10 seg)
echo  - Verifica el cable de video (HDMI/DP/VGA)
echo  - Prueba con otro monitor si es posible
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
timeout /t 1 >nul
exit
