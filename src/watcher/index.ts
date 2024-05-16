import { JumpManager } from '../domain/jump-manager';
import { FileWatcher } from './file-watcher';

export class JumpFreeWatcher {
  private _fileWatcher: FileWatcher;
  constructor(props: { jumpManager: JumpManager }) {
    this._fileWatcher = new FileWatcher(props);
  }
  dispose() {
    this._fileWatcher.dispose();
  }
}
