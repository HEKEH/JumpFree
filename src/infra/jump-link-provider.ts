import * as vscode from 'vscode';
import { DEFAULT_TAG_KEY } from '../consts';

export class JumpLinkProvider implements vscode.DocumentLinkProvider {
  private _command: string;
  private _pattern: RegExp;
  private _targetKey: string;
  constructor({
    command,
    pattern,
    targetKey = DEFAULT_TAG_KEY,
  }: {
    command: string;
    pattern: RegExp;
    targetKey?: string;
  }) {
    this._command = command;
    this._pattern = pattern;
    this._targetKey = targetKey;
  }
  provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
    const links: vscode.DocumentLink[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const lineText = document.lineAt(i).text;

      const match = this._pattern.exec(lineText);
      if (match !== null) {
        const target = match.groups![this._targetKey];
        const range = new vscode.Range(
          i,
          match.index,
          i,
          match.index + match[0].length,
        );
        const link = new vscode.DocumentLink(
          range,
          vscode.Uri.parse(
            `command:${this._command}?` +
              encodeURIComponent(JSON.stringify({ target })),
          ),
        );
        links.push(link);
      }
    }
    return links;
  }
}
