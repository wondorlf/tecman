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

echo ========================================
echo  Sincronizando proyecto con GitHub...
echo ========================================
echo.

REM ── 1. Mostrar estado actual
echo [1/5] Estado actual del repositorio:
git status
echo.

REM ── 2. Agregar todos los cambios
echo [2/5] Agregando cambios...
git add -A
echo.

REM ── 3. Commit
set "commit_msg=%~1"
if "%commit_msg%"=="" (
    for /f "tokens=2 delims==." %%a in ('wmic os get localdatetime /value ^| find "="') do set "dt=%%a"
    set "commit_msg=Actualizacion %dt:~0,4%-%dt:~4,2%-%dt:~6,2% %dt:~8,2%:%dt:~10,2%:%dt:~12,2%"
)
echo [3/5] Haciendo commit...
git commit -m "%commit_msg%"
echo.

REM ── 4. Traer cambios remotos (pull)
echo [4/5] Trayendo cambios del remoto (pull)...
git pull origin master
echo.

REM ── 5. Subir cambios (push)
echo [5/5] Subiendo cambios a GitHub (push)...
git push origin master
echo.

REM ── Resultado final
if %ERRORLEVEL% equ 0 (
    echo ========================================
    echo  ^¡Sincronizacion completada con exito!
    echo ========================================
) else (
    echo ========================================
    echo  Hubo errores. Revise la salida arriba.
    echo ========================================
)

pause
