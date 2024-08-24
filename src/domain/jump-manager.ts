import path from 'path';
import * as vscode from 'vscode';
import { openFileAndJumpToLine } from '../infra/open-file-and-jump-to-line';
import { showCustomMenu } from '../infra/menu';
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
      if (!jumpTargetCollection) {
        vscode.window.showWarningMessage(
          vscode.l10n.t('Jump target not found'),
        );
        return;
      }
      const found = await jumpTargetCollection.findTargetsByTag(tag);
      if (!found.length) {
        vscode.window.showWarningMessage(
          vscode.l10n.t('Jump target not found'),
        );
        return;
      }
      // if only one target, jump directly
      if (found.length === 1) {
        const { file, lineNumber } = found[0];
        await openFileAndJumpToLine({
          file,
          lineNumber,
        });
        return;
      }
      const rootDir = jumpTargetCollection.workspaceRootFolder.uri.fsPath;
      const hasMultipleWorkspaceFolders =
        (vscode.workspace.workspaceFolders || []).length > 1;
      await showCustomMenu(
        found.map(item => {
          const relativePath = path.relative(rootDir, item.file);
          return {
            label: hasMultipleWorkspaceFolders
              ? `${jumpTargetCollection.workspaceRootFolder.name} · ${relativePath}`
              : relativePath,
            description: vscode.l10n.t('Line {0}', item.lineNumber),
            action: async () => {
              await openFileAndJumpToLine({
                file: item.file,
                lineNumber: item.lineNumber,
              });
            },
          };
        }),
        vscode.l10n.t('Choose a jump target'),
      );
    } catch (e) {
      console.error(e);
    }
  }
}
