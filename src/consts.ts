export enum Commands {
  jumpTo = 'jumpFree.jumpToCommand',
}

const JS_JUMP_TO_PATTERN =
  /^\/\/\s*jumpTo\s+(?<target>[_$a-zA-Z0-9\xA0-\uFFFF]+)\b/;

export const LANGUAGE_JUMP_TO_PATTERN_MAP: Record<string, RegExp> = {
  typescript: JS_JUMP_TO_PATTERN,
  javascript: JS_JUMP_TO_PATTERN,
  typescriptreact: JS_JUMP_TO_PATTERN,
};
