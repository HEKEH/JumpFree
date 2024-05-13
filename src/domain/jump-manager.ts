import * as vscode from 'vscode';
import { DEFAULT_EXCLUDE_FOLDERS, JUMP_TARGET_PRIFIX } from '../consts';
import { findFileAndLine } from '../infra/find-file-and-line';
import { openFileAndJumpToLine } from '../infra/open-file-and-jump-to-line';
export class JumpManager {
  private _context: vscode.ExtensionContext;
  private constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }
  static create(context: vscode.ExtensionContext) {
    const manager = new JumpManager(context);
    // todo: promote performance
    return manager;
  }
  private _findFileAndLinesOfTarget(
    target: string,
  ): Promise<{ file: string; lineNumber: number }[]> | undefined {
    const regExp = new RegExp(`\\b${JUMP_TARGET_PRIFIX}\\s*${target}\\b`);
    const getActiveWorkspace = () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
        const resource = activeEditor.document.uri;
        // check if the resource (file) is part of any workspace folders
        const folder = vscode.workspace.getWorkspaceFolder(resource);
        if (folder) {
          return folder.uri.fsPath;
        }
      }
      return undefined;
    };
    const rootPath = getActiveWorkspace();
    if (rootPath) {
      return findFileAndLine(regExp, rootPath, DEFAULT_EXCLUDE_FOLDERS);
    }
  }
  async jumpToTarget(target: string) {
    console.log(target, 'jumpToTarget target start');
    try {
      const found = await this._findFileAndLinesOfTarget(target);
      console.log(found, 'findFileAndLine');
      if (found?.length) {
        const { file, lineNumber } = found[0];
        openFileAndJumpToLine({
          file,
          lineNumber,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
}
