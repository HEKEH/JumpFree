import * as vscode from 'vscode';
import { DEFAULT_EXCLUDED_FILES_PATTERN } from '../constants';
import { openFileAndJumpToLine } from '../infra/open-file-and-jump-to-line';
import { isPathMatchPatterns } from '../utils/is-path-match-patterns';
import { JumpTargetCollection } from './jump-target-collection';
export class JumpManager {
  private _jumpTargetCollection!: JumpTargetCollection;
  /** todo: change according to settings */
  private _excludedFilesPatterns: string[] = DEFAULT_EXCLUDED_FILES_PATTERN;
  private constructor() {}

  private _shouldWatchFile(filePath: string) {
    return !isPathMatchPatterns(filePath, this._excludedFilesPatterns);
  }

  onFileChange(uri: vscode.Uri) {
    if (this._shouldWatchFile(uri.fsPath)) {
      this._jumpTargetCollection.onFileChange(uri);
    }
  }

  onFileDelete(uri: vscode.Uri) {
    if (this._shouldWatchFile(uri.fsPath)) {
      this._jumpTargetCollection.onFileDelete(uri);
    }
  }

  onFileCreate(uri: vscode.Uri) {
    if (this._shouldWatchFile(uri.fsPath)) {
      this._jumpTargetCollection.onFileCreate(uri);
    }
  }

  static async create() {
    const manager = new JumpManager();
    manager._jumpTargetCollection = new JumpTargetCollection();
    await manager._jumpTargetCollection.init({
      excludedFilesPatterns: manager._excludedFilesPatterns,
    });
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
