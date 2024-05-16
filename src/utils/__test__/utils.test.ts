import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { isPathMatchPatterns } from '../is-path-match-patterns';

suite('Utils Test Suite', () => {
  vscode.window.showInformationMessage('Utils Test Start.');

  test('isPathMatchPatterns', () => {
    const patterns = [
      '**/node_modules/**',
      '**/.git/**',
      '**/.vscode/**',
      '**/dist/**',
      '**/.husky/**',
      '**/logs/**',
      '**/.idea/**',
    ];
    assert.equal(isPathMatchPatterns('/node_modules/a', patterns), true);
    assert.equal(isPathMatchPatterns('C:\\node_modules\\a', patterns), true);
    assert.equal(isPathMatchPatterns('node_module/a', patterns), false);
    assert.equal(isPathMatchPatterns('C:\\node_module\\a', patterns), false);
    assert.equal(isPathMatchPatterns('/dist/a1212.tsx', patterns), true);
    assert.equal(isPathMatchPatterns('distdist/a', patterns), false);
  });
});
