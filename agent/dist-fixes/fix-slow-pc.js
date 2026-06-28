#!/usr/bin/env node

/**
 * fix-slow-pc
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
  console.log(chalk.cyan('\n=== fix-slow-pc ===\n'));

  const commands = `title TecMan Fix - Equipo Lento
color 0A
cls
del /q /f /s "%TEMP%\*" >nul 2>&1
del /q /f /s "%windir%\Temp\*" >nul 2>&1
del /q /f /s "%windir%\Prefetch\*" >nul 2>&1
net stop wuauserv >nul 2>&1
del /q /f /s "%windir%\SoftwareDistribution\Download\*" >nul 2>&1
net start wuauserv >nul 2>&1
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 1 /nobreak >nul
del /q /f "%localappdata%\Microsoft\Windows\Explorer\thumbcache_*.db" >nul 2>&1
del /q /f "%localappdata%\Microsoft\Windows\Explorer\iconcache_*.db" >nul 2>&1
start explorer.exe >nul 2>&1
PowerShell -Command "Clear-RecycleBin -Force" >nul 2>&1
PowerShell -Command "Get-Volume | Where-Object { $_.DriveLetter -and $_.FileSystemType -in 'NTFS','ReFS' } | ForEach-Object { Optimize-Volume -DriveLetter $_.DriveLetter -ErrorAction SilentlyContinue }" >nul 2>&1
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
