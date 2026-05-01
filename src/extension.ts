// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { JumpLinkProvider } from './infra/jump-link-provider';
import { Commands, JUMP_TO_PATTERN } from './constants';
import { JumpManager } from './domain/jump-manager';
import { JumpFreeWatcher } from './watcher';

let jumpFreeWatcher: JumpFreeWatcher | undefined;
let jumpManager: JumpManager | undefined;
let isInitializing: boolean = false;
let initPromise: Promise<void> | undefined;

async function ensureJumpManagerInitialized(): Promise<void> {
  if (jumpManager) {
    return;
  }
  if (isInitializing && initPromise) {
    await initPromise;
    return;
  }

  isInitializing = true;
  initPromise = (async () => {
    jumpManager = await JumpManager.create();
    jumpFreeWatcher = new JumpFreeWatcher({ jumpManager });
  })();

  await initPromise;
  isInitializing = false;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Register document link provider immediately
  const linkProvider = vscode.languages.registerDocumentLinkProvider(
    { scheme: 'file' },
    new JumpLinkProvider({
      pattern: JUMP_TO_PATTERN,
      command: Commands.jumpTo,
    }),
  );

  // Register jump command with lazy initialization
  const jumpCommand = vscode.commands.registerCommand(
    Commands.jumpTo,
    async ({ target, uri }) => {
      await ensureJumpManagerInitialized();
      if (jumpManager) {
        await jumpManager.jumpToTarget(target, uri);
      }
    },
  );
  context.subscriptions.push(linkProvider, jumpCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {
  jumpFreeWatcher?.dispose();
}
