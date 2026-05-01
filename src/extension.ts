// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { JumpLinkProvider } from './infra/jump-link-provider';
import { Commands, JUMP_TO_PATTERN } from './constants';
import { JumpManager } from './domain/jump-manager';
import { JumpFreeWatcher } from './watcher';

let jumpFreeWatcher: JumpFreeWatcher | undefined;
let jumpManager: JumpManager | undefined;
let initPromise: Promise<void> | undefined;

/**
 * Start background initialization of the extension
 * This runs asynchronously without blocking the activation
 */
function startBackgroundInitialization(): void {
  if (initPromise) {
    return;
  }

  console.log('Starting JumpFree background initialization...');
  initPromise = (async () => {
    try {
      jumpManager = await JumpManager.create();
      jumpFreeWatcher = new JumpFreeWatcher({ jumpManager });
      console.log('JumpFree background initialization completed');
    } catch (error) {
      console.error('JumpFree initialization failed:', error);
    }
  })();
}

/**
 * Wait for initialization to complete
 * Used when user tries to jump before initialization is done
 */
async function ensureInitialized(): Promise<void> {
  if (initPromise) {
    await initPromise;
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "jump-free" is now active!');

  // Register document link provider immediately
  const linkProvider = vscode.languages.registerDocumentLinkProvider(
    { scheme: 'file' },
    new JumpLinkProvider({
      pattern: JUMP_TO_PATTERN,
      command: Commands.jumpTo,
      quickCheckPattern: 'JumpFreeTo:',
    }),
  );

  // Register jump command
  const jumpCommand = vscode.commands.registerCommand(
    Commands.jumpTo,
    async ({ target, uri }) => {
      // Ensure initialization is complete before jumping
      await ensureInitialized();
      if (jumpManager) {
        await jumpManager.jumpToTarget(target, uri);
      }
    },
  );

  context.subscriptions.push(linkProvider, jumpCommand);

  // Start background initialization immediately (non-blocking)
  startBackgroundInitialization();
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log('Extension "jump-free" is now deactivated!');
  jumpFreeWatcher?.dispose();
}
