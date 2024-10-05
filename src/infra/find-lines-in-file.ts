import * as vscode from 'vscode';

export async function findLinesInFile(
  regExp: RegExp,
  fileUri: vscode.Uri,
): Promise<{ lineNumber: number; line: string }[]> {
  const document = await vscode.workspace.openTextDocument(fileUri);
  const lines = document.getText().split('\n');

  return lines.reduce<{ lineNumber: number; line: string }[]>(
    (acc, line, index) => {
      if (regExp.test(line)) {
        acc.push({
          lineNumber: index + 1,
          line,
        });
      }
      return acc;
    },
    [] as { lineNumber: number; line: string }[],
  );
}
