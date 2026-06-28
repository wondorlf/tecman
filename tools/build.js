#!/usr/bin/env node

/**
 * Build script para EGAN TECH Tools
 * Compila la aplicación Node.js a ejecutable usando nexe
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, '..', 'dist');

async function build() {
  console.log('🔨 Compilando EGAN TECH Tools...\n');

  // Crear directorio de salida si no existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const inputFile = path.join(__dirname, 'index.js');
  const outputFile = path.join(OUTPUT_DIR, 'egan-tools.exe');

  console.log(`📄 Input: ${inputFile}`);
  console.log(`📁 Output: ${outputFile}`);
  console.log(`🎯 Target: windows-x64\n`);

  try {
    // Verificar si nexe está instalado
    try {
      execSync('nexe --version', { stdio: 'pipe' });
    } catch (e) {
      console.log('⚠️  nexe no encontrado globalmente. Instalando...');
      execSync('npm install -g nexe', { stdio: 'inherit' });
    }

    // Ejecutar nexe
    console.log('📦 Compilando con nexe...');
    execSync(`nexe "${inputFile}" -o "${outputFile}" -t windows-x64`, {
      stdio: 'inherit',
      cwd: __dirname
    });

    console.log('\n✅ ¡Compilación exitosa!');
    console.log(`📦 Ejecutable generado: ${outputFile}`);
    console.log('\n📌 Para usar:');
    console.log('   1. Copia "egan-tools.exe" a la carpeta del proyecto');
    console.log('   2. Ejecuta: egan-tools.exe');
  } catch (error) {
    console.error('\n❌ Error en la compilación:', error.message);
    console.log('\n💡 Alternativa: Ejecuta directamente con Node.js:');
    console.log('   node tools/index.js');
    process.exit(1);
  }
}

// Verificar argumentos
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
EGAN TECH Tools - Build Script

Uso:
  node build.js              # Compilar para Windows x64
  node build.js --help       # Mostrar esta ayuda

El ejecutable se genera en: dist/egan-tools.exe
  `);
  process.exit(0);
}

build();
