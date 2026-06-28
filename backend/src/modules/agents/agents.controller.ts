import { Controller, Get, Res, NotFoundException, Header, Req, Query } from '@nestjs/common';
import { Response, Request } from 'express';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { DiscoveryService } from '../discovery/discovery.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

/**
 * Sanitiza un valor de hostname para prevenir header injection.
 * Solo permite caracteres alfanuméricos, puntos, guiones y dos puntos (para puertos).
 */
function sanitizeHost(host: string): string {
  return host.replace(/[^a-zA-Z0-9.\-:_[\]]/g, '');
}

@Controller('agents')
export class AgentsController {
  private readonly agentsDir = join(process.cwd(), '..', 'agent');
  private readonly nodeAgentDir = join(process.cwd(), '..', 'agent', 'node-agent');

  constructor(private readonly discoveryService: DiscoveryService) {}

  private getServerUrl(req: Request): string {
    if (process.env.PRODUCTION_URL) return process.env.PRODUCTION_URL;
    const protocol =
      typeof req.headers['x-forwarded-proto'] === 'string'
        ? sanitizeHost(req.headers['x-forwarded-proto'])
        : 'http';
    const rawHost =
      typeof req.headers['x-forwarded-host'] === 'string'
        ? req.headers['x-forwarded-host']
        : typeof req.headers.host === 'string'
          ? req.headers.host
          : `localhost:${process.env.PORT || '2023'}`;
    return `${protocol}://${sanitizeHost(rawHost)}`;
  }

  @Public()
  @Get('powershell')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Cache-Control', 'no-cache')
  async getPowerShell(@Req() req: Request, @Query('apiKey') apiKey: string, @Res() res: Response) {
    const filePath = join(this.agentsDir, 'tecman-discovery.ps1');
    if (!existsSync(filePath)) {
      throw new NotFoundException('Agente PowerShell no disponible');
    }

    let content = readFileSync(filePath, 'utf-8');

    const serverUrl = this.getServerUrl(req);
    content = content.replace('SERVER_PLACEHOLDER', serverUrl);

    const key = apiKey || (await this.discoveryService.getApiKey()) || '';
    if (key) {
      content = content.replace('# API_KEY_PLACEHOLDER', `$script:ApiKey = "${key}"`);
    }

    return res.send(content);
  }

  @Public()
  @Get('powershell/run')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Cache-Control', 'no-cache')
  async getPowerShellRun(@Req() req: Request, @Query('apiKey') apiKey: string) {
    const filePath = join(this.agentsDir, 'tecman-discovery.ps1');
    if (!existsSync(filePath)) {
      throw new NotFoundException('Agente PowerShell no disponible');
    }

    let content = readFileSync(filePath, 'utf-8');

    const serverUrl = this.getServerUrl(req);
    const key = apiKey || (await this.discoveryService.getApiKey()) || '';

    // Strip the comment block (<# ... #>) and param() block
    // so Invoke-Expression can execute it as inline code
    content = content.replace(/<#[\s\S]*?#>\s*/m, '');
    content = content.replace(/\bparam\s*\([^)]*\)\s*/m, '');

    // Inject variables at the top (replacing param defaults)
    const preamble = `$script:ServerUrl = "${serverUrl}"\n$script:ApiKey = "${key}"\n`;
    content = preamble + content;

    // Also replace any remaining placeholders
    content = content.replace('SERVER_PLACEHOLDER', serverUrl);
    content = content.replace('# API_KEY_PLACEHOLDER', '');

    return content;
  }

  @Public()
  @Get('powershell/install.bat')
  async getPowerShellBatch(@Req() req: Request, @Query('apiKey') apiKey: string, @Res() res: Response) {
    const batchPath = join(this.agentsDir, 'install-agent.bat');
    if (!existsSync(batchPath)) {
      throw new NotFoundException('Instalador batch no disponible');
    }

    // Construir la URL base del servidor desde el request — SANITIZADO
    const protocol =
      typeof req.headers['x-forwarded-proto'] === 'string'
        ? sanitizeHost(req.headers['x-forwarded-proto'])
        : 'http';
    const rawHost =
      typeof req.headers['x-forwarded-host'] === 'string'
        ? req.headers['x-forwarded-host']
        : typeof req.headers.host === 'string'
          ? req.headers.host
          : `localhost:${process.env.PORT || '2023'}`;
    const host = sanitizeHost(rawHost);
    const baseUrl = `${protocol}://${host}`;

    // Obtener API Key
    const key = apiKey || (await this.discoveryService.getApiKey()) || '';

    let content = readFileSync(batchPath, 'utf-8');
    // Reemplazar placeholders
    content = content.replace('SERVER_PLACEHOLDER', baseUrl);
    content = content.replace('API_KEY_PLACEHOLDER', key);

    res.setHeader('Content-Type', 'application/x-msdos-program');
    res.setHeader('Content-Disposition', 'attachment; filename="tecman-install.bat"');
    return res.send(content);
  }

  @Public()
  @Get('powershell/unattended.bat')
  async getUnattendedBatch(@Req() req: Request, @Query('apiKey') apiKey: string, @Res() res: Response) {
    const batchPath = join(this.agentsDir, 'tecman-discovery-unattended.bat');
    if (!existsSync(batchPath)) {
      throw new NotFoundException('Instalador unattended no disponible');
    }

    const protocol =
      typeof req.headers['x-forwarded-proto'] === 'string'
        ? sanitizeHost(req.headers['x-forwarded-proto'])
        : 'http';
    const rawHost =
      typeof req.headers['x-forwarded-host'] === 'string'
        ? req.headers['x-forwarded-host']
        : typeof req.headers.host === 'string'
          ? req.headers.host
          : `localhost:${process.env.PORT || '2023'}`;
    const host = sanitizeHost(rawHost);
    const baseUrl = `${protocol}://${host}`;

    const key = apiKey || (await this.discoveryService.getApiKey()) || '';

    let content = readFileSync(batchPath, 'utf-8');
    content = content.replace('SERVER_PLACEHOLDER', baseUrl);
    content = content.replace('API_KEY_PLACEHOLDER', key);

    res.setHeader('Content-Type', 'application/x-msdos-program');
    res.setHeader('Content-Disposition', 'attachment; filename="tecman-discovery-unattended.bat"');
    return res.send(content);
  }

  @Public()
  @Get('powershell/manual.bat')
  async getManualBatch(@Req() req: Request, @Query('apiKey') apiKey: string, @Res() res: Response) {
    const batchPath = join(this.agentsDir, 'tecman-discovery-manual.bat');
    if (!existsSync(batchPath)) {
      throw new NotFoundException('Instalador manual no disponible');
    }

    const protocol =
      typeof req.headers['x-forwarded-proto'] === 'string'
        ? sanitizeHost(req.headers['x-forwarded-proto'])
        : 'http';
    const rawHost =
      typeof req.headers['x-forwarded-host'] === 'string'
        ? req.headers['x-forwarded-host']
        : typeof req.headers.host === 'string'
          ? req.headers.host
          : `localhost:${process.env.PORT || '2023'}`;
    const host = sanitizeHost(rawHost);
    const baseUrl = `${protocol}://${host}`;

    const key = apiKey || (await this.discoveryService.getApiKey()) || '';

    let content = readFileSync(batchPath, 'utf-8');
    content = content.replace('SERVER_PLACEHOLDER', baseUrl);
    content = content.replace('API_KEY_PLACEHOLDER', key);

    res.setHeader('Content-Type', 'application/x-msdos-program');
    res.setHeader('Content-Disposition', 'attachment; filename="tecman-discovery-manual.bat"');
    return res.send(content);
  }

  @Public()
  @Get('go')
  async getGo(@Req() req: Request, @Query('apiKey') apiKey: string, @Res() res: Response) {
    const exePath = join(this.agentsDir, 'tecman-discovery.exe');
    const srcPath = join(this.agentsDir, 'main.go');

    if (existsSync(exePath)) {
      // Generar .bat wrapper con flags correctos
      const serverUrl = this.getServerUrl(req);
      const key = apiKey || (await this.discoveryService.getApiKey()) || '';
      const bat = [
        '@echo off',
        'title TecMan Discovery Agent - Instalador',
        'echo.',
        'echo  ============================================',
        'echo     TecMan Discovery Agent',
        'echo     Instalador con configuracion automatica',
        'echo  ============================================',
        'echo.',
        `echo  Servidor: ${serverUrl}`,
        'echo.',
        'echo [1/3] Verificando permisos de administrador...',
        'net session >nul 2>&1',
        'if %errorlevel% neq 0 (',
        '    echo Solicitando permisos de administrador...',
        '    powershell -Command "Start-Process cmd -ArgumentList \'/c \\"\\"%~f0\\"\\"" -Verb RunAs"',
        '    exit /b',
        ')',
        'echo [OK] Permisos de administrador',
        'echo.',
        'echo [2/3] Instalando servicio como Windows Service...',
        `"%~dp0tecman-discovery.exe" --server "${serverUrl}"${key ? ` --api-key "${key}"` : ''} --install`,
        'if %errorlevel% neq 0 (',
        '    echo.',
        '    echo [ERROR] Fallo la instalacion del servicio.',
        '    pause',
        '    exit /b 1',
        ')',
        'echo.',
        'echo [3/3] Iniciando servicio...',
        'net start TecManAgent 2>nul',
        'if %errorlevel% neq 0 (',
        '    "%~dp0tecman-discovery.exe" --start 2>nul',
        ')',
        'echo.',
        'echo  ============================================',
        'echo  INSTALACION COMPLETADA',
        'echo  ============================================',
        'echo.',
        `echo  Servidor: ${serverUrl}`,
        'echo  Servicio: TecManAgent',
        'echo  Estado: Ejecutando',
        'echo.',
        'echo  El equipo sera inventorado automaticamente.',
        'echo.',
        'pause',
      ].join('\r\n');
      res.setHeader('Content-Type', 'application/x-msdos-program');
      res.setHeader('Content-Disposition', 'attachment; filename="tecman-install.bat"');
      return res.send(bat);
    }

    if (existsSync(srcPath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="main.go"');
      return res.sendFile(srcPath);
    }

    throw new NotFoundException('Agente Go no disponible');
  }

  @Public()
  @Get('go/source')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  getGoSource() {
    const srcPath = join(this.agentsDir, 'main.go');
    if (!existsSync(srcPath)) {
      throw new NotFoundException('Código fuente Go no disponible');
    }
    return readFileSync(srcPath, 'utf-8');
  }

  @Public()
  @Get('node')
  async getNodeAgent(@Req() req: Request, @Query('apiKey') apiKey: string, @Res() res: Response) {
    const jsPath = join(this.nodeAgentDir, 'index.js');
    if (!existsSync(jsPath)) {
      throw new NotFoundException('Agente Node.js no disponible');
    }

    let content = readFileSync(jsPath, 'utf-8');

    const serverUrl = this.getServerUrl(req);
    const key = apiKey || (await this.discoveryService.getApiKey()) || '';

    // Generar script de instalación
    const installScript = `
# TecMan Discovery Agent - Instalador Node.js
# Ejecutar como administrador en PowerShell

$ErrorActionPreference = "Stop"

Write-Host "TecMan Discovery Agent - Instalador Node.js" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js no esta instalado" -ForegroundColor Red
    Write-Host "Instalar desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Crear directorio de instalación
$installDir = "$env:ProgramFiles\\TecMan\\Agent"
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# Descargar agente
Write-Host "Descargando agente..." -ForegroundColor Gray
$agentUrl = "${serverUrl}/api/agents/node/download"
$agentPath = Join-Path $installDir "tecman-discovery.js"
Invoke-WebRequest -Uri $agentUrl -OutFile $agentPath

# Guardar configuración
$config = @{
    serverUrl = "${serverUrl}"
    apiKey = "${key}"
} | ConvertTo-Json
$config | Set-Content -Path (Join-Path $installDir "config.json")

# Instalar como servicio con PM2
Write-Host "Instalando servicio..." -ForegroundColor Gray
npm install -g pm2
pm2 start $agentPath --name tecman-discovery
pm2 save
pm2 startup

Write-Host ""
Write-Host "[OK] Instalacion completada" -ForegroundColor Green
Write-Host "Servidor: ${serverUrl}" -ForegroundColor Gray
`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="install-tekman-node.ps1"');
    return res.send(installScript);
  }

  @Public()
  @Get('node/download')
  getNodeAgentDownload(@Res() res: Response) {
    const jsPath = join(this.nodeAgentDir, 'index.js');
    if (!existsSync(jsPath)) {
      throw new NotFoundException('Agente Node.js no disponible');
    }

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Content-Disposition', 'attachment; filename="tecman-discovery.js"');
    return res.sendFile(jsPath);
  }

  @Public()
  @Get('info')
  async info(@Req() req: Request) {
    const apiKey = await this.discoveryService.getApiKey();

    const protocol =
      typeof req.headers['x-forwarded-proto'] === 'string'
        ? sanitizeHost(req.headers['x-forwarded-proto'])
        : 'http';
    const rawHost =
      typeof req.headers['x-forwarded-host'] === 'string'
        ? req.headers['x-forwarded-host']
        : typeof req.headers.host === 'string'
          ? req.headers.host
          : `localhost:${process.env.PORT || '2023'}`;
    const host = sanitizeHost(rawHost);
    const serverUrl = process.env.PRODUCTION_URL || `${protocol}://${host}`;

    return {
      hasApiKeyConfigured: !!apiKey,
      serverUrl,
      go: {
        name: 'TecMan Discovery Agent (Go)',
        description: 'Agente multiplataforma para reporte de hardware',
        os: ['Windows', 'Linux', 'macOS'],
        install: 'go build -o tecman-discovery.exe main.go',
        config: 'tecman-discovery-config.json',
        usage: `.\\tecman-discovery.exe -install -server ${serverUrl} --api-key "${apiKey || '<api-key>'}"`,
      },
      powershell: {
        name: 'TecMan Discovery Agent (PowerShell)',
        description: 'Agente nativo para Windows (recomendado)',
        os: ['Windows'],
        install: 'Ejecutar como administrador:',
        usage: `.\\tecman-discovery.ps1 -ServerUrl "${serverUrl}" -ApiKey "${apiKey || '<api-key>'}" -InstallTask`,
        features: [
          'Recopila serial number (BIOS)',
          'Tarea programada automática',
          'Inventario detallado de RAM/Discos',
          'Ejecución remota sin descargar archivo',
          'Autenticación por API Key',
        ],
      },
      nodejs: {
        name: 'TecMan Discovery Agent (Node.js)',
        description: 'Agente alternativo con menor detección antivirus',
        os: ['Windows'],
        install: 'Ejecutar instalador PowerShell:',
        usage: `irm "${serverUrl}/api/agents/node?apiKey=${apiKey || '<api-key>'}" | iex`,
        features: [
          'Menor detección antivirus que .bat/.ps1',
          'Ejecutable standalone sin dependencias',
          'Compatible con PM2 para gestión de servicios',
          'Misma funcionalidad que versiones anteriores',
        ],
      },
    };
  }
}
