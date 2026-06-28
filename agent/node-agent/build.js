#!/usr/bin/env node

/**
 * Build script para TecMan Discovery Agent
 * Compila a ejecutable usando nexe
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, '..', 'dist-agent');

async function build() {
  console.log('🔨 Compilando TecMan Discovery Agent...\n');

  // Crear directorio de salida
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const inputFile = path.join(__dirname, 'index.js');
  const outputFile = path.join(OUTPUT_DIR, 'tecman-discovery.exe');

  console.log(`📄 Input: ${inputFile}`);
  console.log(`📁 Output: ${outputFile}`);
  console.log(`🎯 Target: windows-x64\n`);

  try {
    // Verificar nexe
    try {
      execSync('nexe --version', { stdio: 'pipe' });
    } catch {
      console.log('⚠️  Instalando nexe...');
      execSync('npm install -g nexe', { stdio: 'inherit' });
    }

    // Compilar
    console.log('📦 Compilando...');
    execSync(`nexe "${inputFile}" -o "${outputFile}" -t windows-x64`, {
      stdio: 'inherit',
      cwd: __dirname
    });

    console.log('\n✅ ¡Compilación exitosa!');
    console.log(`📦 Ejecutable: ${outputFile}`);
    console.log('\n📌 Uso:');
    console.log('   tecman-discovery.exe --server 192.168.1.100:3001 --install');
    console.log('   tecman-discovery.exe --host servidor.local --once');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Alternativa: node index.js --server <url> --once');
    process.exit(1);
  }
}

// Verificar argumentos
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
TecMan Discovery Agent - Build Script

Uso: node build.js
  `);
  process.exit(0);
}

build();
