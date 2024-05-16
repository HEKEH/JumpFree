import * as assert from 'assert';
import { isPathMatchPatterns } from '../is-path-match-patterns';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it

suite('isPathMatchPatterns', () => {
  test('should return false for non-matching', () => {
    const path = '/path/to/file';
    const patterns = ['*.js', '*.ts', '**/*.tsx'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), false);
  });

  test('should return true for matching pattern', () => {
    const path = '/path/to/file.tsx';
    const patterns = ['*.js', '*.ts', '**/*.tsx'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), true);
  });

  test('should return true for js file matching js pattern', () => {
    const path = '/path/to/file.js';
    const patterns = ['**/*.js'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), true);
  });

  test('should return true when file directly matches pattern', () => {
    const path = 'file.js';
    const patterns = ['*.js'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), true);
  });

  test('should return false for js file with different pattern', () => {
    const path = '/path/to/file.js';
    const patterns = ['*.js'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), false);
  });

  test('should return true for tsx file with case-insensitive match', () => {
    const path = '/Path/To/File.tsx';
    const patterns = ['**/*.tsx'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), true);
  });

  test('should return true for exact file path match with leading slash', () => {
    const path = '/path/to/file.js';
    const patterns = ['/path/to/file.js'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), true);
  });

  test('should return false for case-sensitive path mismatch', () => {
    const path = '/Path/To/file.js';
    const patterns = ['/path/to/file.js'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), false);
  });

  test('should return true for exact file path match with trailing slash', () => {
    const path = '/path/to/file.js/';
    const patterns = ['/path/to/file.js/'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), true);
  });

  test('should return true for file path with redundant slashes', () => {
    const path = '/path///to///file.js';
    const patterns = ['/path///to///file.js'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), true);
  });

  test('should return true for path that matches pattern with subdirectory', () => {
    const path = '/path/to/file.js';
    const patterns = ['**/to/*'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), true);
  });

  test('should return true for path that matches wildcard subdirectory pattern', () => {
    const path = '/path/to/file.js';
    const patterns = ['**/to/**'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), true);
  });

  test('should return false for non-js file on Windows path', () => {
    const path = 'C:\\path\\to\\file';
    const patterns = ['*.js'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), false);
  });

  test('should return true for js file match on Windows path', () => {
    const path = 'C:\\path\\to\\file.js';
    const patterns = ['**/*.js'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), true);
  });

  test('should return false for non-matching js file in root directory on Windows', () => {
    const path = 'C:\\file.js';
    const patterns = ['*.js'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), false);
  });

  test('should return true for path matching to wildcard subdirectory on Windows', () => {
    const path = 'C:\\path\\to\\file.js';
    const patterns = ['**/to/**'];
    assert.strictEqual(isPathMatchPatterns(path, patterns), true);
  });
});
