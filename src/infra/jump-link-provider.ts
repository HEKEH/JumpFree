import * as vscode from 'vscode';
import { DEFAULT_TAG_KEY } from '../constants';

export class JumpLinkProvider
  implements vscode.DocumentLinkProvider<vscode.DocumentLink>
{
  private _command: string;
  private _pattern: RegExp;
  private _targetKey: string;
  private _quickCheckPattern = 'JumpFreeTo:';
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

    // Quick check to see if document contains any potential jump links
    const text = document.getText();
    if (!text.includes(this._quickCheckPattern)) {
      return links;
    }

    for (let i = 0; i < document.lineCount; i++) {
      const lineText = document.lineAt(i).text;

      // Quick check to skip lines that don't contain the pattern
      if (!lineText.includes(this._quickCheckPattern)) {
        continue;
      }

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
              encodeURIComponent(
                JSON.stringify({ target, uri: document.uri.toString() }),
              ),
          ),
        );
        links.push(link);
      }
    }
    return links;
  }
}
