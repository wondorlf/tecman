import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('fix-scripts')
@Controller('fix-scripts')
export class FixScriptsController {
  private readonly scriptsDir = join(process.cwd(), '..', 'agent', 'fix-scripts');

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar scripts de solucion disponibles' })
  listScripts() {
    if (!existsSync(this.scriptsDir)) {
      return { scripts: [] };
    }
    const files = readdirSync(this.scriptsDir).filter((f) => f.endsWith('.bat'));
    const scripts = files.map((f) => ({
      id: f.replace('.bat', ''),
      name: f,
      label: this.getLabel(f),
      description: this.getDescription(f),
    }));
    return { scripts };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Descargar script de solucion' })
  downloadScript(@Param('id') id: string, @Res() res: Response) {
    const filePath = join(this.scriptsDir, `${id}.bat`);
    if (!existsSync(filePath)) {
      throw new NotFoundException(`Script ${id} no encontrado`);
    }
    res.setHeader('Content-Type', 'application/x-msdos-program');
    res.setHeader('Content-Disposition', `attachment; filename="${id}.bat"`);
    res.sendFile(filePath);
  }

  private getLabel(filename: string): string {
    const labels: Record<string, string> = {
      'fix-network-dns.bat': 'Sin Internet / DNS',
      'fix-printer.bat': 'Impresora No Imprime',
      'fix-slow-pc.bat': 'Equipo Lento',
      'install-anydesk.bat': 'Instalar AnyDesk',
      'install-rustdesk.bat': 'Instalar RustDesk',
      'fix-browser-cache.bat': 'Limpiar Cache Navegador',
      'fix-outlook.bat': 'Problemas con Outlook',
      'fix-black-screen.bat': 'Pantalla Negra',
      'fix-windows-update.bat': 'Windows Update Trabado',
      'fix-wifi.bat': 'WiFi No Conecta',
    };
    return labels[filename] || filename;
  }

  private getDescription(filename: string): string {
    const descriptions: Record<string, string> = {
      'fix-network-dns.bat': 'Renueva IP, limpia DNS y resetea Winsock',
      'fix-printer.bat': 'Reinicia spooler y vacia cola de impresion',
      'fix-slow-pc.bat': 'Limpia temporales, cache y optimiza disco',
      'install-anydesk.bat': 'Instala AnyDesk para soporte remoto',
      'install-rustdesk.bat': 'Instala RustDesk (alternativa open source)',
      'fix-browser-cache.bat': 'Limpia cache de Chrome, Edge y Firefox',
      'fix-outlook.bat': 'Reinicia Outlook y limpia archivos temporales',
      'fix-black-screen.bat': 'Reinicia explorer y verifica graficos',
      'fix-windows-update.bat': 'Reinicia servicios de actualizacion',
      'fix-wifi.bat': 'Reinicia adaptador WiFi y renueva IP',
    };
    return descriptions[filename] || '';
  }
}
