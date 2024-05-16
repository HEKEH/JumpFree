import { DEFAULT_EXCLUDE_FOLDERS } from '../consts';
import { getRootPath } from '../infra/get-root-path';
import { JumpTargetItem } from '../types';
import { getJumpTargetItemList } from '../utils/get-jump-target-item-list';

type SimplifiedJumpTargetItem = Omit<JumpTargetItem, 'file'>;

export class JumpTargetCollection {
  private _file2ItemsMap: {
    [filePath: string]: SimplifiedJumpTargetItem[];
  } = {};
  findTargetByTag(tag: string): JumpTargetItem | undefined {
    for (const filePath in this._file2ItemsMap) {
      const found = this._file2ItemsMap[filePath].find(
        item => item.tag === tag,
      );
      if (found) {
        return {
          file: filePath,
          lineNumber: found.lineNumber,
          tag: found.tag,
        };
      }
    }
  }
  clear() {
    this._file2ItemsMap = {};
  }
  private async _getCurrentItemList() {
    const rootPath = getRootPath();
    console.log(rootPath, 'rootPath');
    if (rootPath) {
      const itemList = await getJumpTargetItemList(
        rootPath,
        DEFAULT_EXCLUDE_FOLDERS,
      );
      console.log(itemList, 'getCurrentItemList');
      return itemList;
    }
    return [];
  }
  async init() {
    const list = await this._getCurrentItemList();
    list.forEach(item => {
      const { file, ...others } = item;
      if (!this._file2ItemsMap[file]) {
        this._file2ItemsMap[file] = [];
      }
      this._file2ItemsMap[file].push(others);
    });
  }
}
