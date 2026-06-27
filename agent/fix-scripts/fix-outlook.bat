@echo off
title TecMan Fix - Correo Outlook No Funciona
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Solucion de correo Outlook                ║
echo  ║  Outlook no envia, no recibe o se traba             ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script realizara las siguientes acciones:
echo.
echo    1. Cerrar Outlook completamente
echo    2. Limpiar archivos temporales de Outlook
echo    3. Reiniciar servicios de red
echo    4. Reabrir Outlook
echo.
echo  NOTA: Guarda cualquier correo en borrador antes
echo  de ejecutar este script.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  EJECUTANDO SOLUCION...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/4] Cerrando Outlook...
taskkill /f /im outlook.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo      [OK] Outlook cerrado
echo.
echo [2/4] Limpiando archivos temporales de Outlook...
del /q /f /s "%LOCALAPPDATA%\Microsoft\Outlook\*.log" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Outlook\Offline Cache\*" >nul 2>&1
echo      [OK] Temporales de Outlook limpiados
echo.
echo [3/4] Reiniciando servicios de red...
ipconfig /flushdns >nul 2>&1
echo      [OK] Cache DNS limpiada
echo.
echo [4/4] Reabrir Outlook...
start outlook.exe >nul 2>&1
echo      [OK] Outlook abierto
echo.
echo ─────────────────────────────────────────────────────────
echo  SOLUCION COMPLETADA
echo  Verifica que Outlook este recibiendo correos.
echo  Si persiste, reconectate a la red WiFi o ethernet.
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
timeout /t 1 >nul
exit
