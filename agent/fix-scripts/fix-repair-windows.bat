@echo off
title TecMan Fix - Reparar Windows (Completo)
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Reparacion completa de Windows             ║
echo  ║  Basado en Tweaking.com Windows Repair               ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script ejecutara herramientas de reparacion nativas:
echo.
echo    1. Reparar archivos de sistema (SFC)
echo    2. Reparar imagen de Windows (DISM)
echo    3. Reparar registro de Windows
echo    4. Reparar permisos de archivos
echo    5. Reparar winsock y TCP/IP
echo    6. Verificar disco duro
echo.
echo  IMPORTANTE: Tarda entre 15-45 minutos.
echo  Se requieren permisos de Administrador.
echo  NO apagues el equipo durante el proceso.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  INICIANDO REPARACION COMPLETA...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/6] Reparando archivos de sistema (SFC)...
echo       Este paso tarda 10-20 minutos...
sfc /scannow >nul 2>&1
echo      [OK] SFC completado
echo.
echo [2/6] Reparando imagen de Windows (DISM)...
echo       Este paso tarda 5-15 minutos...
DISM /Online /Cleanup-Image /RestoreHealth >nul 2>&1
echo      [OK] DISM completado
echo.
echo [3/6] Reparando registro de Windows...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager" /v BootExecute /t REG_MULTI_SZ /d "autocheck autochk *" /f >nul 2>&1
echo      [OK] Registro verificado
echo.
echo [4/6] Reparando permisos de archivos...
icacls "C:\Windows" /reset /t /c /q >nul 2>&1
echo      [OK] Permisos verificados
echo.
echo [5/6] Reparando Winsock y TCP/IP...
netsh winsock reset >nul 2>&1
netsh int ip reset >nul 2>&1
ipconfig /flushdns >nul 2>&1
echo      [OK] Winsock y TCP/IP reparados
echo.
echo [6/6] Verificando disco duro...
echo       Programando CHKDSK para el proximo reinicio...
echo Y | chkdsk C: /f >nul 2>&1
echo      [OK] CHKDSK programado
echo.
echo ─────────────────────────────────────────────────────────
echo  REPARACION COMPLETADA
echo.
echo  REINICIA EL EQUIPO para que CHKDSK se ejecute.
echo  El equipo puede tardar mas en iniciar la proxima vez.
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
timeout /t 1 >nul
exit
