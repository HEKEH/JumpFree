import { Position, Selection, Uri, workspace, window } from 'vscode';

export async function openFileAndJumpToLine({
  file,
  lineNumber,
}: {
  file: string;
  lineNumber: number;
}) {
  const document = await workspace.openTextDocument(Uri.file(file));
  const editor = await window.showTextDocument(document);

  if (editor) {
    const position = new Position(lineNumber - 1, 0);
    editor.selection = new Selection(position, position);
    editor.revealRange(editor.selection, 1);
  }
}
