import * as vscode from 'vscode';

function getActiveWorkspaceFolder() {
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    const resource = activeEditor.document.uri;
    // check if the resource (file) is part of any workspace folders
    const folder = vscode.workspace.getWorkspaceFolder(resource);
    console.log(folder, 'activeWorkspaceFolder');
    return folder;
  }
  return undefined;
}

/** root path of active workspace */
export function getRootPath(): string | undefined {
  return getActiveWorkspaceFolder()?.uri.fsPath;
}
