import { Controller, Get, Res, NotFoundException, Header, Req, Query } from '@nestjs/common';
import { Response, Request } from 'express';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { DiscoveryService } from '../discovery/discovery.service.js';

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

  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('powershell')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Cache-Control', 'no-cache')
  async getPowerShell(@Req() req: Request, @Query('apiKey') apiKey: string, @Res() res: Response) {
    const filePath = join(this.agentsDir, 'tecman-discovery.ps1');
    if (!existsSync(filePath)) {
      throw new NotFoundException('Agente PowerShell no disponible');
    }
    
    let content = readFileSync(filePath, 'utf-8');
    
    // Injectar la API Key si se proporciona o si existe en Tenant
    const key = apiKey || (await this.discoveryService.getApiKey()) || '';
    if (key) {
      content = content.replace('# API_KEY_PLACEHOLDER', `$script:ApiKey = "${key}"`);
    }
    
    return res.send(content);
  }

  @Get('powershell/run')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Cache-Control', 'no-cache')
  async getPowerShellRun(@Query('apiKey') apiKey: string) {
    const filePath = join(this.agentsDir, 'tecman-discovery.ps1');
    if (!existsSync(filePath)) {
      throw new NotFoundException('Agente PowerShell no disponible');
    }
    
    let content = readFileSync(filePath, 'utf-8');
    
    // Injectar la API Key si se proporciona
    const key = apiKey || (await this.discoveryService.getApiKey()) || '';
    if (key) {
      content = content.replace('# API_KEY_PLACEHOLDER', `$script:ApiKey = "${key}"`);
    }
    
    return content;
  }

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

  @Get('go')
  async getGo(@Res() res: Response) {
    const exePath = join(this.agentsDir, 'tecman-discovery.exe');
    const srcPath = join(this.agentsDir, 'main.go');

    if (existsSync(exePath)) {
      return res.download(exePath, 'tecman-discovery.exe');
    }

    if (existsSync(srcPath)) {
      return res.download(srcPath, 'tecman-discovery.go');
    }

    throw new NotFoundException('Agente Go no disponible');
  }

  @Get('go/source')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  getGoSource() {
    const srcPath = join(this.agentsDir, 'main.go');
    if (!existsSync(srcPath)) {
      throw new NotFoundException('Código fuente Go no disponible');
    }
    return readFileSync(srcPath, 'utf-8');
  }

  @Get('info')
  async info() {
    const apiKey = await this.discoveryService.getApiKey();
    return {
      hasApiKeyConfigured: !!apiKey,
      go: {
        name: 'TecMan Discovery Agent (Go)',
        description: 'Agente multiplataforma para reporte de hardware',
        os: ['Windows', 'Linux', 'macOS'],
        install: 'go build -o tecman-discovery.exe main.go',
        config: 'tecman-discovery-config.json',
        usage: '.\\tecman-discovery.exe -install -server http://<tu-servidor>:3001 --api-key "<tu-api-key>"',
      },
      powershell: {
        name: 'TecMan Discovery Agent (PowerShell)',
        description: 'Agente nativo para Windows (recomendado)',
        os: ['Windows'],
        install: 'Ejecutar como administrador:',
        usage: '.\\tecman-discovery.ps1 -ServerUrl "http://<tu-servidor>:3001" -ApiKey "<tu-api-key>" -InstallTask',
        features: [
          'Recopila serial number (BIOS)',
          'Tarea programada automática',
          'Inventario detallado de RAM/Discos',
          'Ejecución remota sin descargar archivo',
          'Autenticación por API Key',
        ],
      },
    };
  }
}
