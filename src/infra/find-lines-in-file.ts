import * as vscode from 'vscode';

export async function findLinesInFile(
  regExp: RegExp,
  fileUri: vscode.Uri,
): Promise<
  {
    lineNumber: number;
    line: string;
  }[]
> {
  const res: {
    lineNumber: number;
    line: string;
  }[] = [];
  const document = await vscode.workspace.openTextDocument(fileUri);
  for (let i = 0; i < document.lineCount; i++) {
    const lineText = document.lineAt(i).text;

    const match = lineText.match(regExp);
    if (match !== null) {
      res.push({
        lineNumber: i + 1,
        line: lineText,
      });
    }
  }
  return res;
}
