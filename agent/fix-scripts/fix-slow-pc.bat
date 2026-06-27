@echo off
title TecMan Fix - Equipo Lento
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Solucion de rendimiento                   ║
echo  ║  Equipo lento o tarda en responder                  ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script realizara las siguientes acciones:
echo.
echo    1. Limpiar archivos temporales del sistema
echo    2. Limpiar cache de Windows Update
echo    3. Limpiar miniaturas e iconos
echo    4. Liberar espacio en papelera
echo    5. Optimizar unidades de disco
echo.
echo  NOTA: Tarda aproximadamente 2-5 minutos.
echo  Se requieren permisos de Administrador.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  EJECUTANDO SOLUCION...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/5] Limpiando archivos temporales...
del /q /f /s "%TEMP%\*" >nul 2>&1
del /q /f /s "%windir%\Temp\*" >nul 2>&1
del /q /f /s "%windir%\Prefetch\*" >nul 2>&1
echo      [OK] Temporales limpiados
echo.
echo [2/5] Limpiando cache de Windows Update...
net stop wuauserv >nul 2>&1
del /q /f /s "%windir%\SoftwareDistribution\Download\*" >nul 2>&1
net start wuauserv >nul 2>&1
echo      [OK] Cache de Windows Update limpiada
echo.
echo [3/5] Limpiando miniaturas e iconos...
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 1 /nobreak >nul
del /q /f "%localappdata%\Microsoft\Windows\Explorer\thumbcache_*.db" >nul 2>&1
del /q /f "%localappdata%\Microsoft\Windows\Explorer\iconcache_*.db" >nul 2>&1
start explorer.exe >nul 2>&1
echo      [OK] Miniaturas e iconos limpiados
echo.
echo [4/5] Vaciando papelera...
PowerShell -Command "Clear-RecycleBin -Force" >nul 2>&1
echo      [OK] Papelera vaciada
echo.
echo [5/5] Optimizando unidades de disco...
PowerShell -Command "Get-Volume | Where-Object { $_.DriveLetter -and $_.FileSystemType -in 'NTFS','ReFS' } | ForEach-Object { Optimize-Volume -DriveLetter $_.DriveLetter -ErrorAction SilentlyContinue }" >nul 2>&1
echo      [OK] Unidades optimizadas
echo.
echo ─────────────────────────────────────────────────────────
echo  SOLUCION COMPLETADA
echo  El equipo deberia responder mas rapido.
echo  Si persiste, reinicia el equipo.
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
timeout /t 1 >nul
exit
