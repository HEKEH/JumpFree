export const JUMP_TO_PATTERN =
  /\bJumpFreeTo:\s*(?<tag>[_$a-zA-Z0-9\xA0-\uFFFF]+)\b/;

export const JUMP_TARGET_PATTERN =
  /\bJumpFreeTarget:\s*(?<tag>[_$a-zA-Z0-9\xA0-\uFFFF]+)\b/;

export const JUMP_TARGET_PATTERN_FOR_RIPGREP =
  /\bJumpFreeTarget:\s*[_$a-zA-Z0-9\xA0-\uFFFF]+\b/;

export const DEFAULT_TAG_KEY = 'tag';
