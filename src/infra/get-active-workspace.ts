import * as vscode from 'vscode';

export function getActiveWorkspace() {
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    const resource = activeEditor.document.uri;
    // check if the resource (file) is part of any workspace folders
    const folder = vscode.workspace.getWorkspaceFolder(resource);
    return folder;
  }
  return undefined;
}
