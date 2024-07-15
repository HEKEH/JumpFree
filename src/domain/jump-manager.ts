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
    const workspaceRootFolder = vscode.workspace.getWorkspaceFolder(uri);
    const workspaceRootPath = workspaceRootFolder?.uri.toString();
    if (workspaceRootPath && this._jumpTargetCollections[workspaceRootPath]) {
      return this._jumpTargetCollections[workspaceRootPath];
    }
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

  async onWorkspaceFolderChange({
    removed,
    added,
  }: {
    added: readonly vscode.WorkspaceFolder[];
    removed: readonly vscode.WorkspaceFolder[];
  }) {
    removed.forEach(folder => {
      const path = folder.uri.toString();
      delete this._jumpTargetCollections[path];
    });
    await this._addJumpTargetCollections(added);
  }

  private async _addJumpTargetCollections(
    workspaceRootFolders: readonly vscode.WorkspaceFolder[],
  ) {
    if (!workspaceRootFolders.length) {
      return;
    }
    await Promise.all(
      workspaceRootFolders.map(async folder => {
        const jumpTargetCollection = new JumpTargetCollection();
        this._jumpTargetCollections[folder.uri.toString()] =
          jumpTargetCollection;
        await jumpTargetCollection.init({
          workspaceRootFolder: folder,
        });
      }),
    );
  }

  static async create() {
    const manager = new JumpManager();
    const workspaceRootFolders = vscode.workspace.workspaceFolders;
    if (workspaceRootFolders) {
      await manager._addJumpTargetCollections(workspaceRootFolders);
    }
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
        await openFileAndJumpToLine({
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
