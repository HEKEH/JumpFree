// This script verifies before pacakging that necessary files are in the correct locations
import fs from 'fs';

console.log('Check after compile');

const pathsToVerify = ['dist/extension.js'];

for (const path of pathsToVerify) {
  if (!fs.existsSync(path)) {
    throw new Error(`File ${path} does not exist`);
  }
}

console.log('Compile check pass');
