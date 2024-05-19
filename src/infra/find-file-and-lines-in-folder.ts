import { spawn } from 'child_process';
import os from 'os';
import { rgPath } from '@vscode/ripgrep';
import { FileLineItem } from '../types';

export function findFileAndLinesInFolder(
  regExp: RegExp,
  rootFolderPath: string,
  excludeFiles: string[],
): Promise<FileLineItem[]> {
  console.log('findFileAndLines start');
  // Prepare ripgrep's arguments
  const args = [
    '-n', // Output line numbers
    '-uu', // Ignore .gitignore and .ignore
    // '--hidden', // Search hidden files and directories
    '-e',
    regExp.source, // The pattern to search for
    ...excludeFiles.flatMap(f => ['--glob', `!${f}`]), // Exclude files/folders
    rootFolderPath, // Directory to search
  ];

  return new Promise((resolve, reject) => {
    // Spawn the ripgrep process
    const rg = spawn(rgPath, args);
    let data = '';

    rg.stdout.setEncoding('utf-8').on('data', chunk => {
      data += chunk;
    });

    rg.on('close', () => {
      console.log(data, 'rg close');
      if (!data) {
        resolve([]);
        return;
      }
      const findItems = data.trim().split('\n');
      console.log(findItems, 'findItems');
      let matches: FileLineItem[];
      if (os.platform() === 'win32') {
        // windows
        matches = findItems.map(item => {
          const parts = item.split(':', 3);
          const file = parts[0] + ':' + parts[1];
          const lineNumber = parts[2];
          const line = item.slice(file.length + lineNumber.length + 2);
          return { file, lineNumber: Number(lineNumber), line };
        });
      } else {
        matches = findItems.map(item => {
          const parts = item.split(':', 2);
          const file = parts[0];
          const lineNumber = parts[1];
          const line = item.slice(file.length + lineNumber.length + 2);
          return { file, lineNumber: Number(lineNumber), line };
        });
      }
      resolve(matches);
    });
    rg.on('error', reject);
  });
}
