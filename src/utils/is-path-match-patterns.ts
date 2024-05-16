import { minimatch } from 'minimatch';

/**
 * Checks if the given path matches any of the provided patterns.
 *
 * @param path - The path to check for a match.
 * @param patterns - An array of patterns to match.
 *
 * @returns `true` if the path matches any of the provided patterns, otherwise `false`.
 */
export function isPathMatchPatterns(path: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (minimatch(path, pattern)) {
      return true; // The file matches one of the patterns
    }
  }
  return false;
}
