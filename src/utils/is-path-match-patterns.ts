import { minimatch } from 'minimatch';

/**
 *
 * @param path: like dist/index.html, C:\biz\foo.ts
 * @param patterns: like ['**\/node_modules/**', '**\/dist/**']
 */
export function isPathMatchPatterns(path: string, patterns: string[]) {
  // Check the file path against each pattern
  for (const pattern of patterns) {
    if (minimatch(path, pattern)) {
      return true; // The file matches one of the exclusion patterns
    }
  }
  return false;
}
