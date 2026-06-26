@echo off
REM ============================================================
REM  actualizar-github.bat
REM  Script para sincronizar el proyecto con GitHub
REM  (git add, commit, pull, push)
REM ============================================================
REM  Uso:
REM    actualizar-github.bat "mensaje del commit"
REM    (si no se pasa mensaje, usa la fecha/hora actual)
REM ============================================================

cd /d "%~dp0"

REM -- Validacion: git debe estar disponible
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ========================================
    echo  [ERROR] Git no esta instalado o no esta en PATH.
    echo  Instale Git desde https://git-scm.com/ y reintente.
    echo ========================================
    pause
    exit /b 1
)

REM -- Validacion: debe ser un repositorio git
git rev-parse --git-dir >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ========================================
    echo  [ERROR] No se encontro un repositorio Git en este directorio.
    echo  Ejecute 'git init' o clone el repositorio primero.
    echo ========================================
    pause
    exit /b 1
)

echo ========================================
echo  Sincronizando proyecto con GitHub...
echo ========================================
echo.

REM -- 1. Mostrar estado actual
echo [1/6] Estado actual del repositorio:
git status
echo.

REM -- 2. Agregar todos los cambios
echo [2/6] Agregando cambios...
git add -A
if %ERRORLEVEL% neq 0 (
    echo ========================================
    echo  [ERROR] Fallo al agregar archivos.
    echo ========================================
    pause
    exit /b 1
)
echo.

REM -- 3. Commit con mensaje
set "commit_msg=%~1"
if "%commit_msg%"=="" (
    REM -- Obtener fecha/hora con PowerShell (fallback a variables del sistema si falla)
    set "dt_fecha=%DATE%"
    set "dt_hora=%TIME%"
    for /f %%a in ('powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd-HHmmss'" 2^>nul') do set "dt_ps=%%a"
    if defined dt_ps (
        set "commit_msg=Actualizacion %dt_ps%"
    ) else (
        REM -- Fallback: usar variables %DATE% y %TIME% del sistema
        set "commit_msg=Actualizacion %dt_fecha% %dt_hora%"
    )
)
echo [3/6] Haciendo commit...
git commit -m "%commit_msg%"

REM -- El commit puede fallar si no hay cambios (exit code 1), lo cual es normal
if %ERRORLEVEL% neq 0 (
    echo.
    echo  [AVISO] No hay cambios nuevos para commitear o el commit fallo.
    echo  Se continua con pull/push de todas formas.
) else (
    echo  Commit exitoso: %commit_msg%
)
echo.

REM -- 4. Traer cambios remotos (pull con autostash para evitar conflictos)
echo [4/6] Trayendo cambios del remoto (pull)...
git pull --autostash origin master
if %ERRORLEVEL% neq 0 (
    echo.
    echo ========================================
    echo  [ERROR] Fallo al hacer pull. Posibles causas:
    echo  - Conflictos de merge sin resolver
    echo  - Sin conexion a internet
    echo  - El remoto 'origin' no esta configurado
    echo ========================================
    pause
    exit /b 1
)
echo.

REM -- 5. Subir cambios (push)
echo [5/6] Subiendo cambios a GitHub (push)...
git push origin master
if %ERRORLEVEL% neq 0 (
    echo.
    echo ========================================
    echo  [ERROR] Fallo al hacer push.
    echo  Posibles causas:
    echo  - Credenciales de GitHub no configuradas
    echo  - Sin permisos de escritura en el repositorio
    echo  - Sin conexion a internet
    echo ========================================
    pause
    exit /b 1
)
echo.

REM -- 6. Verificacion final
echo [6/6] Verificando estado final...
git log --oneline -3

echo.
echo ========================================
echo  ^!Sincronizacion completada con exito!
echo ========================================

pause
