import * as vscode from 'vscode';
import { JumpManager } from '../domain/jump-manager';
import { DEFAULT_EXCLUDED_FILES_PATTERN } from '../constants';
import { isPathMatchPatterns } from '../utils/is-path-match-patterns';

export class FileWatcher {
  private _jumpManager: JumpManager;
  private _watcher = vscode.workspace.createFileSystemWatcher('**/*');
  private _excludedPatterns: string[] = DEFAULT_EXCLUDED_FILES_PATTERN;
  constructor({ jumpManager }: { jumpManager: JumpManager }) {
    this._jumpManager = jumpManager;
    this._watchFileChange();
    this._watchFileDelete();
    this._watchFileCreate();
  }

  private _shouldIgnore(uri: vscode.Uri): boolean {
    return isPathMatchPatterns(uri.fsPath, this._excludedPatterns);
  }

  private _watchFileChange() {
    this._watcher.onDidChange(uri => {
      if (!this._shouldIgnore(uri)) {
        this._jumpManager.onFileChange(uri);
      }
    });
  }

  private _watchFileDelete() {
    this._watcher.onDidDelete(uri => {
      if (!this._shouldIgnore(uri)) {
        this._jumpManager.onFileDelete(uri);
      }
    });
  }

  private _watchFileCreate() {
    this._watcher.onDidCreate(uri => {
      if (!this._shouldIgnore(uri)) {
        this._jumpManager.onFileCreate(uri);
      }
    });
  }

  dispose() {
    this._watcher.dispose();
  }
}
