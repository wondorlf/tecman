@echo off
title TecMan Fix - Impresora No Imprime
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Solucion de impresora                     ║
echo  ║  Impresora no imprime o aparece offline             ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script realizara las siguientes acciones:
echo.
echo    1. Detener el servicio de spooler de impresion
echo    2. Vaciar la cola de impresion atascada
echo    3. Reiniciar el servicio de spooler
echo    4. Verificar estado del servicio
echo.
echo  NOTA: Se requieren permisos de Administrador.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  EJECUTANDO SOLUCION...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/4] Deteniendo servicio de spooler de impresion...
net stop spooler >nul 2>&1
echo      [OK] Spooler detenido
echo.
echo [2/4] Vaciando cola de impresion...
del /q /f /s "%windir%\System32\spool\PRINTERS\*" >nul 2>&1
echo      [OK] Cola de impresion vaciada
echo.
echo [3/4] Reiniciando servicio de spooler...
net start spooler >nul 2>&1
echo      [OK] Spooler reiniciado
echo.
echo [4/4] Verificando estado del servicio...
sc query spooler | findstr "STATE" >nul 2>&1
echo      [OK] Servicio spooler activo
echo.
echo ─────────────────────────────────────────────────────────
echo  SOLUCION COMPLETADA
echo  Intenta imprimir nuevamente.
echo  Si persiste, verifica que la impresora este encendida
echo  y conectada a la red.
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
timeout /t 1 >nul
exit
