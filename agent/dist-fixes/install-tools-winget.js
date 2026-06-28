#!/usr/bin/env node

/**
 * install-tools-winget
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
  console.log(chalk.cyan('\n=== install-tools-winget ===\n'));

  const commands = `title TecMan - Instalador de Herramientas (Winget)
color 0A
cls
winget --version >nul 2>&1
if %errorlevel% neq 0 (
)
winget install --id Google.Chrome --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] Chrome instalado || echo      [WARN] Chrome ya instalado o error
winget install --id Mozilla.Firefox --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] Firefox instalado || echo      [WARN] Firefox ya instalado o error
winget install --id TheDocumentFoundation.LibreOffice --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] LibreOffice instalado || echo      [WARN] LibreOffice ya instalado o error
winget install --id Adobe.Acrobat.Reader.64-bit --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] Adobe Reader instalado || echo      [WARN] Adobe Reader ya instalado o error
winget install --id 7zip.7zip --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] 7-Zip instalado || echo      [WARN] 7-Zip ya instalado o error
winget install --id Notepad++.Notepad++ --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] Notepad++ instalado || echo      [WARN] Notepad++ ya instalado o error
winget install --id VideoLAN.VLC --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] VLC instalado || echo      [WARN] VLC ya instalado o error
winget install --id RARLab.WinRAR --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] WinRAR instalado || echo      [WARN] WinRAR ya instalado o error
winget install --id AnyDeskSoftwareGmbH.AnyDesk --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] AnyDesk instalado || echo      [WARN] AnyDesk ya instalado o error
winget install --id RustDesk.RustDesk --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] RustDesk instalado || echo      [WARN] RustDesk ya instalado o error
winget install --id voidtools.Everything --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] Everything instalado || echo      [WARN] Everything ya instalado o error
winget install --id CrystalDewWorld.CrystalDiskInfo --silent --accept-source-agreements --accept-package-agreements -e >nul 2>&1 && echo      [OK] CrystalDiskInfo instalado || echo      [WARN] CrystalDiskInfo ya instalado o error
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
