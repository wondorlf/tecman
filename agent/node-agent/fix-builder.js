#!/usr/bin/env node

/**
 * TecMan Fix Builder
 * Convierte scripts .bat de fix-scripts a ejecutables Node.js
 * Permite generar nuevas soluciones descargables desde el chatbot
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

const FIX_SCRIPTS_DIR = path.join(__dirname, '..', 'fix-scripts');
const OUTPUT_DIR = path.join(__dirname, '..', 'dist-fixes');

class FixBuilder {
  constructor() {
    this.fixes = [];
  }

  scanFixScripts() {
    if (!fs.existsSync(FIX_SCRIPTS_DIR)) {
      console.log(chalk.yellow('Directorio fix-scripts no encontrado'));
      return [];
    }

    const files = fs.readdirSync(FIX_SCRIPTS_DIR).filter(f => f.endsWith('.bat'));
    this.fixes = files.map(file => ({
      name: path.basename(file, '.bat'),
      file: path.join(FIX_SCRIPTS_DIR, file),
      content: fs.readFileSync(path.join(FIX_SCRIPTS_DIR, file), 'utf8')
    }));

    return this.fixes;
  }

  generateNodeScript(fix) {
    // Extraer descripción del comentario del .bat
    const descMatch = fix.content.match(/REM\s*=\s*\nREM\s*(.*?)\nREM\s*=/s);
    const description = descMatch ? descMatch[1].trim() : fix.name;

    // Extraer comandos principales (ignorar @echo off, comments, etc.)
    const commands = fix.content
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed &&
               !trimmed.startsWith('@echo off') &&
               !trimmed.startsWith('REM') &&
               !trimmed.startsWith('::') &&
               !trimmed.startsWith('echo') &&
               !trimmed.startsWith('pause') &&
               !trimmed.startsWith('exit') &&
               trimmed !== '';
      })
      .join('\n');

    return `#!/usr/bin/env node

/**
 * ${description}
 * Auto-generado por TecMan Fix Builder
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

function run(command) {
  try {
    console.log(chalk.gray(\`Ejecutando: \${command}\`));
    execSync(command, { stdio: 'inherit', shell: true });
    return true;
  } catch (error) {
    console.log(chalk.red(\`Error: \${error.message}\`));
    return false;
  }
}

function main() {
  console.log(chalk.cyan('\\n=== ${description} ===\\n'));

  const commands = \`${commands.replace(/`/g, '\\`')}\`.split('\\n').filter(l => l.trim());

  let success = true;
  for (const cmd of commands) {
    if (!run(cmd.trim())) {
      success = false;
    }
  }

  if (success) {
    console.log(chalk.green('\\n✅ Operación completada\\n'));
  } else {
    console.log(chalk.yellow('\\n⚠️ Operación completada con errores\\n'));
  }
}

main();
`;
  }

  async buildFix(fix) {
    console.log(chalk.gray(`Procesando: ${fix.name}`));

    // Generar script Node.js
    const nodeScript = this.generateNodeScript(fix);
    const outputPath = path.join(OUTPUT_DIR, `${fix.name}.js`);

    fs.writeFileSync(outputPath, nodeScript, 'utf8');
    console.log(chalk.green(`  ✓ Generado: ${fix.name}.js`));

    // Compilar a .exe si nexe está disponible
    try {
      execSync('nexe --version', { stdio: 'pipe' });
      const exePath = path.join(OUTPUT_DIR, `${fix.name}.exe`);
      execSync(`nexe "${outputPath}" -o "${exePath}" -t windows-x64`, {
        stdio: 'pipe'
      });
      console.log(chalk.green(`  ✓ Compilado: ${fix.name}.exe`));
      // Eliminar .js temporal
      fs.unlinkSync(outputPath);
    } catch {
      console.log(chalk.yellow(`  ⚠ nexe no disponible, manteniendo .js`));
    }
  }

  async buildAll() {
    console.log(chalk.cyan('\n=== TecMan Fix Builder ===\n'));

    // Crear directorio de salida
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Escanear scripts
    const fixes = this.scanFixScripts();
    if (fixes.length === 0) {
      console.log(chalk.yellow('No se encontraron scripts .bat para procesar'));
      return;
    }

    console.log(chalk.gray(`Encontrados ${fixes.length} scripts\n`));

    // Procesar cada fix
    for (const fix of fixes) {
      await this.buildFix(fix);
    }

    // Generar índice
    this.generateIndex(fixes);

    console.log(chalk.green(`\n✅ Build completado: ${OUTPUT_DIR}\n`));
  }

  generateIndex(fixes) {
    const indexContent = `#!/usr/bin/env node

/**
 * TecMan Fixes - Índice de soluciones
 * Auto-generado por Fix Builder
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const fixes = ${JSON.stringify(fixes.map(f => ({
      name: f.name,
      description: f.content.match(/REM\\s*=\\s*\\nREM\\s*(.*?)\\nREM\\s*=/s)?.[1]?.trim() || f.name
    })), null, 2)};

async function main() {
  console.log(chalk.cyan('\\n=== TecMan Fixes - Soluciones ===\\n'));

  const { fix } = await inquirer.prompt([{
    type: 'list',
    name: 'fix',
    message: 'Selecciona una solución:',
    choices: fixes.map(f => ({ name: f.description, value: f.name }))
  }]);

  const fixPath = path.join(__dirname, \`\${fix}.js\`);
  if (fs.existsSync(fixPath)) {
    require(fixPath);
  } else {
    console.log(chalk.red('Solución no encontrada'));
  }
}

main();
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.js'), indexContent, 'utf8');
    console.log(chalk.green('  ✓ Índice generado: index.js'));
  }
}

// Run
const builder = new FixBuilder();
builder.buildAll().catch(console.error);
