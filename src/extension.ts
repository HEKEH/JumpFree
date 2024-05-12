// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { JumpLinkProvider } from './infra/jump-link-provider';
import { Commands, LANGUAGE_JUMP_TO_PATTERN_MAP } from './consts';
import { openFileAndJumpToLine } from './infra/open-file-and-jump-to-line';
import { JumpManager } from './domain/jump-manager';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Extension "jump-free" is now active!');
  const jumpManager = JumpManager.create(context);

  const linkProviders = Object.entries(LANGUAGE_JUMP_TO_PATTERN_MAP).map(
    ([language, pattern]) =>
      vscode.languages.registerDocumentLinkProvider(
        { scheme: 'file', language },
        new JumpLinkProvider({
          pattern,
          command: Commands.jumpTo,
        }),
      ),
  );

  const jumpCommand = vscode.commands.registerCommand(
    Commands.jumpTo,
    ({ target }) => jumpManager.jumpToTarget(target),
  );
  context.subscriptions.push(...linkProviders, jumpCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log('Extension "jump-free" is now deactivated!');
}
