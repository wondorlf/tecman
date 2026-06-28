#!/usr/bin/env node

/**
 * fix-outlook
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
  console.log(chalk.cyan('\n=== fix-outlook ===\n'));

  const commands = `title TecMan Fix - Outlook No Funciona (Completo)
color 0A
cls
taskkill /f /im outlook.exe >nul 2>&1
taskkill /f /im msedge.exe >nul 2>&1
timeout /t 2 /nobreak >nul
del /q /f /s "%LOCALAPPDATA%\Microsoft\Outlook\*.log" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Outlook\Offline Cache\*" >nul 2>&1
del /q /f /s "%TEMP%\outlook*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Outlook\*.ost" >nul 2>&1
ipconfig /flushdns >nul 2>&1
ipconfig /release >nul 2>&1
ipconfig /renew >nul 2>&1
netsh winsock reset >nul 2>&1
netsh int ip reset >nul 2>&1
start outlook.exe >nul 2>&1
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
