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
import { debugLog } from '../utils/logger';
import { GitIgnoreManager } from './gitignore-manager';

type SimplifiedJumpTargetItem = Omit<JumpTargetItem, 'file'>;

const QUICK_IGNORE_PATTERNS = [
  '/node_modules/',
  '/.git/',
  '/dist/',
  '/build/',
  '/out/',
  '/.vscode/',
  '/coverage/',
  '/logs/',
  '\\node_modules\\',
  '\\.git\\',
  '\\dist\\',
  '\\build\\',
  '\\out\\',
  '\\.vscode\\',
  '\\coverage\\',
  '\\logs\\',
];

const QUICK_IGNORE_EXTENSIONS = ['.log', '.tmp', '.temp'];

export class JumpTargetCollection {
  readonly workspaceRootFolder!: vscode.WorkspaceFolder;
  private _file2ItemsMap: Map<string, FileHasJumpTargetItems> = new Map();

  private _excludedFilesPatterns: string[] = DEFAULT_EXCLUDED_FILES_PATTERN;

  private _isReady: boolean = false;
  private _readyCallbacks: (() => void)[] = [];
  private _gitIgnoreManager = new GitIgnoreManager();

  private _ignoreCache: Map<string, boolean> = new Map();
  private _initAbortController: AbortController | null = null;

  private get rootPath() {
    return this.workspaceRootFolder.uri.fsPath;
  }

  private _shouldQuickIgnore(fsPath: string): boolean {
    for (const pattern of QUICK_IGNORE_PATTERNS) {
      if (fsPath.includes(pattern)) {
        return true;
      }
    }
    for (const ext of QUICK_IGNORE_EXTENSIONS) {
      if (fsPath.endsWith(ext)) {
        return true;
      }
    }
    return false;
  }

  private async _shouldIgnoreFile(uri: vscode.Uri): Promise<boolean> {
    const fsPath = uri.fsPath;

    if (this._ignoreCache.has(fsPath)) {
      return this._ignoreCache.get(fsPath)!;
    }

    if (this._shouldQuickIgnore(fsPath)) {
      this._ignoreCache.set(fsPath, true);
      return true;
    }

    if (isPathMatchPatterns(fsPath, this._excludedFilesPatterns)) {
      this._ignoreCache.set(fsPath, true);
      return true;
    }

    if (this._gitIgnoreManager.shouldIgnore(fsPath)) {
      this._ignoreCache.set(fsPath, true);
      return true;
    }

    try {
      const stat = await vscode.workspace.fs.stat(uri);
      const isFile = stat.type === vscode.FileType.File;
      const shouldIgnore = !isFile;
      this._ignoreCache.set(fsPath, shouldIgnore);
      return shouldIgnore;
    } catch {
      this._ignoreCache.set(fsPath, true);
      return true;
    }
  }

  async findTargetsByTag(tag: string): Promise<JumpTargetItem[]> {
    await this._awaitReady();
    const result: JumpTargetItem[] = [];
    for (const [filePath, items] of this._file2ItemsMap) {
      const found = items.findItemsByTag(tag);
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
    this._file2ItemsMap.clear();
    this._ignoreCache.clear();
  }

  private _awaitReady() {
    if (!this._isReady) {
      return new Promise(resolve => {
        this._readyCallbacks.push(() => resolve(true));
      });
    }
  }

  private async _getCurrentItemList() {
    const { rootIgnoreFilePath } = this._gitIgnoreManager;
    let itemList = await getJumpTargetItemList({
      rootFolderPath: this.rootPath,
      ignoreFilePaths: rootIgnoreFilePath ? [rootIgnoreFilePath] : undefined,
      excludeFilePatterns: this._excludedFilesPatterns,
    });
    itemList = itemList.filter(
      item => !this._gitIgnoreManager.shouldIgnore(item.file),
    );
    debugLog(itemList, 'getCurrentItemList');
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
    if (this._initAbortController) {
      this._initAbortController.abort();
    }

    this._initAbortController = new AbortController();
    const signal = this._initAbortController.signal;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.workspaceRootFolder as any) = workspaceRootFolder;
    await this._gitIgnoreManager.init({
      rootFolder: workspaceRootFolder,
    });

    if (signal.aborted) {
      return;
    }

    const list = await this._getCurrentItemList();

    if (signal.aborted) {
      return;
    }

    list.forEach(item => {
      const { file, ...others } = item;
      if (!this._file2ItemsMap.has(file)) {
        this._file2ItemsMap.set(
          file,
          new FileHasJumpTargetItems({
            filePath: file,
            items: [],
          }),
        );
      }
      this._file2ItemsMap.get(file)!.push(others);
    });

    this._initReady();
  }

  async onFileChange(uri: vscode.Uri) {
    debugLog(`File changed: ${uri.fsPath}`);
    await this._awaitReady();
    await this._gitIgnoreManager.onFileChange(uri);
    if (await this._shouldIgnoreFile(uri)) {
      return;
    }
    if (!this._file2ItemsMap.has(uri.fsPath)) {
      this._file2ItemsMap.set(
        uri.fsPath,
        new FileHasJumpTargetItems({
          filePath: uri.fsPath,
          items: [],
        }),
      );
    }
    await this._file2ItemsMap.get(uri.fsPath)!.onFileChange(uri);
  }

  async onFileDelete(uri: vscode.Uri) {
    this._ignoreCache.delete(uri.fsPath);
    await this._awaitReady();
    await this._gitIgnoreManager.onFileDelete(uri);
    if (await this._shouldIgnoreFile(uri)) {
      return;
    }
    debugLog(`File delete: ${uri.fsPath}`);
    this._file2ItemsMap.delete(uri.fsPath);
  }

  async onFileCreate(uri: vscode.Uri) {
    await this.onFileChange(uri);
  }

  dispose() {
    if (this._initAbortController) {
      this._initAbortController.abort();
    }
    this.clear();
  }
}

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
          debugLog(`could not find tag from ${line}`);
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
      debugLog(e);
      this._items = [];
    }
  }
  onFileChange = debounce((uri: vscode.Uri) => this._onFileChange(uri), 500);
}
