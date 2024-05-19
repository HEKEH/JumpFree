import { DEFAULT_TAG_KEY, JUMP_TARGET_PATTERN } from '../constants';

export function getTargetTagFromLine(line: string): string | undefined {
  return line.match(JUMP_TARGET_PATTERN)?.groups?.[DEFAULT_TAG_KEY];
}
