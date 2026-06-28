#!/usr/bin/env node

/**
 * fix-repair-windows
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
  console.log(chalk.cyan('\n=== fix-repair-windows ===\n'));

  const commands = `title TecMan Fix - Reparar Windows (Completo)
color 0A
cls
sfc /scannow >nul 2>&1
DISM /Online /Cleanup-Image /RestoreHealth >nul 2>&1
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager" /v BootExecute /t REG_MULTI_SZ /d "autocheck autochk *" /f >nul 2>&1
icacls "C:\Windows" /reset /t /c /q >nul 2>&1
netsh winsock reset >nul 2>&1
netsh int ip reset >nul 2>&1
ipconfig /flushdns >nul 2>&1
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
