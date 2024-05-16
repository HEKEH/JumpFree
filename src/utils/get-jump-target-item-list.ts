import {
  DEFAULT_TAG_KEY,
  JUMP_TARGET_PATTERN,
  JUMP_TARGET_PATTERN_FOR_RIPGREP,
} from '../consts';
import { findFileAndLines } from '../infra/find-file-and-lines';
import { JumpTargetItem } from '../types';

export async function getJumpTargetItemList(
  rootPath: string,
  exludedFilesPattern: Array<string>,
) {
  try {
    const fileAndLines = await findFileAndLines(
      JUMP_TARGET_PATTERN_FOR_RIPGREP,
      rootPath,
      exludedFilesPattern,
    );
    return fileAndLines
      .map(({ file, lineNumber, line }) => {
        const tag = line.match(JUMP_TARGET_PATTERN)?.groups?.[DEFAULT_TAG_KEY];
        if (!tag) {
          console.error(`could not find tag from ${line}`);
          return;
        }
        return {
          file,
          lineNumber,
          tag,
        };
      })
      .filter(item => item) as JumpTargetItem[];
  } catch (e) {
    console.error(e);
    return [];
  }
}
