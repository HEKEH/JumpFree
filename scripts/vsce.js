const { spawn } = require('child_process');
const getPackageTarget = require('./utils/get-package-target');

const target = getPackageTarget();

const command = process.argv[2]; // publish or package

const subProcess = spawn('vsce', [command, '--target', target], {
  stdio: 'inherit',
});

subProcess.on('close', code => {
  if (code !== 0) {
    console.error(`vsce process exited with code ${code}`);
  } else {
    console.log('vsce process exited normally.');
  }
});
