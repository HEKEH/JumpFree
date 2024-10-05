import * as vscode from 'vscode';

export interface MenuOption {
  label: string;
  description?: string;
  action: () => unknown;
}

export async function showCustomMenu(
  options: MenuOption[],
  placeHolder: string,
): Promise<unknown | undefined> {
  const selection = await vscode.window.showQuickPick(options, { placeHolder });
  return selection?.action();
}
