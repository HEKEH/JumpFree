import * as vscode from 'vscode';
import { openFileAndJumpToLine } from '../infra/open-file-and-jump-to-line';
import { JumpTargetCollection } from './jump-target-collection';
export class JumpManager {
  /** vscode.Uri.toString() -> JumpTargetCollection */
  private _jumpTargetCollections: Record<string, JumpTargetCollection> = {};
  private constructor() {}

  private async _getCurrentJumpTargetCollection(
    uri: vscode.Uri,
  ): Promise<JumpTargetCollection | undefined> {
    const path = uri.toString();
    if (this._jumpTargetCollections[path]) {
      return this._jumpTargetCollections[path];
    }
    const workspaceRootFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (workspaceRootFolder) {
      const collection = new JumpTargetCollection();
      await collection.init({
        workspaceRootFolder,
      });
      this._jumpTargetCollections[workspaceRootFolder.uri.toString()] =
        collection;
      return collection;
    }
  }

  async onFileChange(uri: vscode.Uri) {
    const jumpTargetCollection = await this._getCurrentJumpTargetCollection(
      uri,
    );
    await jumpTargetCollection?.onFileChange(uri);
  }

  async onFileDelete(uri: vscode.Uri) {
    const jumpTargetCollection = await this._getCurrentJumpTargetCollection(
      uri,
    );
    await jumpTargetCollection?.onFileDelete(uri);
  }

  async onFileCreate(uri: vscode.Uri) {
    const jumpTargetCollection = await this._getCurrentJumpTargetCollection(
      uri,
    );
    await jumpTargetCollection?.onFileCreate(uri);
  }

  static async create() {
    const manager = new JumpManager();
    const workspaceRootFolders = vscode.workspace.workspaceFolders;
    await Promise.all(
      workspaceRootFolders?.map(async folder => {
        const jumpTargetCollection = new JumpTargetCollection();
        await jumpTargetCollection.init({
          workspaceRootFolder: folder,
        });
        manager._jumpTargetCollections[folder.uri.toString()] =
          jumpTargetCollection;
      }) || [],
    );
    return manager;
  }

  async jumpToTarget(tag: string, uri: string) {
    console.log(tag, 'jumpToTarget target start');
    try {
      const jumpTargetCollection = await this._getCurrentJumpTargetCollection(
        vscode.Uri.parse(uri),
      );
      const found = await jumpTargetCollection?.findTargetByTag(tag);
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
