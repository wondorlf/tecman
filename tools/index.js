#!/usr/bin/env node

/**
 * EGAN TECH - Herramientas de Mantenimiento y Despliegue
 * Migrado de .bat/.ps1 a Node.js (sin dependencias externas para PowerShell)
 */

const { execSync, spawn } = require('child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');

class EganTools {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.version = '1.0.0';
  }

  runPowerShell(command) {
    try {
      const result = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${command}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return result.trim();
    } catch (error) {
      console.error(chalk.red(`Error PowerShell: ${error.message}`));
      return null;
    }
  }

  async checkAdmin() {
    const result = this.runPowerShell(`
      $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
      $principal = New-Object Security.Principal.WindowsPrincipal($identity)
      $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    `);
    return result === 'True';
  }

  async ensureAdmin() {
    const isAdmin = await this.checkAdmin();
    if (!isAdmin) {
      console.log(chalk.yellow('Se necesitan permisos de Administrador. Re-elevando...'));
      this.runPowerShell(`Start-Process -FilePath 'node' -ArgumentList '${process.argv[1]}' -Verb RunAs`);
      process.exit(0);
    }
  }

  async mainMenu() {
    console.clear();
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(chalk.cyan.bold(`  EGAN TECH - Herramientas v${this.version}`));
    console.log(chalk.cyan('═'.repeat(50)));
    console.log('');

    const { option } = await inquirer.prompt([
      {
        type: 'list',
        name: 'option',
        message: 'Selecciona una opción:',
        choices: [
          { name: '1) Git - Sincronizar con GitHub', value: 'git-sync' },
          { name: '2) Git - Descargar/Clonar proyecto', value: 'git-clone' },
          { name: '3) Deploy - Despliegue completo', value: 'deploy' },
          { name: '4) Mantenimiento Windows', value: 'maintenance' },
          { name: '5) Diagnóstico del sistema', value: 'diagnostics' },
          { name: '0) Salir', value: 'exit' }
        ]
      }
    ]);

    return option;
  }

  async gitSync() {
    console.log(chalk.cyan('\n=== Sincronizando con GitHub ===\n'));

    const { message } = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: 'Mensaje del commit (vacío = auto):',
        default: ''
      }
    ]);

    const commitMsg = message || `Actualización ${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}`;

    console.log(chalk.gray('Agregando cambios...'));
    execSync('git add -A', { cwd: this.projectRoot, stdio: 'inherit' });

    console.log(chalk.gray('Creando commit...'));
    execSync(`git commit -m "${commitMsg}"`, { cwd: this.projectRoot, stdio: 'inherit' });

    console.log(chalk.gray('Obteniendo cambios remotos...'));
    execSync('git pull --autostash origin master', { cwd: this.projectRoot, stdio: 'inherit' });

    console.log(chalk.gray('Subiendo cambios...'));
    execSync('git push origin master', { cwd: this.projectRoot, stdio: 'inherit' });

    console.log(chalk.green('\n✓ Sincronización completada\n'));
  }

  async gitClone() {
    console.log(chalk.cyan('\n=== Descargar/Clonar Proyecto ===\n'));

    const { dest } = await inquirer.prompt([
      {
        type: 'input',
        name: 'dest',
        message: 'Ruta destino (vacío = directorio actual):',
        default: this.projectRoot
      }
    ]);

    const gitDir = path.join(dest, '.git');

    if (fs.existsSync(gitDir)) {
      console.log(chalk.gray('Repositorio existente. Actualizando...'));
      execSync('git fetch origin', { cwd: dest, stdio: 'inherit' });
      execSync('git pull --autostash origin master', { cwd: dest, stdio: 'inherit' });
      console.log(chalk.green('\n✓ Repositorio actualizado\n'));
    } else {
      console.log(chalk.gray('Clonando repositorio...'));
      execSync(`git clone https://github.com/wondorlf/tecman.git "${dest}"`, { stdio: 'inherit' });
      console.log(chalk.green('\n✓ Repositorio clonado\n'));
    }
  }

  async deploy() {
    console.log(chalk.cyan('\n=== Despliegue Completo ===\n'));

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '¿Ejecutar despliegue completo? (git pull, install, build, pm2)',
        default: true
      }
    ]);

    if (!confirm) return;

    const steps = [
      { name: 'Git Pull', cmd: 'git pull origin master', cwd: this.projectRoot },
      { name: 'Install Root', cmd: 'npm install', cwd: this.projectRoot },
      { name: 'Install Backend', cmd: 'npm install --legacy-peer-deps', cwd: path.join(this.projectRoot, 'backend') },
      { name: 'Install Frontend', cmd: 'npm install', cwd: path.join(this.projectRoot, 'frontend') },
      { name: 'Prisma Generate', cmd: 'npx prisma generate', cwd: path.join(this.projectRoot, 'backend') },
      { name: 'Prisma DB Push', cmd: 'npx prisma db push --accept-data-loss', cwd: path.join(this.projectRoot, 'backend') },
      { name: 'Build', cmd: 'npm run build', cwd: this.projectRoot },
      { name: 'PM2 Reload', cmd: 'pm2 reload ecosystem.config.js --update-env', cwd: this.projectRoot }
    ];

    for (const step of steps) {
      console.log(chalk.gray(`→ ${step.name}...`));
      try {
        execSync(step.cmd, { cwd: step.cwd, stdio: 'inherit' });
      } catch (error) {
        console.log(chalk.yellow(`  ⚠ ${step.name} falló (continuando...)`));
      }
    }

    console.log(chalk.green('\n✓ Despliegue completado\n'));
  }

  async maintenance() {
    console.log(chalk.cyan('\n=== Mantenimiento Windows ===\n'));

    const { option } = await inquirer.prompt([
      {
        type: 'list',
        name: 'option',
        message: 'Selecciona operación:',
        choices: [
          { name: '1) Limpiar temporales', value: 'temp' },
          { name: '2) Vaciar papelera', value: 'recycle' },
          { name: '3) Limpiar cache DNS', value: 'dns' },
          { name: '4) Limpieza completa', value: 'full' },
          { name: '0) Volver', value: 'back' }
        ]
      }
    ]);

    if (option === 'back') return;

    await this.ensureAdmin();

    switch (option) {
      case 'temp':
        console.log(chalk.gray('Limpiando temporales...'));
        this.runPowerShell(`
          Remove-Item -Path "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue
          Remove-Item -Path "$env:SystemRoot\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue
          Remove-Item -Path "$env:SystemRoot\\Prefetch\\*" -Recurse -Force -ErrorAction SilentlyContinue
        `);
        console.log(chalk.green('✓ Temporales limpiados'));
        break;

      case 'recycle':
        console.log(chalk.gray('Vaciando papelera...'));
        this.runPowerShell('Clear-RecycleBin -Force');
        console.log(chalk.green('✓ Papelera vaciada'));
        break;

      case 'dns':
        console.log(chalk.gray('Limpiando cache DNS...'));
        execSync('ipconfig /flushdns', { stdio: 'inherit' });
        console.log(chalk.green('✓ DNS limpiado'));
        break;

      case 'full':
        console.log(chalk.gray('Ejecutando limpieza completa...'));
        this.runPowerShell(`
          Remove-Item -Path "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue
          Remove-Item -Path "$env:SystemRoot\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue
          Clear-RecycleBin -Force -ErrorAction SilentlyContinue
          ipconfig /flushdns
          DISM.exe /Online /Cleanup-Image /StartComponentCleanup
        `);
        console.log(chalk.green('✓ Limpieza completa finalizada'));
        break;
    }
  }

  async diagnostics() {
    console.log(chalk.cyan('\n=== Diagnóstico del Sistema ===\n'));

    const { option } = await inquirer.prompt([
      {
        type: 'list',
        name: 'option',
        message: 'Selecciona diagnóstico:',
        choices: [
          { name: '1) Información del sistema', value: 'sysinfo' },
          { name: '2) Estado de servicios', value: 'services' },
          { name: '3) Estado de red', value: 'network' },
          { name: '0) Volver', value: 'back' }
        ]
      }
    ]);

    if (option === 'back') return;

    switch (option) {
      case 'sysinfo':
        console.log(chalk.gray('Obteniendo información del sistema...\n'));
        this.runPowerShell(`
          Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsArchitecture, CsProcessors, CsPhyicallyInstalledMemory | Format-List
        `);
        break;

      case 'services':
        console.log(chalk.gray('Servicios críticos:\n'));
        this.runPowerShell(`
          Get-Service | Where-Object {$_.Status -eq 'Running' -and $_.DisplayName -like '*Windows*'} | Select-Object DisplayName, Status | Format-Table -AutoSize
        `);
        break;

      case 'network':
        console.log(chalk.gray('Estado de red:\n'));
        execSync('ipconfig /all', { stdio: 'inherit' });
        break;
    }
  }

  async run() {
    let running = true;

    while (running) {
      const option = await this.mainMenu();

      switch (option) {
        case 'git-sync':
          await this.gitSync();
          break;
        case 'git-clone':
          await this.gitClone();
          break;
        case 'deploy':
          await this.deploy();
          break;
        case 'maintenance':
          await this.maintenance();
          break;
        case 'diagnostics':
          await this.diagnostics();
          break;
        case 'exit':
          running = false;
          break;
      }

      if (running) {
        await inquirer.prompt([{ type: 'confirm', name: 'continue', message: 'Presiona Enter para continuar...', default: true }]);
      }
    }

    console.log(chalk.cyan('\n¡Hasta luego!\n'));
  }
}

// Iniciar
const app = new EganTools();
app.run().catch(console.error);
