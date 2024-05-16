import * as vscode from 'vscode';
import { JumpManager } from '../domain/jump-manager';

export class FileWatcher {
  private _jumpManager: JumpManager;
  private _watcher = vscode.workspace.createFileSystemWatcher('**/*');
  constructor({ jumpManager }: { jumpManager: JumpManager }) {
    this._jumpManager = jumpManager;
    this._watchFileChange();
    this._watchFileDelete();
    this._watchFileCreate();
  }

  private _watchFileChange() {
    this._watcher.onDidChange(uri => {
      this._jumpManager.onFileChange(uri);
    });
  }

  private _watchFileDelete() {
    this._watcher.onDidDelete(uri => {
      this._jumpManager.onFileDelete(uri);
    });
  }

  private _watchFileCreate() {
    this._watcher.onDidCreate(uri => {
      this._jumpManager.onFileCreate(uri);
    });
  }

  dispose() {
    this._watcher.dispose();
  }
}
