@echo off
title TecMan Fix - VPN No Conecta
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Solucion de VPN                           ║
echo  ║  VPN no conecta o se desconecta                     ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script realizara las siguientes acciones:
echo.
echo    1. Limpiar cache DNS
echo    2. Resetear adaptador de red
echo    3. Verificar servicios de VPN
echo    4. Reiniciar servicios de red
echo.
echo  NOTA: Despues de ejecutar, reconecta tu VPN.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  EJECUTANDO SOLUCION...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/4] Limpiando cache DNS...
ipconfig /flushdns >nul 2>&1
echo      [OK] DNS limpiada
echo.
echo [2/4] Resetear adaptador de red...
netsh int ip reset >nul 2>&1
netsh winsock reset >nul 2>&1
echo      [OK] Adaptador reseteado
echo.
echo [3/4] Verificando servicios de VPN...
sc query RasMan >nul 2>&1
if %errorlevel%==0 (
    echo      [OK] Servicio RasMan activo
) else (
    echo      [WARN] Servicio RasMan no encontrado
    net start RasMan >nul 2>&1
)
sc query IKEEXT >nul 2>&1
if %errorlevel%==0 (
    echo      [OK] Servicio IKEEXT activo
) else (
    echo      [WARN] Servicio IKEEXT no encontrado
    net start IKEEXT >nul 2>&1
)
echo.
echo [4/4] Reiniciando servicios de red...
net stop "IPsec Policy Agent" >nul 2>&1
net start "IPsec Policy Agent" >nul 2>&1
echo      [OK] Servicios reiniciados
echo.
echo ─────────────────────────────────────────────────────────
echo  SOLUCION COMPLETADA
echo  Reconecta tu VPN y verifica si funciona.
echo  Si persiste, verifica las credenciales de la VPN.
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
timeout /t 1 >nul
exit
