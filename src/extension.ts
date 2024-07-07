// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { JumpLinkProvider } from './infra/jump-link-provider';
import { Commands, JUMP_TO_PATTERN } from './constants';
import { JumpManager } from './domain/jump-manager';
import { JumpFreeWatcher } from './watcher';

let jumpFreeWatcher: JumpFreeWatcher | undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Extension "jump-free" is now active!');
  const jumpManager = await JumpManager.create();
  jumpFreeWatcher = new JumpFreeWatcher({ jumpManager });

  const linkProvider = vscode.languages.registerDocumentLinkProvider(
    { scheme: 'file' },
    new JumpLinkProvider({
      pattern: JUMP_TO_PATTERN,
      command: Commands.jumpTo,
    }),
  );

  const jumpCommand = vscode.commands.registerCommand(
    Commands.jumpTo,
    ({ target, uri }) => jumpManager.jumpToTarget(target, uri),
  );
  context.subscriptions.push(linkProvider, jumpCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log('Extension "jump-free" is now deactivated!');
  jumpFreeWatcher?.dispose();
}
