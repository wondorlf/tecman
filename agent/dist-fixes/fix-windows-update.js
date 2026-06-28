#!/usr/bin/env node

/**
 * fix-windows-update
 * Auto-generado por TecMan Fix Builder
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

function run(command) {
  try {
    console.log(chalk.gray(`Ejecutando: ${command}`));
    execSync(command, { stdio: 'inherit', shell: true });
    return true;
  } catch (error) {
    console.log(chalk.red(`Error: ${error.message}`));
    return false;
  }
}

function main() {
  console.log(chalk.cyan('\n=== fix-windows-update ===\n'));

  const commands = `title TecMan Fix - Windows Update Trabado
color 0A
cls
net stop wuauserv >nul 2>&1
net stop cryptSvc >nul 2>&1
net stop bits >nul 2>&1
net stop msiserver >nul 2>&1
del /q /f /s "%windir%\SoftwareDistribution\Download\*" >nul 2>&1
del /q /f /s "%windir%\SoftwareDistribution\DataStore\*" >nul 2>&1
net start wuauserv >nul 2>&1
net start cryptSvc >nul 2>&1
net start bits >nul 2>&1
net start msiserver >nul 2>&1
wuauclt /detectnow >nul 2>&1
wuauclt /updatenow >nul 2>&1
timeout /t 1 >nul`.split('\n').filter(l => l.trim());

  let success = true;
  for (const cmd of commands) {
    if (!run(cmd.trim())) {
      success = false;
    }
  }

  if (success) {
    console.log(chalk.green('\n✅ Operación completada\n'));
  } else {
    console.log(chalk.yellow('\n⚠️ Operación completada con errores\n'));
  }
}

main();
