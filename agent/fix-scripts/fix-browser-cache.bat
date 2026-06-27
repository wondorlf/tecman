@echo off
title TecMan Fix - Limpiar Cache del Navegador
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Limpiar cache del navegador               ║
echo  ║  Chrome, Edge y Firefox                             ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script realizara las siguientes acciones:
echo.
echo    1. Cerrar navegadores abiertos
echo    2. Limpiar cache de Google Chrome
echo    3. Limpiar cache de Microsoft Edge
echo    4. Limpiar cache de Mozilla Firefox
echo.
echo  NOTA: Se cerraran las ventanas del navegador.
echo  Guarda tu trabajo antes de continuar.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  EJECUTANDO LIMPIEZA...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/4] Cerrando navegadores...
taskkill /f /im chrome.exe >nul 2>&1
taskkill /f /im msedge.exe >nul 2>&1
taskkill /f /im firefox.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo      [OK] Navegadores cerrados
echo.
echo [2/4] Limpiando cache de Chrome...
del /q /f /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Code Cache\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Service Worker\CacheStorage\*" >nul 2>&1
echo      [OK] Cache de Chrome limpiado
echo.
echo [3/4] Limpiando cache de Edge...
del /q /f /s "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Code Cache\*" >nul 2>&1
echo      [OK] Cache de Edge limpiado
echo.
echo [4/4] Limpiando cache de Firefox...
del /q /f /s "%LOCALAPPDATA%\Mozilla\Firefox\Profiles\*.default*\cache2\*" >nul 2>&1
echo      [OK] Cache de Firefox limpiado
echo.
echo ─────────────────────────────────────────────────────────
echo  LIMPIEZA COMPLETADA
echo  Abre tu navegador nuevamente.
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
timeout /t 1 >nul
exit
