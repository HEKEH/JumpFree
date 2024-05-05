import * as vscode from 'vscode';

export class JumpLinkProvider implements vscode.DocumentLinkProvider {
  private _command: string;
  private _pattern: RegExp;
  private _targetKey: string;
  constructor({
    command,
    pattern,
    targetKey = 'target',
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
      const lineText = document.lineAt(i).text.trim();

      const match = this._pattern.exec(lineText);
      if (match !== null) {
        const target = parseInt(match.groups![this._targetKey]) - 1;
        console.log(target, 'target');
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
