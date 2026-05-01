import * as vscode from 'vscode';

let _isDebugEnabled = false;

export function enableDebugLogging(enabled: boolean) {
  _isDebugEnabled = enabled;
}

export function debugLog(...args: unknown[]) {
  if (_isDebugEnabled) {
    console.log('[JumpFree]', ...args);
  }
}

export function registerLoggingConfigListener(): vscode.Disposable {
  const updateLogging = () => {
    const config = vscode.workspace.getConfiguration('jumpFree');
    enableDebugLogging(config.get<boolean>('debugLogging', false));
  };

  updateLogging();

  return vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('jumpFree.debugLogging')) {
      updateLogging();
    }
  });
}
