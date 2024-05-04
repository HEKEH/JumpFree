import * as vscode from 'vscode';
import { Commands } from './consts';

export class JumpLinkProvider implements vscode.DocumentLinkProvider {
  provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
    const links: vscode.DocumentLink[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const lineText = document.lineAt(i).text;
      if (lineText.trim().startsWith('// jumpTo')) {
        const jumpToPattern = /\bjumpTo\s+(\d+)\b/g;
        const match = jumpToPattern.exec(lineText);
        if (match !== null) {
          const targetLine = parseInt(match[1]) - 1;
          const range = new vscode.Range(
            i,
            match.index,
            i,
            match.index + match[0].length,
          );
          const link = new vscode.DocumentLink(
            range,
            vscode.Uri.parse(
              `command:${Commands.jumpTo}?` +
                encodeURIComponent(JSON.stringify({ targetLine })),
            ),
          );
          links.push(link);
        }
      }
    }
    return links;
  }
}
