import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private readonly agentsDir = join(process.cwd(), '..', 'agent');

  getAgentInfo() {
    return {
      go: {
        name: 'TecMan Discovery Agent (Go)',
        description: 'Agente multiplataforma para reporte de hardware',
        os: ['Windows', 'Linux', 'macOS'],
        install: 'go build -o tecman-discovery.exe main.go',
        config: 'tecman-discovery-config.json',
        usage: './tecman-discovery.exe -install -server http://<tu-servidor>:3001',
      },
      powershell: {
        name: 'TecMan Discovery Agent (PowerShell)',
        description: 'Agente nativo para Windows (recomendado)',
        os: ['Windows'],
        install: 'Ejecutar como administrador:',
        usage: '.\\tecman-discovery.ps1 -ServerUrl "http://<tu-servidor>:3001" -InstallTask',
        runCommand:
          'powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString(\'http://<servidor>:3001/api/agents/powershell/run\'))"',
        features: [
          'Recopila serial number (BIOS)',
          'Tarea programada automática',
          'Inventario detallado de RAM/Discos',
          'Ejecución remota sin descargar archivo',
        ],
      },
    };
  }

  getPowerShellScript(): string | null {
    const filePath = join(this.agentsDir, 'tecman-discovery.ps1');
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, 'utf-8');
  }

  getGoSource(): string | null {
    const srcPath = join(this.agentsDir, 'main.go');
    if (!existsSync(srcPath)) return null;
    return readFileSync(srcPath, 'utf-8');
  }

  getBatchInstaller(baseUrl: string): string | null {
    const batchPath = join(this.agentsDir, 'install-agent.bat');
    if (!existsSync(batchPath)) return null;
    let content = readFileSync(batchPath, 'utf-8');
    content = content.replace('SERVER_PLACEHOLDER', baseUrl);
    return content;
  }

  getPowerShellDownloadPath(): string {
    return join(this.agentsDir, 'tecman-discovery.ps1');
  }

  getGoDownloadPath(): { exe: string; src: string } {
    return {
      exe: join(this.agentsDir, 'tecman-discovery.exe'),
      src: join(this.agentsDir, 'main.go'),
    };
  }
}
