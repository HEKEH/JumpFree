// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { JumpLinkProvider } from './infra/jump-link-provider';
import { Commands, LANGUAGE_JUMP_TO_PATTERN_MAP } from './consts';
import { jumpToLine } from './infra/jump-to-line';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "jumpanywhere" is now active!');

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
  context.subscriptions.push(...linkProviders);

  const jumpCommand = vscode.commands.registerCommand(
    Commands.jumpTo,
    ({ target }) =>
      jumpToLine({
        editor: vscode.window.activeTextEditor,
        targetLine: target,
      }),
  );
  context.subscriptions.push(jumpCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
