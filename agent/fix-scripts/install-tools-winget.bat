@echo off
title TecMan - Instalador de Herramientas (Winget)
color 0A
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  TecMan - Instalador de Herramientas TI             ║
echo  ║  Instalacion masiva con Winget                      ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Este script instalara las herramientas esenciales:
echo.
echo   [Navegadores]  Chrome, Firefox, Edge
echo   [Ofimatica]    LibreOffice, Adobe Reader
echo   [Utilidades]   7-Zip, Notepad++, VLC, WinRAR
echo   [Remoto]       AnyDesk, RustDesk, TeamViewer
echo   [Sistema]      Everything, TreeSize, CrystalDiskInfo
echo   [Seguridad]    Malwarebytes
echo   [Codigo]       VS Code, Git
echo.
echo  IMPORTANTE: Requiere permisos de Administrador.
echo  Cada instalacion tarda 10-30 segundos.
echo.
pause
echo.
echo ─────────────────────────────────────────────────────────
echo  VERIFICANDO WINGET...
echo ─────────────────────────────────────────────────────────
echo.
winget --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Winget no esta instalado.
    echo Descarga Microsoft App Installer desde la Microsoft Store.
    echo.
    pause
    exit /b 1
)
echo [OK] Winget disponible
echo.
echo ─────────────────────────────────────────────────────────
echo  INSTALANDO HERRAMIENTAS...
echo ─────────────────────────────────────────────────────────
echo.
echo [1/12] Google Chrome...
winget install --id Google.Chrome --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] Chrome instalado || echo      [WARN] Chrome ya instalado o error
echo.
echo [2/12] Mozilla Firefox...
winget install --id Mozilla.Firefox --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] Firefox instalado || echo      [WARN] Firefox ya instalado o error
echo.
echo [3/12] LibreOffice...
winget install --id TheDocumentFoundation.LibreOffice --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] LibreOffice instalado || echo      [WARN] LibreOffice ya instalado o error
echo.
echo [4/12] Adobe Acrobat Reader...
winget install --id Adobe.Acrobat.Reader.64-bit --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] Adobe Reader instalado || echo      [WARN] Adobe Reader ya instalado o error
echo.
echo [5/12] 7-Zip...
winget install --id 7zip.7zip --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] 7-Zip instalado || echo      [WARN] 7-Zip ya instalado o error
echo.
echo [6/12] Notepad++...
winget install --id Notepad++.Notepad++ --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] Notepad++ instalado || echo      [WARN] Notepad++ ya instalado o error
echo.
echo [7/12] VLC Media Player...
winget install --id VideoLAN.VLC --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] VLC instalado || echo      [WARN] VLC ya instalado o error
echo.
echo [8/12] WinRAR...
winget install --id RARLab.WinRAR --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] WinRAR instalado || echo      [WARN] WinRAR ya instalado o error
echo.
echo [9/12] AnyDesk...
winget install --id AnyDeskSoftwareGmbH.AnyDesk --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] AnyDesk instalado || echo      [WARN] AnyDesk ya instalado o error
echo.
echo [10/12] RustDesk...
winget install --id RustDesk.RustDesk --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] RustDesk instalado || echo      [WARN] RustDesk ya instalado o error
echo.
echo [11/12] Everything (buscador)...
winget install --id voidtools.Everything --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] Everything instalado || echo      [WARN] Everything ya instalado o error
echo.
echo [12/12] CrystalDiskInfo...
winget install --id CrystalDewWorld.CrystalDiskInfo --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] CrystalDiskInfo instalado || echo      [WARN] CrystalDiskInfo ya instalado o error
echo.
echo ─────────────────────────────────────────────────────────
echo  INSTALACION COMPLETADA
echo  Revisa que las herramientas aparezcan en el Inicio.
echo ─────────────────────────────────────────────────────────
echo.
echo  --------------------------------------------------------
echo   Creado por Egan by Jorge Montiel
echo   Plataforma TecMan - Sistema de Gestion de Activos
echo   http://190.14.232.222:2024
echo  --------------------------------------------------------
timeout /t 1 >nul
exit
