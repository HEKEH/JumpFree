import path from 'path';
import * as vscode from 'vscode';
import { openFileAndJumpToLine } from '../infra/open-file-and-jump-to-line';
import { showCustomMenu } from '../infra/menu';
import { debugLog } from '../utils/logger';
import { JumpTargetCollection } from './jump-target-collection';

export class JumpManager {
  private _jumpTargetCollections: Map<string, JumpTargetCollection> = new Map();
  private _initializationPromises: Map<string, Promise<JumpTargetCollection>> =
    new Map();
  private constructor() {}

  private async _getCurrentJumpTargetCollection(
    uri: vscode.Uri,
  ): Promise<JumpTargetCollection | undefined> {
    const workspaceRootFolder = vscode.workspace.getWorkspaceFolder(uri);
    const workspaceRootPath = workspaceRootFolder?.uri.toString();

    if (!workspaceRootPath) {
      return undefined;
    }

    const existingCollection =
      this._jumpTargetCollections.get(workspaceRootPath);
    if (existingCollection) {
      return existingCollection;
    }

    const existingPromise = this._initializationPromises.get(workspaceRootPath);
    if (existingPromise) {
      return existingPromise;
    }

    if (workspaceRootFolder) {
      const initPromise = this._initWorkspaceFolder(workspaceRootFolder);
      this._initializationPromises.set(workspaceRootPath, initPromise);
      try {
        const collection = await initPromise;
        return collection;
      } finally {
        this._initializationPromises.delete(workspaceRootPath);
      }
    }

    return undefined;
  }

  private async _initWorkspaceFolder(
    workspaceRootFolder: vscode.WorkspaceFolder,
  ): Promise<JumpTargetCollection> {
    const collection = new JumpTargetCollection();
    await collection.init({
      workspaceRootFolder,
    });
    this._jumpTargetCollections.set(
      workspaceRootFolder.uri.toString(),
      collection,
    );
    debugLog(`Workspace folder initialized: ${workspaceRootFolder.uri.fsPath}`);
    return collection;
  }

  async onFileChange(uri: vscode.Uri) {
    const jumpTargetCollection = this._jumpTargetCollections.get(
      vscode.workspace.getWorkspaceFolder(uri)?.uri.toString() || '',
    );
    if (!jumpTargetCollection) {
      return;
    }
    await jumpTargetCollection.onFileChange(uri);
  }

  async onFileDelete(uri: vscode.Uri) {
    const jumpTargetCollection = this._jumpTargetCollections.get(
      vscode.workspace.getWorkspaceFolder(uri)?.uri.toString() || '',
    );
    if (!jumpTargetCollection) {
      return;
    }
    await jumpTargetCollection.onFileDelete(uri);
  }

  async onFileCreate(uri: vscode.Uri) {
    const jumpTargetCollection = this._jumpTargetCollections.get(
      vscode.workspace.getWorkspaceFolder(uri)?.uri.toString() || '',
    );
    if (!jumpTargetCollection) {
      return;
    }
    await jumpTargetCollection.onFileCreate(uri);
  }

  async onWorkspaceFolderChange({
    removed,
  }: {
    added: readonly vscode.WorkspaceFolder[];
    removed: readonly vscode.WorkspaceFolder[];
  }) {
    removed.forEach(folder => {
      const path = folder.uri.toString();
      const collection = this._jumpTargetCollections.get(path);
      collection?.dispose();
      this._jumpTargetCollections.delete(path);
      this._initializationPromises.delete(path);
    });
  }

  async ensureInitialized(): Promise<void> {
    const workspaceRootFolders = vscode.workspace.workspaceFolders;
    if (!workspaceRootFolders) {
      return;
    }

    for (const folder of workspaceRootFolders) {
      const folderPath = folder.uri.toString();
      if (
        !this._jumpTargetCollections.has(folderPath) &&
        !this._initializationPromises.has(folderPath)
      ) {
        await this._initWorkspaceFolder(folder);
      }
    }
  }

  static create(): JumpManager {
    return new JumpManager();
  }

  async jumpToTarget(tag: string, uri: string) {
    debugLog(tag, 'jumpToTarget target start');
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
      debugLog(e);
    }
  }

  dispose() {
    for (const collection of this._jumpTargetCollections.values()) {
      collection.dispose();
    }
    this._jumpTargetCollections.clear();
    this._initializationPromises.clear();
  }
}
