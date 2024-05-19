import * as vscode from 'vscode';
import { debounce } from 'lodash';
import { getRootPath } from '../infra/get-root-path';
import { JumpTargetItem } from '../types';
import { getJumpTargetItemList } from '../utils/get-jump-target-item-list';
import { findLinesInFile } from '../infra/find-lines-in-file';
import { JUMP_TARGET_PATTERN } from '../constants';
import { getTargetTagFromLine } from '../utils/get-target-tag-from-line';

type SimplifiedJumpTargetItem = Omit<JumpTargetItem, 'file'>;

export class JumpTargetCollection {
  private _file2ItemsMap: {
    [filePath: string]: FileHasJumpTargetItems;
  } = {};
  findTargetByTag(tag: string): JumpTargetItem | undefined {
    for (const filePath in this._file2ItemsMap) {
      const found = this._file2ItemsMap[filePath].findItemByTag(tag);
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
        this._file2ItemsMap[file] = new FileHasJumpTargetItems({
          filePath: file,
          items: [],
        });
      }
      this._file2ItemsMap[file].push(others);
    });
  }

  onFileChange(uri: vscode.Uri) {
    console.log(`File changed: ${uri.fsPath}`);
    return this._file2ItemsMap[uri.fsPath].onFileChange(uri);
  }

  onFileDelete(uri: vscode.Uri) {
    console.log(`File delete: ${uri.fsPath}`);
    delete this._file2ItemsMap[uri.fsPath];
  }

  onFileCreate(uri: vscode.Uri) {
    console.log(`File create: ${uri.fsPath}`);
    const fileObj = new FileHasJumpTargetItems({
      filePath: uri.fsPath,
      items: [],
    });
    this._file2ItemsMap[uri.fsPath] = fileObj;
    return fileObj.onFileChange(uri);
  }
}

/** the main purpose of this class is to debounce the file change handle */
class FileHasJumpTargetItems {
  private _filePath: string;
  private _items: SimplifiedJumpTargetItem[];

  constructor({
    filePath,
    items,
  }: {
    filePath: string;
    items: SimplifiedJumpTargetItem[];
  }) {
    this._filePath = filePath;
    this._items = items;
  }
  push(item: SimplifiedJumpTargetItem) {
    this._items.push(item);
  }
  findItemByTag(tag: string) {
    return this._items.find(item => item.tag === tag);
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
  private async _onFileChange(uri: vscode.Uri) {
    if (uri.fsPath !== this._filePath) {
      throw new Error("uri and filePath don't match");
    }
    this._items = await this._getJumpTargetItemsFromFile(uri);
  }
  onFileChange = debounce((uri: vscode.Uri) => this._onFileChange(uri), 500);
}
