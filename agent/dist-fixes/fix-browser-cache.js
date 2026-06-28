#!/usr/bin/env node

/**
 * fix-browser-cache
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
  console.log(chalk.cyan('\n=== fix-browser-cache ===\n'));

  const commands = `title TecMan Fix - Limpiar Cache del Navegador
color 0A
cls
taskkill /f /im chrome.exe >nul 2>&1
taskkill /f /im msedge.exe >nul 2>&1
taskkill /f /im firefox.exe >nul 2>&1
timeout /t 2 /nobreak >nul
del /q /f /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Code Cache\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Service Worker\CacheStorage\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Code Cache\*" >nul 2>&1
del /q /f /s "%LOCALAPPDATA%\Mozilla\Firefox\Profiles\*.default*\cache2\*" >nul 2>&1
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
