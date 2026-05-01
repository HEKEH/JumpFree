import * as vscode from 'vscode';
import { JumpManager } from '../domain/jump-manager';
import { debugLog } from '../utils/logger';

const QUICK_IGNORE_PATTERNS = [
  '/node_modules/',
  '/.git/',
  '/dist/',
  '/build/',
  '/out/',
  '/.vscode/',
  '/coverage/',
  '/logs/',
  '\\node_modules\\',
  '\\.git\\',
  '\\dist\\',
  '\\build\\',
  '\\out\\',
  '\\.vscode\\',
  '\\coverage\\',
  '\\logs\\',
];

const QUICK_IGNORE_EXTENSIONS = ['.log', '.tmp', '.temp'];

export class FileWatcher {
  private _jumpManager: JumpManager;
  private _watcher = vscode.workspace.createFileSystemWatcher('**/*');

  constructor({ jumpManager }: { jumpManager: JumpManager }) {
    this._jumpManager = jumpManager;
    this._watchFileChange();
    this._watchFileDelete();
    this._watchFileCreate();
  }

  private _shouldQuickIgnore(uri: vscode.Uri): boolean {
    const fsPath = uri.fsPath;
    for (const pattern of QUICK_IGNORE_PATTERNS) {
      if (fsPath.includes(pattern)) {
        return true;
      }
    }
    for (const ext of QUICK_IGNORE_EXTENSIONS) {
      if (fsPath.endsWith(ext)) {
        return true;
      }
    }
    return false;
  }

  private _watchFileChange() {
    this._watcher.onDidChange(uri => {
      if (this._shouldQuickIgnore(uri)) {
        return;
      }
      debugLog(`File change event: ${uri.fsPath}`);
      this._jumpManager.onFileChange(uri);
    });
  }

  private _watchFileDelete() {
    this._watcher.onDidDelete(uri => {
      if (this._shouldQuickIgnore(uri)) {
        return;
      }
      debugLog(`File delete event: ${uri.fsPath}`);
      this._jumpManager.onFileDelete(uri);
    });
  }

  private _watchFileCreate() {
    this._watcher.onDidCreate(uri => {
      if (this._shouldQuickIgnore(uri)) {
        return;
      }
      debugLog(`File create event: ${uri.fsPath}`);
      this._jumpManager.onFileCreate(uri);
    });
  }

  dispose() {
    this._watcher.dispose();
  }
}
