import { Controller, Get, Param, Query, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('fix-scripts')
@Controller('fix-scripts')
export class FixScriptsController {
  private readonly scriptsDir = join(process.cwd(), '..', 'agent', 'fix-scripts');
  private readonly nodeScriptsDir = join(process.cwd(), '..', 'agent', 'node-agent', 'dist-fixes');

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar scripts de solucion disponibles' })
  listScripts() {
    const scripts = [];

    // Escanear scripts .bat (legacy)
    if (existsSync(this.scriptsDir)) {
      const batFiles = readdirSync(this.scriptsDir).filter((f) => f.endsWith('.bat'));
      for (const f of batFiles) {
        scripts.push({
          id: f.replace('.bat', ''),
          name: f,
          label: this.getLabel(f),
          description: this.getDescription(f),
          format: 'bat',
        });
      }
    }

    // Escanear scripts .js (Node.js)
    if (existsSync(this.nodeScriptsDir)) {
      const jsFiles = readdirSync(this.nodeScriptsDir).filter((f) => f.endsWith('.js'));
      for (const f of jsFiles) {
        const id = f.replace('.js', '');
        // Evitar duplicados si ya existe .bat
        if (!scripts.find((s) => s.id === id)) {
          scripts.push({
            id,
            name: f,
            label: this.getLabel(id),
            description: this.getDescription(id),
            format: 'js',
          });
        }
      }
    }

    return { scripts };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Descargar script de solucion' })
  downloadScript(
    @Param('id') id: string,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    // Priorizar .js si se solicita o si existe
    const jsPath = join(this.nodeScriptsDir, `${id}.js`);
    const batPath = join(this.scriptsDir, `${id}.bat`);

    if (format === 'js' && existsSync(jsPath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Content-Disposition', `attachment; filename="${id}.js"`);
      res.sendFile(jsPath);
      return;
    }

    if (existsSync(jsPath)) {
      // Por defecto, servir .js si existe (menor detección antivirus)
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Content-Disposition', `attachment; filename="${id}.js"`);
      res.sendFile(jsPath);
      return;
    }

    if (existsSync(batPath)) {
      // Fallback a .bat si no existe .js
      res.setHeader('Content-Type', 'application/x-msdos-program');
      res.setHeader('Content-Disposition', `attachment; filename="${id}.bat"`);
      res.sendFile(batPath);
      return;
    }

    throw new NotFoundException(`Script ${id} no encontrado`);
  }

  @Public()
  @Get(':id/run')
  @ApiOperation({ summary: 'Obtener script como comando PowerShell para ejecucion directa' })
  getRunCommand(@Param('id') id: string) {
    const jsPath = join(this.nodeScriptsDir, `${id}.js`);
    const batPath = join(this.scriptsDir, `${id}.bat`);

    if (existsSync(jsPath)) {
      // Para Node.js: descargar y ejecutar con bypass
      return {
        command: `powershell -ExecutionPolicy Bypass -Command "irm '${this.getDownloadUrl(id)}' -OutFile '$env:TEMP\\${id}.js'; node '$env:TEMP\\${id}.js'"`,
        format: 'node',
        note: 'Requiere Node.js instalado',
      };
    }

    if (existsSync(batPath)) {
      // Para .bat: descargar y ejecutar
      return {
        command: `powershell -ExecutionPolicy Bypass -Command "irm '${this.getDownloadUrl(id)}' -OutFile '$env:TEMP\\${id}.bat'; Start-Process '$env:TEMP\\${id}.bat' -Verb RunAs"`,
        format: 'bat',
        note: 'Ejecuta como administrador',
      };
    }

    throw new NotFoundException(`Script ${id} no encontrado`);
  }

  private getDownloadUrl(id: string): string {
    // En producción, usar la URL del servidor
    return `/api/fix-scripts/${id}`;
  }

  private getLabel(filename: string): string {
    const labels: Record<string, string> = {
      'fix-network-dns': 'Sin Internet / DNS',
      'fix-printer': 'Impresora No Imprime',
      'fix-slow-pc': 'Equipo Lento',
      'install-anydesk': 'Instalar AnyDesk',
      'install-rustdesk': 'Instalar RustDesk',
      'fix-browser-cache': 'Limpiar Cache Navegador',
      'fix-outlook': 'Problemas con Outlook',
      'fix-black-screen': 'Pantalla Negra',
      'fix-windows-update': 'Windows Update Trabado',
      'fix-wifi': 'WiFi No Conecta',
      'fix-bsod-diag': 'Diagnostico BSOD',
      'install-tools-winget': 'Instalar Herramientas',
      'fix-vpn': 'Solucion VPN',
      'fix-repair-windows': 'Reparacion Completa',
    };
    return labels[filename] || filename;
  }

  private getDescription(filename: string): string {
    const descriptions: Record<string, string> = {
      'fix-network-dns': 'Renueva IP, limpia DNS y resetea Winsock',
      'fix-printer': 'Reinicia spooler y vacia cola de impresion',
      'fix-slow-pc': 'Limpia temporales, cache y optimiza disco',
      'install-anydesk': 'Instala AnyDesk para soporte remoto',
      'install-rustdesk': 'Instala RustDesk (alternativa open source)',
      'fix-browser-cache': 'Limpia cache de Chrome, Edge y Firefox',
      'fix-outlook': 'Reinicia Outlook y limpia archivos temporales',
      'fix-black-screen': 'Reinicia explorer y verifica graficos',
      'fix-windows-update': 'Reinicia servicios de actualizacion',
      'fix-wifi': 'Reinicia adaptador WiFi y renueva IP',
      'fix-bsod-diag': 'Diagnostica pantallazos azules',
      'install-tools-winget': 'Instala herramientas esenciales',
      'fix-vpn': 'Reconfigura conexion VPN',
      'fix-repair-windows': 'Reparacion completa del sistema',
    };
    return descriptions[filename] || '';
  }
}
