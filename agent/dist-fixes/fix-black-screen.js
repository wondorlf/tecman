#!/usr/bin/env node

/**
 * fix-black-screen
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
  console.log(chalk.cyan('\n=== fix-black-screen ===\n'));

  const commands = `title TecMan Fix - Pantalla Negra / No Enciende
color 0A
cls
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 2 /nobreak >nul
start explorer.exe >nul 2>&1
tasklist /FI "IMAGENAME eq dwm.exe" | findstr "dwm.exe" >nul 2>&1
if %errorlevel%==0 (
) else (
)
PowerShell -Command "Get-CimInstance Win32_VideoController | Select-Object Name, Status, CurrentHorizontalResolution, CurrentVerticalResolution" >nul 2>&1
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
