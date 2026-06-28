#!/usr/bin/env node

/**
 * fix-bsod-diag
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
  console.log(chalk.cyan('\n=== fix-bsod-diag ===\n'));

  const commands = `title TecMan Fix - Pantalla Azul (BSOD)
color 0A
cls
wevtutil qe System /c:10 /f:text /rd:true >"%USERPROFILE%\Desktop\reporte-bsod.txt" 2>&1
PowerShell -Command "Get-CimInstance MSAcpi_ThermalZoneTemperature -ErrorAction SilentlyContinue | Select-Object InstanceName, @{N='TempCelsius';E={[math]::Round($_.CurrentTemperature/10-273.15,1)}}" >>"%USERPROFILE%\Desktop\reporte-bsod.txt" 2>&1
PowerShell -Command "Get-PhysicalDisk | Select-Object DeviceId, MediaType, HealthStatus, Size | Format-Table -AutoSize" >>"%USERPROFILE%\Desktop\reporte-bsod.txt" 2>&1
PowerShell -Command "Get-EventLog -LogName System -EntryType Error -Newest 5 | Select-Object TimeGenerated, Source, Message | Format-Table -AutoSize -Wrap" >>"%USERPROFILE%\Desktop\reporte-bsod.txt" 2>&1
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
