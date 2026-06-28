#!/usr/bin/env node

/**
 * TecMan Fixes - Índice de soluciones
 * Auto-generado por Fix Builder
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const fixes = [
  {
    "name": "fix-black-screen",
    "description": "fix-black-screen"
  },
  {
    "name": "fix-browser-cache",
    "description": "fix-browser-cache"
  },
  {
    "name": "fix-bsod-diag",
    "description": "fix-bsod-diag"
  },
  {
    "name": "fix-network-dns",
    "description": "fix-network-dns"
  },
  {
    "name": "fix-outlook",
    "description": "fix-outlook"
  },
  {
    "name": "fix-printer",
    "description": "fix-printer"
  },
  {
    "name": "fix-repair-windows",
    "description": "fix-repair-windows"
  },
  {
    "name": "fix-slow-pc",
    "description": "fix-slow-pc"
  },
  {
    "name": "fix-vpn",
    "description": "fix-vpn"
  },
  {
    "name": "fix-wifi",
    "description": "fix-wifi"
  },
  {
    "name": "fix-windows-update",
    "description": "fix-windows-update"
  },
  {
    "name": "install-anydesk",
    "description": "install-anydesk"
  },
  {
    "name": "install-rustdesk",
    "description": "install-rustdesk"
  },
  {
    "name": "install-tools-winget",
    "description": "install-tools-winget"
  }
];

async function main() {
  console.log(chalk.cyan('\n=== TecMan Fixes - Soluciones ===\n'));

  const { fix } = await inquirer.prompt([{
    type: 'list',
    name: 'fix',
    message: 'Selecciona una solución:',
    choices: fixes.map(f => ({ name: f.description, value: f.name }))
  }]);

  const fixPath = path.join(__dirname, `${fix}.js`);
  if (fs.existsSync(fixPath)) {
    require(fixPath);
  } else {
    console.log(chalk.red('Solución no encontrada'));
  }
}

main();
