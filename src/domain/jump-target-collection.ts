import * as vscode from 'vscode';
import { getRootPath } from '../infra/get-root-path';
import { JumpTargetItem } from '../types';
import { getJumpTargetItemList } from '../utils/get-jump-target-item-list';
import { findLinesInFile } from '../infra/find-lines-in-file';
import { JUMP_TARGET_PATTERN } from '../constants';
import { getTargetTagFromLine } from '../utils/get-target-tag-from-line';

type SimplifiedJumpTargetItem = Omit<JumpTargetItem, 'file'>;

export class JumpTargetCollection {
  private _file2ItemsMap: {
    [filePath: string]: SimplifiedJumpTargetItem[];
  } = {};
  findTargetByTag(tag: string): JumpTargetItem | undefined {
    for (const filePath in this._file2ItemsMap) {
      const found = this._file2ItemsMap[filePath].find(
        item => item.tag === tag,
      );
      if (found) {
        return {
          file: filePath,
          lineNumber: found.lineNumber,
          tag: found.tag,
        };
      }
    }
  }
  clear() {
    this._file2ItemsMap = {};
  }
  private async _getCurrentItemList(excludedFilesPatterns: string[]) {
    const rootPath = getRootPath();
    console.log(rootPath, 'rootPath');
    if (rootPath) {
      const itemList = await getJumpTargetItemList(
        rootPath,
        excludedFilesPatterns,
      );
      console.log(itemList, 'getCurrentItemList');
      return itemList;
    }
    return [];
  }
  async init({ excludedFilesPatterns }: { excludedFilesPatterns: string[] }) {
    const list = await this._getCurrentItemList(excludedFilesPatterns);
    list.forEach(item => {
      const { file, ...others } = item;
      if (!this._file2ItemsMap[file]) {
        this._file2ItemsMap[file] = [];
      }
      this._file2ItemsMap[file].push(others);
    });
  }

  private async _getJumpTargetItemsFromFile(uri: vscode.Uri) {
    const lineItems = await findLinesInFile(JUMP_TARGET_PATTERN, uri);
    return lineItems
      .map(({ lineNumber, line }) => {
        const tag = getTargetTagFromLine(line);

        if (!tag) {
          console.error(`could not find tag from ${line}`);
          return;
        }

        return {
          lineNumber,
          tag,
        };
      })
      .filter(item => item) as JumpTargetItem[];
  }

  async onFileChange(uri: vscode.Uri) {
    console.log(`File changed: ${uri.fsPath}`);
    const filePath = uri.fsPath;
    delete this._file2ItemsMap[filePath];
    const jumpTargetItemList = await this._getJumpTargetItemsFromFile(uri);
    if (jumpTargetItemList.length) {
      this._file2ItemsMap[filePath] = jumpTargetItemList;
    }
  }

  onFileDelete(uri: vscode.Uri) {
    console.log(`File delete: ${uri.fsPath}`);
    delete this._file2ItemsMap[uri.fsPath];
  }

  async onFileCreate(uri: vscode.Uri) {
    console.log(`File create: ${uri.fsPath}`);
    const jumpTargetItemList = await this._getJumpTargetItemsFromFile(uri);
    if (jumpTargetItemList.length) {
      this._file2ItemsMap[uri.fsPath] = jumpTargetItemList;
    }
  }
}
