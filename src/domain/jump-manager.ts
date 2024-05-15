import { openFileAndJumpToLine } from '../infra/open-file-and-jump-to-line';
import { JumpTargetCollection } from './jump-target-collection';
export class JumpManager {
  private _jumpTargetCollection!: JumpTargetCollection;
  private constructor() {}
  static async create() {
    const manager = new JumpManager();
    manager._jumpTargetCollection = new JumpTargetCollection();
    await manager._jumpTargetCollection.init();
    return manager;
  }

  async jumpToTarget(tag: string) {
    console.log(tag, 'jumpToTarget target start');
    try {
      const found = this._jumpTargetCollection.findTargetByTag(tag);
      if (found) {
        const { file, lineNumber } = found;
        openFileAndJumpToLine({
          file,
          lineNumber,
        });
      } else {
        // TODO message
      }
    } catch (e) {
      console.error(e);
    }
  }
}
