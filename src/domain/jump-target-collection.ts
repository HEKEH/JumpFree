import * as vscode from 'vscode';
import { debounce } from 'lodash';
import { JumpTargetItem } from '../types';
import { getJumpTargetItemList } from '../utils/get-jump-target-item-list';
import { findLinesInFile } from '../infra/find-lines-in-file';
import {
  DEFAULT_EXCLUDED_FILES_PATTERN,
  JUMP_TARGET_PATTERN,
} from '../constants';
import { getTargetTagFromLine } from '../utils/get-target-tag-from-line';
import { isPathMatchPatterns } from '../utils/is-path-match-patterns';

type SimplifiedJumpTargetItem = Omit<JumpTargetItem, 'file'>;

export class JumpTargetCollection {
  private _file2ItemsMap: {
    [filePath: string]: FileHasJumpTargetItems;
  } = {};

  // TODO get excluded files by workspace folder
  private _excludedFilesPatterns: string[] = DEFAULT_EXCLUDED_FILES_PATTERN;

  private _isReady: boolean = false;
  private _readyCallbacks: (() => void)[] = [];

  private _shouldWatchFile(filePath: string) {
    return !isPathMatchPatterns(filePath, this._excludedFilesPatterns);
  }

  async findTargetByTag(tag: string): Promise<JumpTargetItem | undefined> {
    await this._awaitReady();
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
  private _awaitReady() {
    if (!this._isReady) {
      return new Promise(resolve => {
        this._readyCallbacks.push(() => resolve(true));
      });
    }
  }

  private async _getCurrentItemList(
    excludedFilesPatterns: string[],
    rootPath: string,
  ) {
    console.log(rootPath, 'rootPath');
    const itemList = await getJumpTargetItemList(
      rootPath,
      excludedFilesPatterns,
    );
    console.log(itemList, 'getCurrentItemList');
    return itemList;
  }

  private _initReady() {
    this._isReady = true;
    this._readyCallbacks.forEach(cb => cb());
    this._readyCallbacks = [];
  }
  async init({
    workspaceRootFolder,
  }: {
    workspaceRootFolder: vscode.WorkspaceFolder;
  }) {
    // root path of workspace folder
    const rootPath = workspaceRootFolder.uri.fsPath;
    const list = await this._getCurrentItemList(
      this._excludedFilesPatterns,
      rootPath,
    );
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
    this._initReady();
  }

  async onFileChange(uri: vscode.Uri) {
    console.log(`File changed: ${uri.fsPath}`);
    await this._awaitReady();
    if (!this._shouldWatchFile(uri.fsPath)) {
      return;
    }
    if (!this._file2ItemsMap[uri.fsPath]) {
      this._file2ItemsMap[uri.fsPath] = new FileHasJumpTargetItems({
        filePath: uri.fsPath,
        items: [],
      });
    }
    await this._file2ItemsMap[uri.fsPath].onFileChange(uri);
  }

  async onFileDelete(uri: vscode.Uri) {
    await this._awaitReady();
    if (!this._shouldWatchFile(uri.fsPath)) {
      return;
    }
    console.log(`File delete: ${uri.fsPath}`);
    delete this._file2ItemsMap[uri.fsPath];
  }

  async onFileCreate(uri: vscode.Uri) {
    await this._awaitReady();
    if (!this._shouldWatchFile(uri.fsPath)) {
      return;
    }
    console.log(`File create: ${uri.fsPath}`);
    const fileObj = new FileHasJumpTargetItems({
      filePath: uri.fsPath,
      items: [],
    });
    this._file2ItemsMap[uri.fsPath] = fileObj;
    await fileObj.onFileChange(uri);
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
    try {
      this._items = await this._getJumpTargetItemsFromFile(uri);
    } catch (e) {
      console.error(e);
      this._items = [];
    }
  }
  onFileChange = debounce((uri: vscode.Uri) => this._onFileChange(uri), 500);
}
