import { Position, Range, Selection, TextEditor } from 'vscode';

export function jumpToLine(args: {
  editor: TextEditor | undefined;
  targetLine: number;
}) {
  const { editor, targetLine } = args;
  if (!editor) {
    return;
  }
  const position = new Position(targetLine, 0);
  editor.selection = new Selection(position, position);
  editor.revealRange(new Range(position, position));
}
