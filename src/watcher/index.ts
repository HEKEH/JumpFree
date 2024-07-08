import { JumpManager } from '../domain/jump-manager';
import { FileWatcher } from './file-watcher';
import { WorkspaceFolderChangeWatcher } from './workspace-folder-change-watcher';

export class JumpFreeWatcher {
  private _fileWatcher: FileWatcher;
  private _workspaceFolderChangeWatcher: WorkspaceFolderChangeWatcher;
  constructor(props: { jumpManager: JumpManager }) {
    this._fileWatcher = new FileWatcher(props);
    this._workspaceFolderChangeWatcher = new WorkspaceFolderChangeWatcher(
      props,
    );
  }
  dispose() {
    this._fileWatcher.dispose();
    this._workspaceFolderChangeWatcher.dispose();
  }
}
