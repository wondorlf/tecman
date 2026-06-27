@echo off
title TecMan Fix - Sin Internet / DNS
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Solucion de problemas de red              ║
echo  ║  Sin Internet / DNS no resuelve                     ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script realizara las siguientes acciones:
echo.
echo    1. Liberar la IP actual del equipo
echo    2. Renovar la IP desde el servidor DHCP
echo    3. Limpiar la cache DNS
echo    4. Resetear Winsock (configuracion de red)
echo.
echo  NOTA: Se requieren permisos de Administrador.
echo  Si no se ejecuta como Administrador, se solicitara.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  EJECUTANDO SOLUCION...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/4] Liberando IP actual...
ipconfig /release >nul 2>&1
echo      [OK] IP liberada
echo.
echo [2/4] Renovando IP del servidor DHCP...
ipconfig /renew >nul 2>&1
echo      [OK] IP renovada
echo.
echo [3/4] Limpiando cache DNS...
ipconfig /flushdns >nul 2>&1
echo      [OK] Cache DNS limpiada
echo.
echo [4/4] Reseteando Winsock...
netsh winsock reset >nul 2>&1
echo      [OK] Winsock reseteado
echo.
echo ─────────────────────────────────────────────────────────
echo  SOLUCION COMPLETADA
echo  Si persiste el problema, reinicia el equipo.
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
timeout /t 1 >nul
exit
