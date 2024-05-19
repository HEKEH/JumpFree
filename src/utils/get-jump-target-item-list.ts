import { JUMP_TARGET_PATTERN_FOR_RIPGREP } from '../constants';
import { findFileAndLinesInFolder } from '../infra/find-file-and-lines-in-folder';
import { JumpTargetItem } from '../types';
import { getTargetTagFromLine } from './get-target-tag-from-line';

/**
 * Retrieves a list of JumpTargetItem objects from the specified root path.
 *
 * @param rootPath - The root directory path to search for jump targets.
 * @param excludedFilesPattern - An array of patterns to exclude certain files from the search.
 *
 * @returns An array of JumpTargetItem objects, each containing the file path, line number, and tag of a jump target.
 */
export async function getJumpTargetItemList(
  rootPath: string,
  excludedFilesPattern: Array<string>,
): Promise<JumpTargetItem[]> {
  try {
    const fileAndLines = await findFileAndLinesInFolder(
      JUMP_TARGET_PATTERN_FOR_RIPGREP,
      rootPath,
      excludedFilesPattern,
    );

    return fileAndLines
      .map(({ file, lineNumber, line }) => {
        const tag = getTargetTagFromLine(line);

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
