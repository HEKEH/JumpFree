export enum Commands {
  jumpTo = 'jumpFree.jumpToCommand',
}

export const JUMP_TO_PATTERN =
  /\bJumpFreeTo:\s*(?<target>[_$a-zA-Z0-9\xA0-\uFFFF]+)\b/;

export const JUMP_TARGET_PRIFIX = 'JumpFreeTarget:';

export const DEFAULT_EXCLUDE_FOLDERS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.vscode/**',
  '**/dist/**',
  '**/.vscode/**',
  '**/.husky/**',
  '**/logs/**',
  '**/.idea/**',
];

// const JS_JUMP_TARGET_PATTERN =
//   /\/\/\s*JumpFreeTarget:\s*(?<target>[_$a-zA-Z0-9\xA0-\uFFFF]+)\b/;
