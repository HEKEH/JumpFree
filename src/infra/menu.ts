import * as vscode from 'vscode';

export function showCustomMenu(
  options: {
    label: string;
    description?: string;
    action: () => unknown;
  }[],
  placeHolder: string,
) {
  return vscode.window
    .showQuickPick(options, {
      placeHolder,
    })
    .then(selection => {
      if (selection) {
        // 触发选中项的对应操作
        return selection.action();
      }
    });
}
