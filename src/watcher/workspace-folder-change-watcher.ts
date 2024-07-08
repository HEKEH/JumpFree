import * as vscode from 'vscode';
import { JumpManager } from '../domain/jump-manager';

export class WorkspaceFolderChangeWatcher {
  private _jumpManager: JumpManager;
  private _watcher: vscode.Disposable;
  constructor({ jumpManager }: { jumpManager: JumpManager }) {
    this._jumpManager = jumpManager;
    this._watcher = vscode.workspace.onDidChangeWorkspaceFolders(event => {
      this._handleChangeEvent(event);
    });
  }

  private _handleChangeEvent(event: vscode.WorkspaceFoldersChangeEvent) {
    this._jumpManager.onWorkspaceFolderChange(event);
  }

  dispose() {
    this._watcher.dispose();
  }
}
