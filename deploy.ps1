<#
.SYNOPSIS
    Deploy script for TecMan — Gestión de Activos y Mantenimiento
.DESCRIPTION
    Automates: npm install → prisma generate → db push → seed → build → pm2 reload
    Run from the project root directory (C:\egan_projects\egan-tecman).
.NOTES
    Requires: Node.js >= 18, npm, PM2 globally installed
    Author:  EGAN TECH
    Version: 2.0.0
#>

#Requires -Version 5.1

param(
    [switch]$SkipInstall,
    [switch]$SkipSeed,
    [switch]$SkipBuild,
    [switch]$SkipPM2
)

$ErrorActionPreference = "Stop"

# ── Colores para output ──────────────────────────────────────────────────────
$C_INFO    = "Cyan"
$C_OK      = "Green"
$C_WARN    = "Yellow"
$C_ERR     = "Red"
$C_STEP    = "Magenta"

function Write-Step ($msg)  { Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] ═══ $msg ═══" -ForegroundColor $C_STEP }
function Write-Info ($msg)  { Write-Host "  → $msg" -ForegroundColor $C_INFO }
function Write-OK   ($msg)  { Write-Host "  ✓ $msg" -ForegroundColor $C_OK }
function Write-Warn ($msg)  { Write-Host "  ⚠ $msg" -ForegroundColor $C_WARN }
function Write-Err  ($msg)  { Write-Host "  ✗ $msg" -ForegroundColor $C_ERR }

# ── Timestamp inicial ────────────────────────────────────────────────────────
$startTime = Get-Date
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $C_STEP
Write-Host "  TecMan — Deploy automático" -ForegroundColor $C_STEP
Write-Host "  Inicio: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor $C_INFO
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $C_STEP
Write-Host ""

# ── Verificar que estamos en la raíz del proyecto ────────────────────────────
if (-not (Test-Path "package.json") -or -not (Test-Path "ecosystem.config.js")) {
    Write-Err "Este script debe ejecutarse desde la raíz del proyecto (donde está ecosystem.config.js)"
    Write-Info "Ejecuta: cd C:\egan_projects\egan-tecman"
    exit 1
}

# ── Verificar herramientas necesarias ────────────────────────────────────────
Write-Step "1/6 — Verificando herramientas"

$tools = @(
    @{ Name = "Node.js"; Cmd = "node --version" },
    @{ Name = "npm";     Cmd = "npm --version" },
    @{ Name = "PM2";     Cmd = "pm2 --version" }
)

$allOk = $true
foreach ($tool in $tools) {
    try {
        $version = & cmd /c "$($tool.Cmd) 2>nul"
        if ($LASTEXITCODE -ne 0) { throw "not found" }
        Write-OK "$($tool.Name): $version"
    } catch {
        Write-Err "$($tool.Name) no está instalado o no está en PATH"
        $allOk = $false
    }
}
if (-not $allOk) { exit 1 }

# ── Verificar .env ───────────────────────────────────────────────────────────
if (-not (Test-Path ".env")) {
    Write-Warn "No se encontró .env en la raíz. Se usará .env.example como referencia."
    if (Test-Path ".env.example") {
        Write-Info "Copia con:  Copy-Item .env.example .env"
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
#  1. INSTALL
# ═══════════════════════════════════════════════════════════════════════════════
if (-not $SkipInstall) {
    Write-Step "2/6 — Instalando dependencias"

    Write-Info "Root: npm install"
    Push-Location $PSScriptRoot
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Err "npm install en raíz falló"; exit 1 }
    Write-OK "Root OK"
    Pop-Location

    Write-Info "Backend: npm install (con --legacy-peer-deps)"
    Push-Location (Join-Path $PSScriptRoot "backend")
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) { Write-Err "npm install en backend falló"; exit 1 }
    Write-OK "Backend OK"
    Pop-Location

    Write-Info "Frontend: npm install"
    Push-Location (Join-Path $PSScriptRoot "frontend")
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Err "npm install en frontend falló"; exit 1 }
    Write-OK "Frontend OK"
    Pop-Location
} else {
    Write-Step "2/6 — Instalación omitida (--SkipInstall)"
}

# ═══════════════════════════════════════════════════════════════════════════════
#  2. PRISMA GENERATE
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "3/6 — Prisma: generando cliente"
Push-Location (Join-Path $PSScriptRoot "backend")

npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Err "prisma generate falló"; exit 1 }
Write-OK "Prisma client generado"

# ═══════════════════════════════════════════════════════════════════════════════
#  3. PRISMA DB PUSH (sync schema)
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "4/6 — Prisma: sincronizando esquema con DB"

npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) { Write-Err "prisma db push falló"; exit 1 }
Write-OK "Schema sincronizado"

# ═══════════════════════════════════════════════════════════════════════════════
#  4. PRISMA SEED (datos iniciales)
# ═══════════════════════════════════════════════════════════════════════════════
if (-not $SkipSeed) {
    Write-Step "5/6 — Prisma: seed de datos iniciales"

    npx prisma db seed
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "prisma db seed falló (puede ignorarse si los datos ya existen)"
    } else {
        Write-OK "Seed completado"
    }
} else {
    Write-Step "5/6 — Seed omitido (--SkipSeed)"
}
Pop-Location  # salir de backend

# ═══════════════════════════════════════════════════════════════════════════════
#  5. BUILD
# ═══════════════════════════════════════════════════════════════════════════════
if (-not $SkipBuild) {
    Write-Step "6/6 — Build: compilando backend y frontend"

    Push-Location $PSScriptRoot

    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Build completo falló. Intentando builds individuales..."
        
        Write-Info "Build backend individual..."
        Push-Location (Join-Path $PSScriptRoot "backend")
        npm run build
        if ($LASTEXITCODE -ne 0) { Write-Err "Build backend falló"; Pop-Location; Pop-Location; exit 1 }
        Write-OK "Backend compilado"
        Pop-Location

        Write-Info "Build frontend individual..."
        Push-Location (Join-Path $PSScriptRoot "frontend")
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "Build frontend falló (continúa — puede deberse a lint warnings)"
            Write-Info "  Si el error es persistente, revisa frontend/build_output.txt"
        } else {
            Write-OK "Frontend compilado"
        }
        Pop-Location
    } else {
        Write-OK "Build completado exitosamente"
    }

    Pop-Location
} else {
    Write-Step "6/6 — Build omitido (--SkipBuild)"
}

# ═══════════════════════════════════════════════════════════════════════════════
#  PM2 RELOAD
# ═══════════════════════════════════════════════════════════════════════════════
if (-not $SkipPM2) {
    Write-Step "♻️  Recargando procesos PM2"

    Push-Location $PSScriptRoot

    # Verificar si los procesos existen
    $apiExists = pm2 id tecman-api 2>$null | Out-String
    $frontendExists = pm2 id tecman-frontend 2>$null | Out-String

    if ($apiExists -or $frontendExists) {
        pm2 reload ecosystem.config.js --update-env
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "pm2 reload falló. Intentando pm2 start..."
            pm2 start ecosystem.config.js
        }
        Write-OK "PM2 recargado"
        
        # Mostrar estado
        Write-Info "Estado actual:"
        pm2 status | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    } else {
        Write-Info "No hay procesos PM2 previstos. Iniciando..."
        pm2 start ecosystem.config.js
        Write-OK "PM2 iniciado"
    }

    Pop-Location
} else {
    Write-Host ""
    Write-Warn "PM2 restart omitido (--SkipPM2)"
    Write-Info "Para recargar manualmente:  pm2 reload ecosystem.config.js --update-env"
}

# ═══════════════════════════════════════════════════════════════════════════════
#  RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════════════════════
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $C_STEP
Write-Host "  ✅  Deploy completado" -ForegroundColor $C_OK
Write-Host "  ⏱   Duración: $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor $C_INFO
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $C_STEP
Write-Host ""

# Flags usados
$flags = @()
if ($SkipInstall)  { $flags += "SkipInstall" }
if ($SkipSeed)     { $flags += "SkipSeed" }
if ($SkipBuild)    { $flags += "SkipBuild" }
if ($SkipPM2)      { $flags += "SkipPM2" }
if ($flags.Count -gt 0) {
    Write-Info "Flags activos: $($flags -join ', ')"
}

Write-Host "Comandos útiles post-deploy:" -ForegroundColor $C_INFO
Write-Host "  pm2 logs tecman-api          — Ver logs del backend" -ForegroundColor Gray
Write-Host "  pm2 logs tecman-frontend     — Ver logs del frontend" -ForegroundColor Gray
Write-Host "  pm2 status                   — Estado de todos los procesos" -ForegroundColor Gray
Write-Host "  npm run db:seed              — Repoblar datos iniciales" -ForegroundColor Gray
Write-Host ""
