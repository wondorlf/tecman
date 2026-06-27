@echo off
title TecMan Fix - Outlook No Funciona (Completo)
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Solucion completa de Outlook               ║
echo  ║  No envia, no recibe, se traba o muestra errores     ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script realizara las siguientes acciones:
echo.
echo    1. Cerrar Outlook y procesos relacionados
echo    2. Limpiar cache y archivos temporales de Outlook
echo    3. Reparar conexion de red (DNS, IP)
echo    4. Reiniciar servicios de red
echo    5. Reabrir Outlook
echo.
echo  IMPORTANTE: Guarda correos en borrador antes de continuar.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  EJECUTANDO SOLUCION COMPLETA...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/5] Cerrando Outlook y procesos relacionados...
taskkill /f /im outlook.exe >nul 2>&1
taskkill /f /im msedge.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo      [OK] Procesos cerrados
echo.
echo [2/5] Limpiando cache y temporales de Outlook...
del /q /f /s "%LOCALAPPDATA%\Microsoft\Outlook\*.log" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Outlook\Offline Cache\*" >nul 2>&1
del /q /f /s "%TEMP%\outlook*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Outlook\*.ost" >nul 2>&1
echo      [OK] Temporales de Outlook limpiados
echo.
echo [3/5] Reparando conexion de red...
ipconfig /flushdns >nul 2>&1
ipconfig /release >nul 2>&1
ipconfig /renew >nul 2>&1
echo      [OK] Red reparada
echo.
echo [4/5] Reiniciando servicios de red...
netsh winsock reset >nul 2>&1
netsh int ip reset >nul 2>&1
echo      [OK] Servicios reiniciados
echo.
echo [5/5] Reabrir Outlook...
start outlook.exe >nul 2>&1
echo      [OK] Outlook abierto
echo.
echo ─────────────────────────────────────────────────────────
echo  SOLUCION COMPLETADA
echo.
echo  Verifica que Outlook este recibiendo correos.
echo  Si persiste, puede ser un problema de configuracion
echo  del servidor de correo. Contacta al administrador.
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
timeout /t 1 >nul
exit
