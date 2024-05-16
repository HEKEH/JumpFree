import { JumpManager } from '../domain/jump-manager';
import { FileWatcher } from './file-watcher';

export class JumpFreeWatcher {
  private _fileWatcher = new FileWatcher();
  init(props: { jumpManager: JumpManager }) {
    this._fileWatcher.init(props);
  }
  dispose() {
    this._fileWatcher.dispose();
  }
}
