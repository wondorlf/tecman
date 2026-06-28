#!/usr/bin/env node

/**
 * TecMan Discovery Agent - Node.js
 * Recopila información de hardware y la envía al servidor TecMan
 * Migrado de PowerShell/Go a Node.js para evitar detección como no confiable
 */

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const chalk = require('chalk');

const AGENT_VERSION = 'node-1.0.0';
const CONFIG_FILE = 'tecman-discovery-config.json';

class TecManAgent {
  constructor() {
    this.config = null;
    this.configPath = path.join(process.cwd(), CONFIG_FILE);
  }

  // ── Config ──────────────────────────────────────────────────────────────────
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(data);
        return true;
      }
    } catch (error) {
      console.log(chalk.yellow('Error leyendo configuración:', error.message));
    }
    return false;
  }

  saveConfig(config) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
      this.config = config;
      return true;
    } catch (error) {
      console.log(chalk.red('Error guardando configuración:', error.message));
      return false;
    }
  }

  // ── Hardware Collection ─────────────────────────────────────────────────────
  runPowerShell(command) {
    try {
      const result = execSync(`powershell -NoProfile -Command "${command}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return result.trim();
    } catch (error) {
      return '';
    }
  }

  getMacAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
          return iface.mac.toUpperCase();
        }
      }
    }
    return 'UNKNOWN_MAC';
  }

  getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (!iface.internal && iface.family === 'IPv4') {
          return iface.address;
        }
      }
    }
    return '';
  }

  getManufacturer() {
    return this.runPowerShell("Get-CimInstance Win32_ComputerSystem | Select-Object -ExpandProperty Manufacturer");
  }

  getModel() {
    return this.runPowerShell("Get-CimInstance Win32_ComputerSystem | Select-Object -ExpandProperty Model");
  }

  getSerialNumber() {
    const serial = this.runPowerShell("Get-CimInstance Win32_BIOS | Select-Object -ExpandProperty SerialNumber");
    if (serial && !serial.includes('To be filled') && !serial.includes('Default string') && !serial.includes('00000000')) {
      return serial;
    }
    return '';
  }

  getBiosVersion() {
    return this.runPowerShell("Get-CimInstance Win32_BIOS | Select-Object -ExpandProperty SMBIOSBIOSVersion");
  }

  getDomain() {
    return this.runPowerShell("Get-CimInstance Win32_ComputerSystem | Select-Object -ExpandProperty Domain");
  }

  getLoggedUser() {
    return this.runPowerShell("Get-CimInstance Win32_ComputerSystem | Select-Object -ExpandProperty UserName");
  }

  getCPUInfo() {
    const cpuName = this.runPowerShell("Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty Name");
    const cpuCores = this.runPowerShell("Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty NumberOfCores");
    return {
      model: cpuName || 'Unknown',
      cores: parseInt(cpuCores) || os.cpus().length
    };
  }

  getRAMInfo() {
    const totalBytes = os.totalmem();
    const ramType = this.runPowerShell(`
      $m = Get-CimInstance Win32_PhysicalMemory | Select-Object -First 1
      if ($m) {
        switch ($m.SMBIOSMemoryType) {
          20 { "DDR" } 21 { "DDR2" } 24 { "DDR3" } 26 { "DDR4" } 27 { "DDR5" }
          30 { "LPDDR" } 31 { "LPDDR2" } 32 { "LPDDR3" } 34 { "LPDDR5" }
          default { "Tipo $($m.SMBIOSMemoryType)" }
        }
      }
    `);
    const ramSpeed = this.runPowerShell(`
      $m = Get-CimInstance Win32_PhysicalMemory | Select-Object -First 1
      if ($m) { "$($m.Speed) MHz" }
    `);
    const slotsTotal = this.runPowerShell("@(Get-CimInstance Win32_PhysicalMemory).Count");
    const slotsUsed = this.runPowerShell("@(Get-CimInstance Win32_PhysicalMemory | Where-Object { $_.Capacity -gt 0 }).Count");

    return {
      totalBytes,
      type: ramType || '',
      speed: ramSpeed || '',
      slotsTotal: parseInt(slotsTotal) || 0,
      slotsUsed: parseInt(slotsUsed) || 0
    };
  }

  getDiskInfo() {
    const diskTotal = this.runPowerShell(`
      $disks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"
      ($disks | Measure-Object -Property Size -Sum).Sum
    `);
    const diskFree = this.runPowerShell(`
      $disks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"
      ($disks | Measure-Object -Property FreeSpace -Sum).Sum
    `);
    const diskType = this.runPowerShell(`
      $d = Get-CimInstance Win32_DiskDrive | Select-Object -First 1
      $desc = ("$($d.Model) $($d.Caption) $($d.InterfaceType)").ToLower()
      if ($desc -match 'nvme' -or $desc -match 'm\\.2') { 'NVMe' }
      elseif ($desc -match 'ssd' -or $desc -match 'solid.state') { 'SSD' }
      else { 'HDD' }
    `);

    const totalBytes = parseInt(diskTotal) || 0;
    const freeBytes = parseInt(diskFree) || 0;

    return {
      totalBytes,
      freeBytes,
      usedBytes: totalBytes - freeBytes,
      type: diskType || 'HDD'
    };
  }

  getVolumes() {
    try {
      const volumesJson = this.runPowerShell(`
        $volumes = @()
        $disks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"
        foreach ($d in $disks) {
          $volumes += @{
            deviceId = $d.DeviceID
            label = $d.VolumeName
            fileSystem = $d.FileSystem
            totalBytes = [uint64]$d.Size
            usedBytes = [uint64]($d.Size - $d.FreeSpace)
            freeBytes = [uint64]$d.FreeSpace
          }
        }
        $volumes | ConvertTo-Json -Depth 10
      `);
      return JSON.parse(volumesJson || '[]');
    } catch {
      return [];
    }
  }

  collectHardwareData() {
    console.log(chalk.cyan('[TecMan] Recopilando información del sistema...'));

    const cpu = this.getCPUInfo();
    const ram = this.getRAMInfo();
    const disk = this.getDiskInfo();
    const lastBoot = this.runPowerShell("(Get-CimInstance Win32_OperatingSystem).LastBootUpTime.ToString('yyyy-MM-ddTHH:mm:ssZ')");

    return {
      hostname: os.hostname(),
      macAddress: this.getMacAddress(),
      ipAddress: this.getLocalIP(),
      os: `${os.type()} ${os.release()} (Build ${os.version().split('.').slice(0, 2).join('.')})`,
      serialNumber: this.getSerialNumber(),
      manufacturer: this.getManufacturer(),
      model: this.getModel(),
      biosVersion: this.getBiosVersion(),
      cpuModel: cpu.model,
      cpuCores: cpu.cores,
      ramTotalBytes: ram.totalBytes,
      ramType: ram.type,
      ramSlots: ram.slotsTotal,
      ramSlotsUsed: ram.slotsUsed,
      ramSpeed: ram.speed,
      diskTotalBytes: disk.totalBytes,
      diskUsedBytes: disk.usedBytes,
      diskFreeBytes: disk.freeBytes,
      diskType: disk.type,
      volumes: this.getVolumes(),
      domain: this.getDomain(),
      loggedUser: this.getLoggedUser(),
      agentVersion: AGENT_VERSION,
      lastBoot: lastBoot || new Date().toISOString()
    };
  }

  // ── Send Data ───────────────────────────────────────────────────────────────
  sendData(payload) {
    return new Promise((resolve, reject) => {
      const endpoint = this.config.serverUrl.replace(/\/$/, '') + '/api/discovery/agent';
      const url = new URL(endpoint);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const jsonData = JSON.stringify(payload);

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(jsonData)
        },
        timeout: 15000
      };

      if (this.config.apiKey) {
        options.headers['X-API-Key'] = this.config.apiKey;
      }

      console.log(chalk.cyan(`[TecMan] Enviando datos a: ${endpoint}`));
      console.log(chalk.gray(`[TecMan] Hostname: ${payload.hostname}`));
      console.log(chalk.gray(`[TecMan] MAC: ${payload.macAddress}`));
      console.log(chalk.gray(`[TecMan] IP: ${payload.ipAddress}`));

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(chalk.green('[TecMan] ✅ Datos enviados exitosamente'));
            resolve(true);
          } else if (res.statusCode === 401) {
            console.log(chalk.red('[TecMan] ❌ Error de autenticación: API Key inválida'));
            resolve(false);
          } else {
            console.log(chalk.yellow(`[TecMan] Respuesta inesperada: ${res.statusCode}`));
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        console.log(chalk.red(`[TecMan] ❌ Error de conexión: ${error.message}`));
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        console.log(chalk.red('[TecMan] ❌ Timeout de conexión'));
        resolve(false);
      });

      req.write(jsonData);
      req.end();
    });
  }

  // ── Run Modes ───────────────────────────────────────────────────────────────
  async runOnce() {
    if (!this.config || !this.config.serverUrl) {
      console.log(chalk.red('❌ No hay configuración. Ejecuta con --server <url>'));
      return;
    }
    const payload = this.collectHardwareData();
    await this.sendData(payload);
  }

  async runContinuous(intervalHours = 1) {
    console.log(chalk.yellow(`[TecMan] Modo continuo: cada ${intervalHours} hora(s)`));
    while (true) {
      await this.runOnce();
      console.log(chalk.yellow(`[TecMan] Próxima ejecución en ${intervalHours} hora(s)... (Ctrl+C para detener)`));
      await new Promise(resolve => setTimeout(resolve, intervalHours * 3600 * 1000));
    }
  }

  // ── CLI ─────────────────────────────────────────────────────────────────────
  parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {
      server: '',
      host: '',
      apiKey: '',
      install: false,
      uninstall: false,
      once: false,
      interval: 0
    };

    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--server':
        case '-s':
          parsed.server = args[++i] || '';
          break;
        case '--host':
          parsed.host = args[++i] || '';
          break;
        case '--api-key':
        case '-k':
          parsed.apiKey = args[++i] || '';
          break;
        case '--install':
        case '-i':
          parsed.install = true;
          break;
        case '--uninstall':
          parsed.uninstall = true;
          break;
        case '--once':
          parsed.once = true;
          break;
        case '--interval':
          parsed.interval = parseInt(args[++i]) || 0;
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
      }
    }

    // Use host as alias for server
    if (!parsed.server && parsed.host) {
      parsed.server = parsed.host;
    }

    // Normalize URL
    if (parsed.server && !parsed.server.startsWith('http')) {
      parsed.server = 'http://' + parsed.server;
    }

    return parsed;
  }

  showHelp() {
    console.log(`
${chalk.cyan('TecMan Discovery Agent')} - ${chalk.gray(AGENT_VERSION)}

${chalk.yellow('USO:')}
  tecman-discovery --server <url> --install    Instalar como servicio
  tecman-discovery --host <url> --once          Ejecutar una vez
  tecman-discovery --uninstall                  Desinstalar servicio

${chalk.yellow('OPCIONES:')}
  --server, -s    URL del servidor (ej: http://192.168.1.100:3001)
  --host          Alias de --server
  --api-key, -k   API Key para autenticación
  --install, -i   Instalar como servicio Windows
  --uninstall     Desinstalar servicio
  --once          Ejecutar una sola vez
  --interval      Intervalo en horas para modo continuo
  --help, -h      Mostrar ayuda

${chalk.yellow('EJEMPLOS:')}
  tecman-discovery --server 192.168.1.100:3001 --install
  tecman-discovery --host servidor.egan.local --once
  tecman-discovery -s http://tecmanserver:3001 -i
`);
  }

  async main() {
    console.log(chalk.cyan(`
  ╔══════════════════════════════════════════╗
  ║   TecMan Discovery Agent (Node.js)       ║
  ║   Sistema de Gestión de Activos          ║
  ╚══════════════════════════════════════════╝
  `));

    const args = this.parseArgs();

    // Uninstall
    if (args.uninstall) {
      console.log(chalk.yellow('Desinstalando servicio...'));
      try {
        execSync('pm2 delete tecman-discovery 2>nul', { stdio: 'pipe' });
        console.log(chalk.green('✅ Servicio desinstalado'));
      } catch {
        console.log(chalk.yellow('El servicio no existía'));
      }
      return;
    }

    // Configure
    if (args.server) {
      this.saveConfig({
        serverUrl: args.server,
        apiKey: args.apiKey || ''
      });
      console.log(chalk.green(`✅ Configuración guardada: ${args.server}`));
    }

    // Load config
    if (!this.loadConfig()) {
      console.log(chalk.red('❌ No se encontró configuración'));
      this.showHelp();
      return;
    }

    // Install as PM2 service
    if (args.install) {
      console.log(chalk.yellow('Instalando como servicio PM2...'));
      try {
        execSync(`pm2 start "${__filename}" --name tecman-discovery -- --once`, {
          stdio: 'inherit'
        });
        console.log(chalk.green('✅ Servicio instalado'));
        console.log(chalk.gray('Para ver logs: pm2 logs tecman-discovery'));
      } catch (error) {
        console.log(chalk.red('❌ Error instalando servicio:', error.message));
      }
      return;
    }

    // Run modes
    if (args.once || args.interval > 0) {
      if (args.interval > 0) {
        await this.runContinuous(args.interval);
      } else {
        await this.runOnce();
      }
    } else {
      // Default: run once
      await this.runOnce();
    }
  }
}

// Start
const agent = new TecManAgent();
agent.main().catch(console.error);
