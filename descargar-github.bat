@echo off
REM ============================================================
REM  descargar-github.bat
REM  Script para descargar/clonar el proyecto desde GitHub
REM  Si la carpeta ya existe y es un repo, hace git pull.
REM  Si no existe, clona el repositorio completo.
REM ============================================================
REM  Uso:
REM    descargar-github.bat                    (descarga en la carpeta actual)
REM    descargar-github.bat "C:\ruta\destino"  (descarga en una ruta especifica)
REM ============================================================

setlocal enableextensions enabledelayedexpansion

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

REM -- Determinar carpeta destino
set "DESTINO=%~1"
if "%DESTINO%"=="" (
    set "DESTINO=%~dp0"
)

REM -- Normalizar la ruta (quito barra final si existe)
if "%DESTINO:~-1%"=="\" set "DESTINO=%DESTINO:~0,-1%"

echo ========================================
echo  Descargando proyecto desde GitHub...
echo  Destino: %DESTINO%
echo ========================================
echo.

REM -- Verificar si ya existe un repositorio en la carpeta destino
if exist "%DESTINO%\.git\" (
    REM -- Repositorio existente: hacer pull
    echo [1/2] Repositorio encontrado. Actualizando con git pull...
    cd /d "%DESTINO%"

    REM -- Fetch primero para obtener referencias actualizadas
    echo  -> Obteniendo referencias remotas...
    git fetch origin
    if !ERRORLEVEL! neq 0 (
        echo.
        echo ========================================
        echo  [ERROR] Fallo al conectar con GitHub.
        echo  Revise su conexion a internet o la URL del remoto.
        echo ========================================
        pause
        exit /b 1
    )

    echo  -> Aplicando cambios remotos (pull con autostash)...
    git pull --autostash origin master
    if !ERRORLEVEL! equ 0 (
        echo.
        echo ========================================
        echo  ^!Repositorio actualizado con exito!
        echo ========================================
    ) else (
        echo.
        echo ========================================
        echo  [ERROR] Fallo al actualizar el repositorio.
        echo  Posibles causas:
        echo  - Conflictos de merge sin resolver
        echo  - Cambios locales no commiteados que no pudieron aplicarse
        echo  Revise la salida arriba.
        echo ========================================
    )
) else (
    REM -- No existe repositorio: clonar
    echo [1/2] No se encontro repositorio en la carpeta destino.

    REM -- Verificar que la carpeta destino este vacia
    if exist "%DESTINO%" (
        dir "%DESTINO%" /b /a 2>nul | findstr /r . >nul
        if !ERRORLEVEL! equ 0 (
            echo.
            echo ========================================
            echo  [ERROR] La carpeta "%DESTINO%" no esta vacia
            echo  y no contiene un repositorio Git.
            echo  Use una carpeta vacia o diferente.
            echo ========================================
            pause
            exit /b 1
        )
    ) else (
        mkdir "%DESTINO%"
    )

    echo [2/2] Clonando desde GitHub...
    git clone https://github.com/wondorlf/tecman.git "%DESTINO%"
    if !ERRORLEVEL! equ 0 (
        echo.
        echo ========================================
        echo  ^!Repositorio clonado con exito en:
        echo   %DESTINO%
        echo ========================================
    ) else (
        echo.
        echo ========================================
        echo  [ERROR] Fallo al clonar el repositorio.
        echo  Posibles causas:
        echo  - URL del repositorio incorrecta
        echo  - Sin conexion a internet
        echo  - Repositorio privado sin credenciales
        echo ========================================
    )
)

echo.
pause
