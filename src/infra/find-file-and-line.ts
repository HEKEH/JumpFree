import { spawn } from 'child_process';
import os from 'os';
import { rgPath } from '@vscode/ripgrep';

export function findFileAndLine(
  regexp: RegExp,
  rootPath: string,
  excludeFiles: string[] = ['**/node_modules/**'],
): Promise<{ file: string; lineNumber: number }[]> {
  console.log('findFileAndLine start');
  // Prepare ripgrep's arguments
  const args = [
    '-n', // Output line numbers
    '-uu', // Ignore .gitignore and .ignore
    // '--hidden', // Search hidden files and directories
    '-e',
    regexp.source, // The pattern to search for
    ...excludeFiles.flatMap(f => ['--glob', `!${f}`]), // Exclude files/folders
    rootPath, // Directory to search
  ];

  return new Promise((resolve, reject) => {
    // Spawn the ripgrep process
    const rg = spawn(rgPath, args);
    let data = '';

    rg.stdout.setEncoding('utf-8').on('data', chunk => {
      data += chunk;
    });

    rg.on('close', () => {
      const lines = data.trim().split('\n');
      console.log(lines, 'lines');
      let matches: { file: string; lineNumber: number }[];
      if (os.platform() === 'win32') {
        // windows
        matches = lines.map(line => {
          const parts = line.split(':', 3);
          const file = parts[0] + ':' + parts[1];
          const lineNumber = Number(parts[2]);
          return { file, lineNumber };
        });
      } else {
        matches = lines.map(line => {
          const parts = line.split(':', 2);
          const file = parts[0];
          const lineNumber = Number(parts[1]);
          return { file, lineNumber };
        });
      }
      resolve(matches);
    });
    rg.on('error', reject);
  });
}
