@echo off
:: ============================================================
:: Script de mantenimiento y optimizacion para Windows 10/11
:: Version 1.0 - Compatible con ejecucion sin configuracion adicional
:: Requiere: Ejecutar como Administrador
:: ============================================================

setlocal enabledelayedexpansion
set "ScriptVersion=1.0"
set "LogDir=%ProgramData%\MantenimientoWindows"
set "LogFile=%LogDir%\mantenimiento_%date:~-4%%date:~4,2%%date:~7,2%.log"

if not exist "%LogDir%" mkdir "%LogDir%"

:main_menu
cls
echo ============================================================
echo    MANTENIMIENTO Y OPTIMIZACION DE WINDOWS - v%ScriptVersion%
echo ============================================================
echo Log de esta sesion: %LogFile%
echo.
echo  1) Limpieza y mantenimiento (temporales, prefetch, etc.)
echo  2) Personalizacion (transparentes / animaciones)
echo  3) Exclusiones de antivirus (Defender)
echo  4) Instalar / actualizar programas
echo  5) Diagnostico y reparacion
echo  6) Salir
echo.
set /p "choice=Selecciona una opcion: "

if "%choice%"=="1" goto :cleanup_menu
if "%choice%"=="2" goto :personalization_menu
if "%choice%"=="3" goto :defender_menu
if "%choice%"=="4" goto :install_menu
if "%choice%"=="5" goto :diagnostics_menu
if "%choice%"=="6" goto :eof
echo Opcion no valida.
timeout /t 1 /nobreak >nul
goto :main_menu

:log
set "msg=%~1"
set "lvl=%~2"
if "%lvl%"=="" set "lvl=INFO"
for /f "tokens=1-3 delims=/: " %%a in ('echo %date% %time%') do set "ts=%%a-%%b-%%c"
for /f "tokens=1-2 delims=.: " %%a in ("%time%") do set "tm=%%a:%%b"
echo [%ts% %tm%][%lvl%] %msg%
echo [%ts% %tm%][%lvl%] %msg% >> "%LogFile%"
goto :eof

:check_admin
net session >nul 2>&1
if %errorLevel%==0 exit /b 0
call :log "Este script necesita permisos de Administrador." "WARN"
PowerShell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
exit

:cleanup_menu
call :check_admin
cls
echo ===== MODULO 1: LIMPIEZA Y MANTENIMIENTO =====
echo   1) Limpieza completa recomendada
echo   2) Solo Temp / %%TEMP%% / Prefetch
echo   3) Vaciar papelera
echo   4) Limpiar cache DNS
echo   5) Limpiar cache de miniaturas
echo   6) Limpiar cache Delivery Optimization
echo   7) Limpiar cache Windows Update
echo   8) Vaciar registros de eventos
echo   9) Limpiar almacen WinSxS (DISM)
echo  10) Liberador de espacio en disco (cleanmgr)
echo  11) Verificar disco (CHKDSK) - programa reinicio
echo  12) Reparar archivos sistema (DISM + SFC)
echo   0) Volver al menu principal
echo.
set /p "opt=Selecciona una opcion: "

if "%opt%"=="1" goto :cleanup_full
if "%opt%"=="2" goto :temp_cleanup
if "%opt%"=="3" goto :recycle_cleanup
if "%opt%"=="4" goto :dns_flush
if "%opt%"=="5" goto :thumbnail_cleanup
if "%opt%"=="6" goto :delivery_cleanup
if "%opt%"=="7" goto :wu_cache_cleanup
if "%opt%"=="8" goto :eventlog_cleanup
if "%opt%"=="9" goto :winsxs_cleanup
if "%opt%"=="10" goto :cleanmgr_run
if "%opt%"=="11" goto :chkdsk_schedule
if "%opt%"=="12" goto :sfc_repair
if "%opt%"=="0" goto :main_menu
goto :cleanup_menu

:temp_cleanup
call :log "Limpiando temporales..." "INFO"
del /q /f /s "%TEMP%\*" 2>nul
del /q /f /s "%windir%\Temp\*" 2>nul
del /q /f /s "%windir%\Prefetch\*" 2>nul
call :log "Temp, Prefetch y %%TEMP%% limpiados." "OK"
goto :pause_return

:recycle_cleanup
call :log "Vaciando papelera..." "INFO"
PowerShell -Command "Clear-RecycleBin -Force" 2>nul
call :log "Papelera vaciada." "OK"
goto :pause_return

:dns_flush
call :log "Limpiando cache DNS..." "INFO"
ipconfig /flushdns >nul 2>&1
call :log "Cache DNS limpiada." "OK"
goto :pause_return

:thumbnail_cleanup
call :log "Limpiando cache de miniaturas..." "INFO"
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 1 /nobreak >nul
del /q /f "%localappdata%\Microsoft\Windows\Explorer\thumbcache_*.db" 2>nul
del /q /f "%localappdata%\Microsoft\Windows\Explorer\iconcache_*.db" 2>nul
start explorer.exe >nul 2>&1
call :log "Cache de miniaturas limpiada (Explorer reiniciado)." "OK"
goto :pause_return

:delivery_cleanup
call :log "Limpiando cache Delivery Optimization..." "INFO"
del /q /f /s "%windir%\SoftwareDistribution\DeliveryOptimization\*" 2>nul
call :log "Cache Delivery Optimization limpiada." "OK"
goto :pause_return

:wu_cache_cleanup
call :log "Limpiando cache Windows Update..." "INFO"
net stop wuauserv >nul 2>&1
del /q /f /s "%windir%\SoftwareDistribution\Download\*" 2>nul
net start wuauserv >nul 2>&1
call :log "Cache Windows Update limpiada." "OK"
goto :pause_return

:eventlog_cleanup
call :log "Vaciando registros de eventos..." "INFO"
for /f "tokens=*" %%a in ('wevtutil enum-logs ^| findstr /i "log"') do (
    wevtutil cl "%%a" >nul 2>&1
)
call :log "Registros de eventos vaciados." "OK"
goto :pause_return

:winsxs_cleanup
call :log "Ejecutando DISM para limpiar WinSxS..." "INFO"
DISM.exe /online /Cleanup-Image /StartComponentCleanup
call :log "Limpieza WinSxS completada." "OK"
goto :pause_return

:cleanmgr_run
call :log "Configurando cleanmgr..." "INFO"
for %%v in (1 2 3 4 5 6 7 8) do reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\%%v" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul 2>&1
start /wait cleanmgr.exe /sagerun:1
call :log "cleanmgr ejecutado." "OK"
goto :pause_return

:chkdsk_schedule
call :log "Programando CHKDSK para el proximo reinicio..." "INFO"
echo Y | chkdsk C: /f /r
call :log "CHKDSK programado. Se ejecutara antes del inicio del sistema." "OK"
goto :pause_return

:sfc_repair
echo.
echo Este proceso puede tardar entre 10 y 30 minutos.
call :confirm_action "Deseas continuar"
if errorlevel 1 goto :sfc_run
goto :cleanup_menu

:sfc_run
call :log "Ejecutando DISM CheckHealth..." "INFO"
DISM.exe /Online /Cleanup-Image /CheckHealth
call :log "Ejecutando DISM ScanHealth..." "INFO"
DISM.exe /Online /Cleanup-Image /ScanHealth
call :log "Ejecutando DISM RestoreHealth..." "INFO"
DISM.exe /Online /Cleanup-Image /RestoreHealth
call :log "Ejecutando SFC /scannow..." "INFO"
sfc.exe /scannow
call :log "Reparacion de archivos sistema completada. Reinicia el equipo." "OK"
goto :pause_return

:cleanup_full
call :confirm_action "Esto ejecuta TODAS las rutinas de limpieza. Continuar"
if errorlevel 1 (
    call :log "Iniciando limpieza completa..." "INFO"
    del /q /f /s "%TEMP%\*" 2>nul
    del /q /f /s "%windir%\Temp\*" 2>nul
    del /q /f /s "%windir%\Prefetch\*" 2>nul
    call :log "Temp, Prefetch limpiados." "OK"
    PowerShell -Command "Clear-RecycleBin -Force" 2>nul
    call :log "Papelera vaciada." "OK"
    ipconfig /flushdns >nul 2>&1
    call :log "Cache DNS limpiada." "OK"
    taskkill /f /im explorer.exe >nul 2>&1
    timeout /t 1 /nobreak >nul
    del /q /f "%localappdata%\Microsoft\Windows\Explorer\thumbcache_*.db" 2>nul
    del /q /f "%localappdata%\Microsoft\Windows\Explorer\iconcache_*.db" 2>nul
    start explorer.exe >nul 2>&1
    call :log "Cache miniaturas limpiada." "OK"
    del /q /f /s "%windir%\SoftwareDistribution\DeliveryOptimization\*" 2>nul
    call :log "Cache Delivery Optimization limpiada." "OK"
    net stop wuauserv >nul 2>&1
    del /q /f /s "%windir%\SoftwareDistribution\Download\*" 2>nul
    net start wuauserv >nul 2>&1
    call :log "Cache Windows Update limpiada." "OK"
    for /f "tokens=*" %%a in ('wevtutil enum-logs ^| findstr /i "log"') do wevtutil cl "%%a" >nul 2>&1
    call :log "Eventos vaciados." "OK"
    DISM.exe /online /Cleanup-Image /StartComponentCleanup
    call :log "WinSxS limpiado." "OK"
    call :log "== Limpieza completa finalizada ==" "OK"
)
goto :pause_return

:personalization_menu
cls
echo ===== MODULO 2: PERSONALIZACION =====
echo   1) Deshabilitar transparentes
echo   2) Habilitar transparentes
echo   3) Activar modo rendimiento
echo   4) Restaurar animaciones por defecto
echo   0) Volver al menu principal
echo.
set /p "opt=Selecciona una opcion: "

if "%opt%"=="1" goto :disable_transparency
if "%opt%"=="2" goto :enable_transparency
if "%opt%"=="3" goto :performance_mode
if "%opt%"=="4" goto :appearance_mode
if "%opt%"=="0" goto :main_menu
goto :personalization_menu

:disable_transparency
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize" /v "EnableTransparency" /t REG_DWORD /d 0 /f >nul 2>&1
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 1 /nobreak >nul
start explorer.exe >nul 2>&1
call :log "Transparencias deshabilitadas." "OK"
goto :pause_return

:enable_transparency
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize" /v "EnableTransparency" /t REG_DWORD /d 1 /f >nul 2>&1
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 1 /nobreak >nul
start explorer.exe >nul 2>&1
call :log "Transparencias habilitadas." "OK"
goto :pause_return

:performance_mode
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "TaskbarAnimations" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "ListviewShadow" /t REG_DWORD /d 0 /f >nul 2>&1
call :log "Modo rendimiento activado (animaciones reducidas)." "OK"
goto :pause_return

:appearance_mode
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "TaskbarAnimations" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "ListviewShadow" /t REG_DWORD /d 1 /f >nul 2>&1
call :log "Modo apariencia activado (animaciones activas)." "OK"
goto :pause_return

:defender_menu
cls
echo ===== MODULO 3: EXCLUSIONES DE ANTIVIRUS (DEFENDER) =====
echo   1) Aplicar exclusiones recomendadas (OneDrive, Google Drive, Spooler)
echo   2) Agregar exclusion personalizada
echo   3) Ver exclusiones actuales
echo   0) Volver al menu principal
echo.
set /p "opt=Selecciona una opcion: "

if "%opt%"=="1" goto :defender_default
if "%opt%"=="2" goto :defender_custom
if "%opt%"=="3" goto :defender_list
if "%opt%"=="0" goto :main_menu
goto :defender_menu

:defender_default
echo Aplicando exclusiones Defender...
PowerShell -ExecutionPolicy Bypass -Command "Add-MpPreference -ExclusionProcess 'onedrive.exe' -ErrorAction SilentlyContinue; Add-MpPreference -ExclusionProcess 'FileCoAuth.exe' -ErrorAction SilentlyContinue; Add-MpPreference -ExclusionProcess 'OneDriveSetup.exe' -ErrorAction SilentlyContinue; Add-MpPreference -ExclusionProcess 'GoogleDriveFS.exe' -ErrorAction SilentlyContinue; Add-MpPreference -ExclusionProcess 'GoogleDriveSync.exe' -ErrorAction SilentlyContinue; Add-MpPreference -ExclusionProcess 'GoogleDriveFileStream.exe' -ErrorAction SilentlyContinue; Add-MpPreference -ExclusionPath '%windir%\System32\spool\PRINTERS' -ErrorAction SilentlyContinue; Add-MpPreference -ExclusionProcess 'spoolsv.exe' -ErrorAction SilentlyContinue;"
call :log "Exclusiones Defender aplicadas." "OK"
goto :pause_return

:defender_custom
cls
echo   1) Excluir proceso (.exe)
echo   2) Excluir extension
echo   3) Excluir carpeta/ruta
echo.
set /p "sub=Tipo exclusion: "
if "%sub%"=="1" (
    set /p "proc=Nombre proceso (ej: app.exe): "
    PowerShell -ExecutionPolicy Bypass -Command "Add-MpPreference -ExclusionProcess '%proc%' -ErrorAction SilentlyContinue"
    call :log "Proceso excluido: %proc%" "OK"
)
if "%sub%"=="2" (
    set /p "ext=Extension sin punto (ej: tmp): "
    PowerShell -ExecutionPolicy Bypass -Command "Add-MpPreference -ExclusionExtension '%ext%' -ErrorAction SilentlyContinue"
    call :log "Extension excluida: .%ext%" "OK"
)
if "%sub%"=="3" (
    set /p "path=Ruta completa carpeta: "
    PowerShell -ExecutionPolicy Bypass -Command "Add-MpPreference -ExclusionPath '%path%' -ErrorAction SilentlyContinue"
    call :log "Ruta excluida: %path%" "OK"
)
goto :pause_return

:defender_list
PowerShell -ExecutionPolicy Bypass -Command "Get-MpPreference | Select-Object -ExpandProperty ExclusionProcess"
PowerShell -ExecutionPolicy Bypass -Command "Get-MpPreference | Select-Object -ExpandProperty ExclusionExtension"
PowerShell -ExecutionPolicy Bypass -Command "Get-MpPreference | Select-Object -ExpandProperty ExclusionPath"
goto :pause_return

:install_menu
cls
echo ===== MODULO 4: INSTALAR / ACTUALIZAR PROGRAMAS =====
echo   winget esta disponible en Windows 10/11 (no requiere instalacion)
echo.
echo   1) Instalar VLC
echo   2) Instalar 7-Zip
echo   3) Instalar Adobe Reader
echo   4) Instalar K-Lite Codec Pack
echo   5) Instalar Google Chrome
echo   6) Instalar Mozilla Firefox
echo   7) Instalar Notepad++
echo   8) Instalar WinRAR
echo   9) Instalar Java RE
echo  10) Instalar .NET Desktop Runtime 8
echo  11) Instalar AnyDesk
echo  12) Instalar RustDesk
echo   A) Actualizar todos los programas
echo   0) Volver al menu principal
echo.
set /p "opt=Selecciona opcion: "

if /i "%opt%"=="A" goto :update_all
if "%opt%"=="1" winget install --id VideoLAN.VLC --silent --accept-source-agreements --accept-package-agreements -e >nul && call :log "VLC instalado." "OK" || call :log "Error VLC." "WARN"
if "%opt%"=="2" winget install --id 7zip.7zip --silent --accept-source-agreements --accept-package-agreements -e >nul && call :log "7-Zip instalado." "OK" || call :log "Error 7-Zip." "WARN"
if "%opt%"=="3" winget install --id Adobe.Acrobat.Reader.64-bit --silent --accept-source-agreements --accept-package-agreements -e >nul && call :log "Adobe Reader instalado." "OK" || call :log "Error Adobe." "WARN"
if "%opt%"=="4" winget install --id CodecGuide.K-LiteCodecPackStandard --silent --accept-source-agreements --accept-package-agreements -e >nul && call :log "K-Lite instalado." "OK" || call :log "Error K-Lite." "WARN"
if "%opt%"=="5" winget install --id Google.Chrome --silent --accept-source-agreements --accept-package-agreements -e >nul && call :log "Chrome instalado." "OK" || call :log "Error Chrome." "WARN"
if "%opt%"=="6" winget install --id Mozilla.Firefox --silent --accept-source-agreements --accept-package-agreements -e >nul && call :log "Firefox instalado." "OK" || call :log "Error Firefox." "WARN"
if "%opt%"=="7" winget install --id Notepad++.Notepad++ --silent --accept-source-agreements --accept-package-agreements -e >nul && call :log "Notepad++ instalado." "OK" || call :log "Error Notepad++." "WARN"
if "%opt%"=="8" winget install --id RARLab.WinRAR --silent --accept-source-agreements --accept-package-agreements -e >nul && call :log "WinRAR instalado." "OK" || call :log "Error WinRAR." "WARN"
if "%opt%"=="9" winget install --id Oracle.JavaRuntimeEnvironment --silent --accept-source-agreements --accept-package-agreements -e >nul && call :log "Java RE instalado." "OK" || call :log "Error Java." "WARN"
if "%opt%"=="10" winget install --id Microsoft.DotNet.DesktopRuntime.8 --silent --accept-source-agreements --accept-package-agreements -e >nul && call :log ".NET instalado." "OK" || call :log "Error .NET." "WARN"
if "%opt%"=="11" winget install --id AnyDeskSoftwareGmbH.AnyDesk --silent --accept-source-agreements --accept-package-agreements -e >nul && call :log "AnyDesk instalado." "OK" || call :log "Error AnyDesk." "WARN"
if "%opt%"=="12" winget install --id RustDesk.RustDesk --silent --accept-source-agreements --accept-package-agreements -e >nul && call :log "RustDesk instalado." "OK" || call :log "Error RustDesk." "WARN"
if "%opt%"=="0" goto :main_menu
goto :install_menu

:update_all
PowerShell -Command "winget upgrade --all --silent --accept-source-agreements --accept-package-agreements" >nul
call :log "Actualizacion masiva completada." "OK"
goto :pause_return

:diagnostics_menu
cls
echo ===== MODULO 5: DIAGNOSTICO Y REPARACION =====
echo   1) Puntos de restauracion
echo   2) Reset de red
echo   3) Optimizar unidades
echo   4) Resetear licencia AnyDesk
echo   0) Volver al menu principal
echo.
set /p "opt=Selecciona una opcion: "

if "%opt%"=="1" goto :restore_menu
if "%opt%"=="2" goto :network_reset
if "%opt%"=="3" goto :optimize_volumes
if "%opt%"=="4" goto :anydesk_reset
if "%opt%"=="0" goto :main_menu
goto :diagnostics_menu

:restore_menu
cls
echo ----- Puntos de restauracion -----
echo   1) Crear punto de restauracion
echo   2) Ver puntos existentes
echo   3) Restaurar a punto
echo   0) Volver
echo.
set /p "opt=Selecciona: "

if "%opt%"=="1" PowerShell -Command "Enable-ComputerRestore -Drive 'C:\'; Checkpoint-Computer -Description 'Mantenimiento' -RestorePointType MODIFY_SETTINGS" && call :log "Punto creado." "OK" || call :log "No se pudo crear punto." "WARN"
if "%opt%"=="2" PowerShell -Command "& { Get-ComputerRestorePoint | Sort-Object CreationTime -Desc | ft SequenceNumber, Description, @{Name='Fecha';Expression={[Management.ManagementDateTimeConverter]::ToDateTime($_.CreationTime)}} }"
if "%opt%"=="3" PowerShell -Command "& { $seq=Read-Host 'Numero de punto a restaurar'; if ($seq -match '^\d+$') { Restore-Computer -RestorePoint $seq -Confirm:$false } }"
if "%opt%"=="0" goto :diagnostics_menu
goto :pause_return

:network_reset
call :confirm_action "Esto restablece la configuracion de red. Continuar"
if errorlevel 1 (
    call :log "Reseteando red..." "INFO"
    netsh winsock reset
    netsh int ip reset
    ipconfig /flushdns
    call :confirm_action "Renovar IP ahora"
    if errorlevel 1 (
        ipconfig /release
        ipconfig /renew
        call :log "IP renovada." "OK"
    )
    call :log "Reset de red completado. Reinicia el equipo." "WARN"
)
goto :pause_return

:optimize_volumes
PowerShell -Command "& { Get-Volume | Where-Object { $_.DriveLetter -and $_.FileSystemType -in 'NTFS','ReFS' } | ForEach-Object { Optimize-Volume -DriveLetter $_.DriveLetter -Verbose } }"
call :log "Optimizacion de unidades completada." "OK"
goto :pause_return

:anydesk_reset
set "anydeskPath=C:\Program Files (x86)\AnyDesk\AnyDesk.exe"
set "anydeskData=%ProgramData%\AnyDesk"

call :log "Reseteando licencia AnyDesk..." "INFO"
taskkill /f /im AnyDesk.exe >nul 2>&1
if exist "%anydeskData%" (
    del /q /f "%anydeskData%\service*" >nul 2>&1
    del /q /f "%anydeskData%\system*" >nul 2>&1
)
if exist "%anydeskPath%" (
    start "" "%anydeskPath%" >nul 2>&1
    call :log "AnyDesk reiniciado." "OK"
) else (
    call :log "AnyDesk no encontrado." "WARN"
)
goto :pause_return

:confirm_action
set /p "resp=%~1 (S/N): "
if /i "%resp%"=="S" exit /b 1
if /i "%resp%"=="SI" exit /b 1
if /i "%resp%"=="Y" exit /b 1
exit /b 0

:pause_return
echo.
pause
goto :main_menu

endlocal