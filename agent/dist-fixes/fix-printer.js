#!/usr/bin/env node

/**
 * fix-printer
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
  console.log(chalk.cyan('\n=== fix-printer ===\n'));

  const commands = `title TecMan Fix - Impresora No Imprime
color 0A
cls
net stop spooler >nul 2>&1
del /q /f /s "%windir%\System32\spool\PRINTERS\*" >nul 2>&1
net start spooler >nul 2>&1
sc query spooler | findstr "STATE" >nul 2>&1
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
