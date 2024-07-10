import { readFileSync } from 'fs';
import path from 'path';
import ignore, { Ignore } from 'ignore';
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

type SimplifiedJumpTargetItem = Omit<JumpTargetItem, 'file'>;

export class JumpTargetCollection {
  private _rootPath!: string;
  private _file2ItemsMap: {
    [filePath: string]: FileHasJumpTargetItems;
  } = {};

  // TODO get excluded files by workspace folder
  private _excludedFilesPatterns: string[] = DEFAULT_EXCLUDED_FILES_PATTERN;
  private _ignoreFileExists?: boolean;

  private _ig?: Ignore;

  private _isReady: boolean = false;
  private _readyCallbacks: (() => void)[] = [];

  private async _shouldFileBeIgnored(uri: vscode.Uri) {
    const stat = await vscode.workspace.fs.stat(uri);
    // ignore folders
    if (stat.type !== vscode.FileType.File) {
      return true;
    }
    if (this._ig?.ignores(path.relative(this._rootPath, uri.fsPath))) {
      return true;
    }
    return isPathMatchPatterns(uri.fsPath, this._excludedFilesPatterns);
  }

  private get possibleIgnoreFilePath(): string {
    return path.join(this._rootPath, '.gitignore');
  }

  async findTargetByTag(tag: string): Promise<JumpTargetItem | undefined> {
    await this._awaitReady();
    for (const filePath in this._file2ItemsMap) {
      if (await this._shouldFileBeIgnored(vscode.Uri.parse(filePath))) {
        continue;
      }
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

  private async _getCurrentItemList(rootPath: string) {
    console.log(rootPath, 'rootPath');
    const itemList = await getJumpTargetItemList({
      rootFolderPath: rootPath,
      ignoreFilePath: this._ignoreFileExists
        ? this.possibleIgnoreFilePath
        : undefined,
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
  private _handleGitIgnoreFile() {
    const possibleGitIgnorePath = path.join(this._rootPath, '.gitignore');
    try {
      const fileContent = readFileSync(possibleGitIgnorePath, {
        encoding: 'utf8',
      });
      this._ignoreFileExists = true;
      const ig = ignore();
      ig.add(fileContent.toString());
      this._ig = ig;
    } catch (err) {
      this._ignoreFileExists = false;
      this._ig = undefined;
    }
  }
  async init({
    workspaceRootFolder,
  }: {
    workspaceRootFolder: vscode.WorkspaceFolder;
  }) {
    // root path of workspace folder
    this._rootPath = workspaceRootFolder.uri.fsPath;
    this._handleGitIgnoreFile();
    const list = await this._getCurrentItemList(this._rootPath);
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
    if (uri.fsPath === this.possibleIgnoreFilePath) {
      this._handleGitIgnoreFile();
    }
    if (await this._shouldFileBeIgnored(uri)) {
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
    if (uri.fsPath === this.possibleIgnoreFilePath) {
      this._handleGitIgnoreFile();
    }
    if (await this._shouldFileBeIgnored(uri)) {
      return;
    }
    console.log(`File delete: ${uri.fsPath}`);
    delete this._file2ItemsMap[uri.fsPath];
  }

  async onFileCreate(uri: vscode.Uri) {
    await this._awaitReady();
    if (uri.fsPath === this.possibleIgnoreFilePath) {
      this._handleGitIgnoreFile();
    }
    if (await this._shouldFileBeIgnored(uri)) {
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
