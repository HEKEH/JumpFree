import { Position, Range, Selection, Uri, workspace, window } from 'vscode';

export async function openFileAndJumpToLine(args: {
  file: string;
  lineNumber: number;
}) {
  const { file } = args;
  const fileUri = Uri.file(file);
  const document = await workspace.openTextDocument(fileUri);
  const editor = await window.showTextDocument(document);
  if (!editor) {
    return;
  }
  const { lineNumber } = args;
  const position = new Position(lineNumber - 1, 0); // index from 0, so need to minus 1
  editor.selection = new Selection(position, position);
  editor.revealRange(new Range(position, position));
}
