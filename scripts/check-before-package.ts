// This script verifies before pacakging that necessary files are in the correct locations
import fs from 'fs';
import os from 'os';

console.log('Check before package');

const exe = os.platform() === 'win32' ? '.exe' : '';

const pathsToVerify = [`node_modules/@vscode/ripgrep/bin/rg${exe}`];

for (const path of pathsToVerify) {
  if (!fs.existsSync(path)) {
    throw new Error(`File ${path} does not exist`);
  }
}

console.log('All paths exist');
