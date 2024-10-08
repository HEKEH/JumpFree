import path from 'path';
import ignore, { Ignore } from 'ignore';
import * as vscode from 'vscode';
import { isFileExist } from '../utils/is-file-exist';

export class GitIgnoreManager {
  private _ignoreItems: GitIgnoreItem[] = [];
  private _rootPath: string = '';

  get ignoreFilePaths() {
    return this._ignoreItems.map(item => item.ignoreFilePath);
  }
  get rootIgnoreFilePath() {
    const possibleGitIgnorePath = path.join(this._rootPath, '.gitignore');
    if (isFileExist(possibleGitIgnorePath)) {
      return possibleGitIgnorePath;
    }
    return undefined;
  }
  async init({ rootFolder }: { rootFolder: vscode.WorkspaceFolder }) {
    this._rootPath = rootFolder.uri.fsPath;
    // use vscode.workspace.findFiles to find all .gitignore files
    const ignoreFileUris = await vscode.workspace.findFiles(
      new vscode.RelativePattern(rootFolder, '**/.gitignore'),
    );
    this._ignoreItems = ignoreFileUris.map(
      ignoreFileUri => new GitIgnoreItem({ ignoreFileUri }),
    );
    await Promise.all(this._ignoreItems.map(item => item.init()));
  }
  shouldIgnore(filePath: string): boolean {
    return this._ignoreItems.some(item => item.shouldIgnore(filePath));
  }

  private _isIgnoreFile(uri: vscode.Uri): boolean {
    return uri.fsPath.endsWith('.gitignore');
  }

  async onFileChange(uri: vscode.Uri) {
    if (!this._isIgnoreFile(uri)) {
      return;
    }
    let item = this._ignoreItems.find(i => i.ignoreFilePath === uri.fsPath);
    if (!item) {
      item = new GitIgnoreItem({ ignoreFileUri: uri });
      this._ignoreItems.push(item);
      await item.init();
    } else {
      await item.onChange();
    }
  }

  async onFileDelete(uri: vscode.Uri) {
    if (!this._isIgnoreFile(uri)) {
      return;
    }
    const index = this._ignoreItems.findIndex(
      item => item.ignoreFilePath === uri.fsPath,
    );
    if (index >= 0) {
      this._ignoreItems.splice(index, 1);
    }
  }
}

class GitIgnoreItem {
  readonly ignoreFileUri: vscode.Uri;
  private _ignore: Ignore = ignore();
  constructor(props: { ignoreFileUri: vscode.Uri }) {
    this.ignoreFileUri = props.ignoreFileUri;
  }
  get ignoreFilePath() {
    return this.ignoreFileUri.fsPath;
  }
  shouldIgnore(filePath: string): boolean {
    const relativePath = path.relative(
      path.dirname(this.ignoreFilePath),
      filePath,
    );
    if (relativePath.startsWith('..')) {
      return false;
    }
    return this._ignore.ignores(relativePath);
  }
  async init() {
    const content = await vscode.workspace.fs.readFile(this.ignoreFileUri);
    this._ignore.add(content.toString());
  }
  async onChange() {
    const content = await vscode.workspace.fs.readFile(this.ignoreFileUri);
    this._ignore = ignore();
    this._ignore.add(content.toString());
  }
}
