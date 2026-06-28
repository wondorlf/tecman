#!/usr/bin/env node

/**
 * install-anydesk
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
  console.log(chalk.cyan('\n=== install-anydesk ===\n'));

  const commands = `title TecMan Fix - Soporte Remoto (AnyDesk)
color 0A
cls
if exist "C:\Program Files (x86)\AnyDesk\AnyDesk.exe" (
    start "" "C:\Program Files (x86)\AnyDesk\AnyDesk.exe"
    goto :show_id
)
if exist "C:\Program Files\AnyDesk\AnyDesk.exe" (
    start "" "C:\Program Files\AnyDesk\AnyDesk.exe"
    goto :show_id
)
powershell -Command "(New-Object System.Net.WebClient).DownloadFile('https://download.anydesk.com/AnyDesk.exe', '%TEMP%\AnyDesk.exe')"
if not exist "%TEMP%\AnyDesk.exe" (
    goto :end
)
"%TEMP%\AnyDesk.exe" --install "C:\Program Files\AnyDesk" --start-with-win --silent >nul 2>&1
timeout /t 5 /nobreak >nul
start "" "C:\Program Files\AnyDesk\AnyDesk.exe" >nul 2>&1
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
