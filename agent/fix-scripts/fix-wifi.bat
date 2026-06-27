@echo off
title TecMan Fix - WiFi No Conecta
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Solucion de WiFi                          ║
echo  ║  WiFi no conecta o se desconecta constantemente     ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script realizara las siguientes acciones:
echo.
echo    1. Desactivar adaptador de WiFi
echo    2. Limpiar configuraciones de red
echo    3. Reactivar adaptador de WiFi
echo    4. Renovar IP
echo.
echo  NOTA: Se requieren permisos de Administrador.
echo  Despues de ejecutar, reconectate a tu red WiFi.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  EJECUTANDO SOLUCION...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/4] Desactivando adaptador de WiFi...
netsh interface set interface "Wi-Fi" disable >nul 2>&1
echo      [OK] WiFi desactivado
echo.
echo [2/4] Limpiando configuraciones de red...
ipconfig /flushdns >nul 2>&1
netsh int ip reset >nul 2>&1
echo      [OK] Configuraciones limpiadas
echo.
echo [3/4] Reactivando adaptador de WiFi...
timeout /t 3 /nobreak >nul
netsh interface set interface "Wi-Fi" enable >nul 2>&1
echo      [OK] WiFi reactivado
echo.
echo [4/4] Renovando IP...
ipconfig /release >nul 2>&1
ipconfig /renew >nul 2>&1
echo      [OK] IP renovada
echo.
echo ─────────────────────────────────────────────────────────
echo  SOLUCION COMPLETADA
echo  Ahora reconectate a tu red WiFi:
echo  1. Haz clic en el icono de red en la barra de tareas
echo  2. Selecciona tu red WiFi
echo  3. Ingresa la contrasena
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
timeout /t 1 >nul
exit
