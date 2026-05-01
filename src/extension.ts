import * as vscode from 'vscode';
import { JumpLinkProvider } from './infra/jump-link-provider';
import { Commands, JUMP_TO_PATTERN } from './constants';
import { JumpManager } from './domain/jump-manager';
import { JumpFreeWatcher } from './watcher';
import { registerLoggingConfigListener, debugLog } from './utils/logger';

let jumpManager: JumpManager | undefined;
let jumpFreeWatcher: JumpFreeWatcher | undefined;
let isInitialized = false;
let initializationPromise: Promise<void> | undefined;

async function ensureInitialized(): Promise<void> {
  if (isInitialized) {
    return;
  }

  if (initializationPromise) {
    await initializationPromise;
    return;
  }

  initializationPromise = (async () => {
    debugLog('Starting lazy initialization...');

    if (!jumpManager) {
      jumpManager = JumpManager.create();
    }

    await jumpManager.ensureInitialized();

    if (!jumpFreeWatcher && jumpManager) {
      jumpFreeWatcher = new JumpFreeWatcher({ jumpManager });
    }

    isInitialized = true;
    debugLog('Lazy initialization completed');
  })();

  await initializationPromise;
}

export async function activate(context: vscode.ExtensionContext) {
  debugLog('Extension "jump-free" is now active!');

  const loggingDisposable = registerLoggingConfigListener();
  context.subscriptions.push(loggingDisposable);

  const linkProvider = vscode.languages.registerDocumentLinkProvider(
    { scheme: 'file' },
    new JumpLinkProvider({
      pattern: JUMP_TO_PATTERN,
      command: Commands.jumpTo,
    }),
  );

  const jumpCommand = vscode.commands.registerCommand(
    Commands.jumpTo,
    async ({ target, uri }) => {
      await ensureInitialized();
      if (jumpManager) {
        await jumpManager.jumpToTarget(target, uri);
      }
    },
  );

  let openDocumentListener: vscode.Disposable | undefined;
  openDocumentListener = vscode.workspace.onDidOpenTextDocument(async () => {
    if (!isInitialized && !initializationPromise) {
      await ensureInitialized();
    }
    if (openDocumentListener) {
      openDocumentListener.dispose();
      openDocumentListener = undefined;
    }
  });

  context.subscriptions.push(linkProvider, jumpCommand);

  context.subscriptions.push({
    dispose: () => {
      openDocumentListener?.dispose();
      jumpFreeWatcher?.dispose();
      jumpManager?.dispose();
    },
  });
}

export function deactivate() {
  debugLog('Extension "jump-free" is now deactivated!');
  jumpFreeWatcher?.dispose();
  jumpManager?.dispose();
  isInitialized = false;
  initializationPromise = undefined;
  jumpManager = undefined;
  jumpFreeWatcher = undefined;
}
