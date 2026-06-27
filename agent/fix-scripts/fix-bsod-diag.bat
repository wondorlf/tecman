@echo off
title TecMan Fix - Pantalla Azul (BSOD)
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Diagnostico de Pantalla Azul (BSOD)       ║
echo  ║  Recopila informacion para diagnostico              ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script recopila informacion del sistema:
echo.
echo    1. Verificar eventos de sistema recientes
echo    2. Revisar temperatura del procesador
echo    3. Verificar estado del disco duro
echo    4. Recopilar reporte de errores
echo.
echo  NOTA: Ejecutar DESPUES de que el equipo reinicie.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  RECOPILANDO INFORMACION...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/4] Verificando eventos de sistema...
wevtutil qe System /c:10 /f:text /rd:true >"%USERPROFILE%\Desktop\reporte-bsod.txt" 2>&1
echo      [OK] Eventos exportados a Escritorio
echo.
echo [2/4] Verificando temperatura...
PowerShell -Command "Get-CimInstance MSAcpi_ThermalZoneTemperature -ErrorAction SilentlyContinue | Select-Object InstanceName, @{N='TempCelsius';E={[math]::Round($_.CurrentTemperature/10-273.15,1)}}" >>"%USERPROFILE%\Desktop\reporte-bsod.txt" 2>&1
echo      [OK] Temperatura verificada
echo.
echo [3/4] Verificando estado del disco...
PowerShell -Command "Get-PhysicalDisk | Select-Object DeviceId, MediaType, HealthStatus, Size | Format-Table -AutoSize" >>"%USERPROFILE%\Desktop\reporte-bsod.txt" 2>&1
echo      [OK] Disco verificado
echo.
echo [4/4] Verificando ultima causa de BSOD...
PowerShell -Command "Get-EventLog -LogName System -EntryType Error -Newest 5 | Select-Object TimeGenerated, Source, Message | Format-Table -AutoSize -Wrap" >>"%USERPROFILE%\Desktop\reporte-bsod.txt" 2>&1
echo      [OK] BSOD recopilado
echo.
echo ─────────────────────────────────────────────────────────
echo  DIAGNOSTICO COMPLETADO
echo.
echo  Se genero un archivo en tu Escritorio:
echo  reporte-bsod.txt
echo.
echo  Envia este archivo al equipo de soporte para analisis.
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
timeout /t 1 >nul
exit
