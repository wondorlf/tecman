<#
.SYNOPSIS
    TecMan Discovery Agent - PowerShell Script
.DESCRIPTION
    Recopila información de hardware del equipo Windows y la envía al servidor TecMan.
    Puede ejecutarse como tarea programada o manualmente.
.PARAMETER ServerUrl
    URL del servidor TecMan (ej: http://192.168.1.100:3001)
.PARAMETER ApiKey
    API Key para autenticarse con el servidor TecMan
.PARAMETER IntervalHours
    Intervalo en horas para ejecución continua (0 = ejecución única)
.PARAMETER InstallTask
    Instala como tarea programada de Windows
.PARAMETER UninstallTask
    Desinstala la tarea programada
.EXAMPLE
    .\tecman-discovery.ps1 -ServerUrl "http://192.168.1.100:3001" -ApiKey "tu-api-key"
.EXAMPLE
    .\tecman-discovery.ps1 -ServerUrl "http://192.168.1.100:3001" -InstallTask
.EXAMPLE
    .\tecman-discovery.ps1 -UninstallTask
#>

param(
    [string]$ServerUrl = "SERVER_PLACEHOLDER",
    [string]$ApiKey = "",
    [int]$IntervalHours = 0,
    [switch]$InstallTask,
    [switch]$UninstallTask
)

# API_KEY_PLACEHOLDER

# Fallback when running via Invoke-Expression ($PSScriptRoot is empty)
if (-not $PSScriptRoot) { $PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $PSScriptRoot) { $PSScriptRoot = $PWD.Path }
$script:ConfigPath = Join-Path $PSScriptRoot "tecman-discovery-config.json"

# ── Config ────────────────────────────────────────────────────────────────────
function LoadConfig {
    if (Test-Path $ConfigPath) {
        return Get-Content $ConfigPath -Raw | ConvertFrom-Json
    }
    return $null
}

function SaveConfig($config) {
    $config | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath -Encoding UTF8
}

# ── Hardware Collection ───────────────────────────────────────────────────────
function Get-HardwareInfo {
    Write-Host "[TecMan] Recopilando información detallada del sistema..." -ForegroundColor Cyan

    # ── MAC y IP ─────────────────────────────────────────────────────────────
    $mac = (Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | Select-Object -First 1).MacAddress
    if (-not $mac) { $mac = "UNKNOWN_MAC" }

    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.PrefixOrigin -ne "WellKnown" } | Select-Object -First 1).IPAddress
    if (-not $ip) { $ip = "" }

    # ── Computer System (fabricante, modelo, dominio) ──────────────────────────
    $cs = Get-CimInstance Win32_ComputerSystem
    $os  = Get-CimInstance Win32_OperatingSystem
    $bios = Get-CimInstance Win32_BIOS | Select-Object -First 1

    $manufacturer = $cs.Manufacturer
    $modelPc      = $cs.Model
    $serialNum    = $bios.SerialNumber
    $biosVer      = $bios.SMBIOSBIOSVersion
    $domainName   = $cs.Domain
    $loggedUser   = "$($cs.UserName)"
    if ($loggedUser -eq "") { $loggedUser = $null }

    # ── CPU ────────────────────────────────────────────────────────────────────
    $cpu   = Get-CimInstance Win32_Processor | Select-Object -First 1
    $cpuModel = $cpu.Name -replace '\s+', ' '
    $cpuCores = $cpu.NumberOfCores

    # ── RAM (módulos físicos) ──────────────────────────────────────────────────
    $ramModules = Get-CimInstance Win32_PhysicalMemory
    $ramTotalBytes = ($ramModules | Measure-Object -Property Capacity -Sum).Sum
    $ramSlotsTotal  = ($ramModules | Measure-Object).Count
    $ramSlotsUsed   = ($ramModules | Where-Object { $_.Capacity -gt 0 } | Measure-Object).Count
    
    # Tipo de RAM (tomamos el del primer módulo)
    $firstModule = $ramModules | Select-Object -First 1
    $ramType = if ($firstModule) {
        switch ($firstModule.SMBIOSMemoryType) {
            20 { "DDR" }
            21 { "DDR2" }
            24 { "DDR3" }
            26 { "DDR4" }
            27 { "DDR5" }
            30 { "LPDDR" }
            31 { "LPDDR2" }
            32 { "LPDDR3" }
            34 { "LPDDR5" }
            default { "Tipo $($firstModule.SMBIOSMemoryType)" }
        }
    } else { $null }
    
    $ramSpeed = if ($firstModule) { "$($firstModule.Speed) MHz" } else { $null }

    # ── Discos fijos físicos (tipo: SSD/HDD/NVMe) ─────────────────────────────
    $physDisks = Get-CimInstance Win32_DiskDrive
    $diskTypes = @()
    $diskTotalBytes = 0
    $diskFreeBytes  = 0

    # Volúmenes/particiones
    $volumesList = @()
    $logicalDisks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"

    foreach ($ld in $logicalDisks) {
        $total = [uint64]$ld.Size
        $free  = [uint64]$ld.FreeSpace
        $used  = $total - $free
        $diskTotalBytes += $total
        $diskFreeBytes  += $free

        $volumesList += @{
            deviceId = $ld.DeviceID
            label    = $ld.VolumeName
            fileSystem = $ld.FileSystem
            totalBytes  = $total
            usedBytes   = $used
            freeBytes   = $free
        }
    }

    # Determinar tipo de disco (SSD/HDD/NVMe) a partir de los discos físicos
    foreach ($pd in $physDisks) {
        $mediaType = if ($pd.MediaType -eq 11 -or $pd.MediaType -eq 12) {
            "SSD"  # 11=Fixed, 12=SSD
        } elseif ($pd.InterfaceType -eq "IDE" -or $pd.MediaType -eq 3) {
            "HDD"
        } else {
            "HDD"
        }
        # Mejor detección por descripción
        $desc = ($pd.Model + " " + $pd.Caption + " " + $pd.InterfaceType).ToLower()
        if ($desc -match "nvme" -or $desc -match "m\.2") { $mediaType = "NVMe" }
        elseif ($desc -match "ssd" -or $desc -match "solid.state") { $mediaType = "SSD" }
        
        if ($mediaType -and ($diskTypes -notcontains $mediaType)) {
            $diskTypes += $mediaType
        }
    }
    $diskType = if ($diskTypes.Count -gt 0) { $diskTypes -join "+" } else { $null }

    $payload = @{
        # Identificación
        hostname       = $env:COMPUTERNAME
        macAddress     = $mac
        ipAddress      = $ip
        os             = "$($os.Caption) $($os.Version) (Build $($os.BuildNumber))"
        agentVersion   = "ps-1.0.0"
        
        # Fabricante
        manufacturer   = $manufacturer
        model          = $modelPc
        serialNumber   = $serialNum
        biosVersion    = $biosVer
        
        # CPU
        cpuModel       = $cpuModel
        cpuCores       = [int]$cpuCores
        
        # RAM
        ramTotalBytes  = [uint64]$ramTotalBytes
        ramType        = $ramType
        ramSlots       = [int]$ramSlotsTotal
        ramSlotsUsed   = [int]$ramSlotsUsed
        ramSpeed       = $ramSpeed
        
        # Disco
        diskTotalBytes = [uint64]$diskTotalBytes
        diskUsedBytes  = [uint64]($diskTotalBytes - $diskFreeBytes)
        diskFreeBytes  = [uint64]$diskFreeBytes
        diskType       = $diskType
        volumes        = $volumesList
        
        # Red y dominio
        domain         = $domainName
        loggedUser     = $loggedUser
        
        # Tiempos
        lastBoot       = $os.LastBootUpTime.ToString("yyyy-MM-ddTHH:mm:ssZ")
    }

    return $payload
}

# ── Send to Server ────────────────────────────────────────────────────────────
function Send-HardwareData($config, $payload) {
    $endpoint = "$($config.ServerUrl.TrimEnd('/'))/api/discovery/agent"

    Write-Host "[TecMan] Enviando datos a: $endpoint" -ForegroundColor Cyan
    Write-Host "[TecMan] Hostname: $($payload.hostname)" -ForegroundColor Gray
    Write-Host "[TecMan] MAC: $($payload.macAddress)" -ForegroundColor Gray
    Write-Host "[TecMan] IP: $($payload.ipAddress)" -ForegroundColor Gray
    Write-Host "[TecMan] OS: $($payload.os)" -ForegroundColor Gray
    Write-Host "[TecMan] CPU: $($payload.cpuCores) cores" -ForegroundColor Gray
    Write-Host "[TecMan] RAM: $([math]::Round($payload.ramTotalBytes / 1GB, 2)) GB" -ForegroundColor Gray
    Write-Host "[TecMan] Disco: $([math]::Round($payload.diskTotalBytes / 1GB, 2)) GB" -ForegroundColor Gray

    # Usar API Key del parámetro o del config guardado
    $apiKey = $ApiKey
    if (-not $apiKey -and $config.ApiKey) {
        $apiKey = $config.ApiKey
    }

    $headers = @{
        "Content-Type" = "application/json"
    }
    if ($apiKey) {
        $headers["X-API-Key"] = $apiKey
        Write-Host "[TecMan] 🔑 Autenticando con API Key" -ForegroundColor Gray
    }

    try {
        $json = $payload | ConvertTo-Json -Depth 10
        $response = Invoke-RestMethod -Uri $endpoint -Method Post -Body $json -Headers $headers -TimeoutSec 10
        Write-Host "[TecMan] ✅ Datos enviados exitosamente" -ForegroundColor Green
        return $true
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "[TecMan] ❌ Error de autenticación: API Key inválida. Verifica la configuración en /admin" -ForegroundColor Red
        } else {
            Write-Host "[TecMan] ❌ Error al enviar: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
}

# ── Run Once ──────────────────────────────────────────────────────────────────
function Run-Once($config) {
    $payload = Get-HardwareInfo
    Send-HardwareData $config $payload
}

# ── Run Continuous ────────────────────────────────────────────────────────────
function Run-Continuous($config, $intervalHours) {
    Write-Host "[TecMan] Modo continuo: cada $intervalHours hora(s)" -ForegroundColor Yellow
    while ($true) {
        Run-Once $config
        Write-Host "[TecMan] Próxima ejecución en $intervalHours hora(s)... (Ctrl+C para detener)" -ForegroundColor Yellow
        Start-Sleep -Seconds ($intervalHours * 3600)
    }
}

# ── Task Scheduler ────────────────────────────────────────────────────────────
function Install-ScheduledTask($config) {
    $taskName = "TecManDiscoveryAgent"
    $scriptPath = $MyInvocation.MyCommand.Path
    $apiKeyArg = if ($config.ApiKey) { " -ApiKey `"$($config.ApiKey)`"" } else { "" }
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -ServerUrl `"$($config.ServerUrl)`"$apiKeyArg"
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

    try {
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
        Write-Host "[TecMan] ✅ Tarea programada '$taskName' instalada correctamente" -ForegroundColor Green
        Write-Host "[TecMan] Se ejecutará cada vez que inicies sesión" -ForegroundColor Gray
        return $true
    }
    catch {
        Write-Host "[TecMan] ❌ Error al instalar la tarea: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "[TecMan] Ejecuta PowerShell como Administrador" -ForegroundColor Yellow
        return $false
    }
}

function Uninstall-ScheduledTask {
    $taskName = "TecManDiscoveryAgent"
    try {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "[TecMan] ✅ Tarea programada '$taskName' desinstalada" -ForegroundColor Green
    }
    catch {
        Write-Host "[TecMan] La tarea no existe o no se pudo desinstalar" -ForegroundColor Yellow
    }
}

# ── Main ──────────────────────────────────────────────────────────────────────
Write-Host @"

  ╔══════════════════════════════════════════╗
  ║     TecMan Discovery Agent (PowerShell)  ║
  ║     Sistema de Gestión de Activos        ║
  ╚══════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Handle uninstall
if ($UninstallTask) {
    Uninstall-ScheduledTask
    exit 0
}

# Handle install
if ($InstallTask) {
    if (-not $ServerUrl) {
        Write-Host "[TecMan] ⚠️ Debes proporcionar -ServerUrl" -ForegroundColor Yellow
        Write-Host "Ejemplo: .\tecman-discovery.ps1 -ServerUrl http://192.168.1.100:3001 -InstallTask" -ForegroundColor White
        exit 1
    }
    $config = @{ ServerUrl = $ServerUrl; ApiKey = $ApiKey }
    SaveConfig $config
    Install-ScheduledTask $config
    Write-Host "[TecMan] Ejecutando envío inicial..." -ForegroundColor Cyan
    Run-Once $config
    exit 0
}

# ── Determine config (parameter overrides saved file) ─────────────────────
$config = $null

# If -ServerUrl provided via parameter, always use it (and update saved config)
if ($ServerUrl) {
    $config = @{ ServerUrl = $ServerUrl.TrimEnd('/'); ApiKey = $ApiKey }
    SaveConfig $config
    Write-Host "[TecMan] Usando URL: $($config.ServerUrl)" -ForegroundColor Cyan
}
else {
    # Try loading from saved config file
    $config = LoadConfig
    if (-not $config) {
        Write-Host @"
❌ No se encontró configuración.
    
OPCIÓN 1: Ejecutar con URL del servidor:
    .\tecman-discovery.ps1 -ServerUrl "http://192.168.1.100:3001"

OPCIÓN 2: Instalar como tarea programada (requiere Admin):
    .\tecman-discovery.ps1 -ServerUrl "http://192.168.1.100:3001" -InstallTask

OPCIÓN 3: Desinstalar tarea programada:
    .\tecman-discovery.ps1 -UninstallTask

"@ -ForegroundColor Yellow
        exit 1
    }
    Write-Host "[TecMan] Usando configuración guardada: $($config.ServerUrl)" -ForegroundColor Cyan
    
    # Usar ApiKey del config si no se pasó como parámetro
    if (-not $ApiKey -and $config.ApiKey) {
        $script:ApiKey = $config.ApiKey
    }
}

# Run
if ($IntervalHours -gt 0) {
    Run-Continuous $config $IntervalHours
} else {
    Run-Once $config
}
