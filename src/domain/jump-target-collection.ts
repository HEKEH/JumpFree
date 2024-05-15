import { DEFAULT_EXCLUDE_FOLDERS } from '../consts';
import { getRootPath } from '../infra/get-root-path';
import { JumpTargetItem } from '../types';
import { getJumpTargetItemList } from '../utils/get-jump-target-item-list';

export class JumpTargetCollection {
  private _itemList: JumpTargetItem[] = [];
  findTargetByTag(tag: string): JumpTargetItem | undefined {
    return this._itemList.find(item => item.tag === tag);
  }
  clear() {
    this._itemList = [];
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
    this._itemList = await this._getCurrentItemList();
  }
}
