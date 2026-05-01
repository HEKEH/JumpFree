import { spawn } from 'child_process';
import os from 'os';
import { rgPath } from '@vscode/ripgrep';
import { FileLineItem } from '../types';
import { debugLog } from '../utils/logger';

export function findFileAndLinesInFolder({
  regExp,
  rootFolderPath,
  excludeFilePatterns,
  ignoreFilePaths,
}: {
  regExp: RegExp;
  rootFolderPath: string;
  excludeFilePatterns?: string[];
  ignoreFilePaths?: string[];
}): Promise<FileLineItem[]> {
  debugLog('findFileAndLines start');
  const args = [
    '-n',
    '-uu',
    '-e',
    regExp.source,
    ...(ignoreFilePaths?.flatMap(f => ['--ignore-file', f]) || []),
    ...(excludeFilePatterns?.flatMap(f => ['--glob', `!${f}`]) || []),
    rootFolderPath,
  ];

  return new Promise((resolve, reject) => {
    const rg = spawn(rgPath, args);
    let data = '';

    rg.stdout.setEncoding('utf-8').on('data', chunk => {
      data += chunk;
    });

    rg.on('close', () => {
      debugLog(data, 'rg close');
      if (!data) {
        resolve([]);
        return;
      }
      const findItems = data.trim().split('\n');
      debugLog(findItems, 'findItems');
      let matches: FileLineItem[];
      if (os.platform() === 'win32') {
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
