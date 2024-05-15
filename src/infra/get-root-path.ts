import { getActiveWorkspace } from './get-active-workspace';

/** root path of active workspace */
export function getRootPath(): string | undefined {
  return getActiveWorkspace()?.uri.fsPath;
}
