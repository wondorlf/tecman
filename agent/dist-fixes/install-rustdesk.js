#!/usr/bin/env node

/**
 * install-rustdesk
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
  console.log(chalk.cyan('\n=== install-rustdesk ===\n'));

  const commands = `title TecMan Fix - Soporte Remoto (RustDesk)
color 0A
cls
if exist "C:\Program Files\RustDesk\rustdesk.exe" (
    start "" "C:\Program Files\RustDesk\rustdesk.exe"
    goto :show_id
)
if exist "%LOCALAPPDATA%\Programs\RustDesk\rustdesk.exe" (
    start "" "%LOCALAPPDATA%\Programs\RustDesk\rustdesk.exe"
    goto :show_id
)
powershell -Command "(New-Object System.Net.WebClient).DownloadFile('https://github.com/rustdesk/rustdesk/releases/download/1.3.7/rustdesk-1.3.7-x86_setup.exe', '%TEMP%\rustdesk-setup.exe')"
if not exist "%TEMP%\rustdesk-setup.exe" (
    goto :end
)
"%TEMP%\rustdesk-setup.exe" /S >nul 2>&1
timeout /t 8 /nobreak >nul
start "" "C:\Program Files\RustDesk\rustdesk.exe" >nul 2>&1
:show_id
timeout /t 3 /nobreak >nul
:end
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
