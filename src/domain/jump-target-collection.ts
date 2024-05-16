import * as vscode from 'vscode';
import { getRootPath } from '../infra/get-root-path';
import { JumpTargetItem } from '../types';
import { getJumpTargetItemList } from '../utils/get-jump-target-item-list';

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

  onFileChange(uri: vscode.Uri) {
    console.log(`File changed: ${uri.fsPath}`);
    // delete this._file2ItemsMap[uri.fsPath];
  }

  onFileDelete(uri: vscode.Uri) {
    console.log(`File delete: ${uri.fsPath}`);
    delete this._file2ItemsMap[uri.fsPath];
  }

  onFileCreate(uri: vscode.Uri) {
    console.log(`File create: ${uri.fsPath}`);
  }
}
