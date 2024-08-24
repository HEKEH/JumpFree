import { debounce } from 'lodash';
import * as vscode from 'vscode';
import {
  DEFAULT_EXCLUDED_FILES_PATTERN,
  JUMP_TARGET_PATTERN,
} from '../constants';
import { findLinesInFile } from '../infra/find-lines-in-file';
import { JumpTargetItem } from '../types';
import { getJumpTargetItemList } from '../utils/get-jump-target-item-list';
import { getTargetTagFromLine } from '../utils/get-target-tag-from-line';
import { isPathMatchPatterns } from '../utils/is-path-match-patterns';
import { GitIgnoreManager } from './gitignore-manager';

type SimplifiedJumpTargetItem = Omit<JumpTargetItem, 'file'>;

export class JumpTargetCollection {
  readonly workspaceRootFolder!: vscode.WorkspaceFolder;
  private _file2ItemsMap: {
    [filePath: string]: FileHasJumpTargetItems;
  } = {};

  // TODO get excluded files by workspace folder
  private _excludedFilesPatterns: string[] = DEFAULT_EXCLUDED_FILES_PATTERN;

  private _isReady: boolean = false;
  private _readyCallbacks: (() => void)[] = [];
  private _gitIgnoreManager = new GitIgnoreManager();
  private get rootPath() {
    return this.workspaceRootFolder.uri.fsPath;
  }

  private async _shouldIgnoreFile(uri: vscode.Uri) {
    const stat = await vscode.workspace.fs.stat(uri);
    // ignore folders
    if (stat.type !== vscode.FileType.File) {
      return true;
    }
    if (this._gitIgnoreManager.shouldIgnore(uri.fsPath)) {
      return true;
    }
    return isPathMatchPatterns(uri.fsPath, this._excludedFilesPatterns);
  }

  async findTargetsByTag(tag: string): Promise<JumpTargetItem[]> {
    await this._awaitReady();
    const result: JumpTargetItem[] = [];
    for (const filePath in this._file2ItemsMap) {
      // if (await this._shouldIgnoreFile(vscode.Uri.parse(filePath))) {
      //   continue;
      // }
      const found = this._file2ItemsMap[filePath].findItemsByTag(tag);
      if (found.length) {
        result.push(
          ...found.map(item => ({
            file: filePath,
            lineNumber: item.lineNumber,
            tag,
          })),
        );
      }
    }
    return result;
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

  private async _getCurrentItemList() {
    const itemList = await getJumpTargetItemList({
      rootFolderPath: this.rootPath,
      ignoreFilePaths: this._gitIgnoreManager.ignoreFilePaths,
      excludeFilePatterns: this._excludedFilesPatterns,
    });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.workspaceRootFolder as any) = workspaceRootFolder;
    await this._gitIgnoreManager.init({
      rootFolder: workspaceRootFolder,
    });
    const list = await this._getCurrentItemList();
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
    await this._gitIgnoreManager.onFileChange(uri);
    if (await this._shouldIgnoreFile(uri)) {
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
    await this._gitIgnoreManager.onFileDelete(uri);
    if (await this._shouldIgnoreFile(uri)) {
      return;
    }
    console.log(`File delete: ${uri.fsPath}`);
    delete this._file2ItemsMap[uri.fsPath];
  }

  async onFileCreate(uri: vscode.Uri) {
    await this.onFileChange(uri);
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
  findItemsByTag(tag: string) {
    return this._items.filter(item => item.tag === tag);
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
