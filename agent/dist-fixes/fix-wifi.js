#!/usr/bin/env node

/**
 * fix-wifi
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
  console.log(chalk.cyan('\n=== fix-wifi ===\n'));

  const commands = `title TecMan Fix - WiFi No Conecta
color 0A
cls
netsh interface set interface "Wi-Fi" disable >nul 2>&1
ipconfig /flushdns >nul 2>&1
netsh int ip reset >nul 2>&1
timeout /t 3 /nobreak >nul
netsh interface set interface "Wi-Fi" enable >nul 2>&1
ipconfig /release >nul 2>&1
ipconfig /renew >nul 2>&1
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
