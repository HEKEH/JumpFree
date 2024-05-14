import { spawn } from 'child_process';
import { config } from 'dotenv';
import getPackageTarget from './utils/get-package-target';
import getSpawnOptions from './utils/get-spawn-options';

const target = getPackageTarget();

const command = process.argv[2] as 'publish' | 'package';
if (command === 'publish') {
  config(); // get VSCE_PAT from .env
}

const subProcess = spawn('vsce', [command, '--target', target], {
  stdio: 'inherit',
  ...getSpawnOptions(),
});

subProcess.on('close', code => {
  if (code !== 0) {
    console.error(`vsce process exited with code ${code}`);
  } else {
    console.log('vsce process exited normally.');
  }
});
