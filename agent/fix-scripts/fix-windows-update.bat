@echo off
title TecMan Fix - Windows Update No Funciona
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Solucion de Windows Update                ║
echo  ║  Actualizaciones no descargan o se quedan trabadas  ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script realizara las siguientes acciones:
echo.
echo    1. Detener servicios de Windows Update
echo    2. Vaciar cache de descargas
echo    3. Reiniciar servicios
echo    4. Forzar verificacion de actualizaciones
echo.
echo  NOTA: Se requieren permisos de Administrador.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  EJECUTANDO SOLUCION...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/4] Deteniendo servicios de Windows Update...
net stop wuauserv >nul 2>&1
net stop cryptSvc >nul 2>&1
net stop bits >nul 2>&1
net stop msiserver >nul 2>&1
echo      [OK] Servicios detenidos
echo.
echo [2/4] Vaciando cache de descargas...
del /q /f /s "%windir%\SoftwareDistribution\Download\*" >nul 2>&1
del /q /f /s "%windir%\SoftwareDistribution\DataStore\*" >nul 2>&1
echo      [OK] Cache vaciada
echo.
echo [3/4] Reiniciando servicios...
net start wuauserv >nul 2>&1
net start cryptSvc >nul 2>&1
net start bits >nul 2>&1
net start msiserver >nul 2>&1
echo      [OK] Servicios reiniciados
echo.
echo [4/4] Forzando verificacion de actualizaciones...
wuauclt /detectnow >nul 2>&1
wuauclt /updatenow >nul 2>&1
echo      [OK] Verificacion iniciada
echo.
echo ─────────────────────────────────────────────────────────
echo  SOLUCION COMPLETADA
echo  Abre Windows Update y verifica las actualizaciones.
echo  Si persiste, reinicia el equipo e intenta de nuevo.
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
timeout /t 1 >nul
exit
