#!/usr/bin/env node

/**
 * Build script para EGAN TECH Tools
 * Compila la aplicación Node.js a ejecutable usando nexe
 */

const { compile } = require('nexe');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'dist');

async function build() {
  console.log('🔨 Compilando EGAN TECH Tools...\n');

  // Crear directorio de salida si no existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const options = {
    input: path.join(__dirname, 'index.js'),
    output: path.join(OUTPUT_DIR, 'egan-tools.exe'),
    target: 'windows-x64',
    resources: [
      path.join(__dirname, 'package.json')
    ]
  };

  console.log(`📄 Input: ${options.input}`);
  console.log(`📁 Output: ${options.output}`);
  console.log(`🎯 Target: ${options.target}\n`);

  try {
    await compile(options);
    console.log('\n✅ ¡Compilación exitosa!');
    console.log(`📦 Ejecutable generado: ${options.output}`);
    console.log('\n📌 Para usar:');
    console.log('   1. Copia "egan-tools.exe" a la carpeta del proyecto');
    console.log('   2. Ejecuta: egan-tools.exe');
  } catch (error) {
    console.error('\n❌ Error en la compilación:', error.message);
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
