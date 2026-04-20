import { DETAIL_LAYOUT_REGISTRY } from '../registry';
import {
  DETAIL_LAYOUT_DEFAULT_DOCUMENT,
  DETAIL_LAYOUT_DEFAULT_GRID_SIZE,
  type DetailLayoutDocument,
  type DetailLayoutItem,
  type DetailLayoutItemPatch,
  type DetailLayoutItemType,
} from '../types';
import { snapRectToGrid } from './snap';
import { canUseDetailLayoutParent, getDetailLayoutDescendantIds } from './tree';

let detailLayoutSeed = 0;

function nextDetailLayoutItemId(type: DetailLayoutItemType) {
  detailLayoutSeed += 1;
  return `detail_layout_${type}_${Date.now()}_${detailLayoutSeed}`;
}

function clampDetailLayoutNumericPatch(
  item: DetailLayoutItem,
  patch: DetailLayoutItemPatch,
) {
  const registryItem = DETAIL_LAYOUT_REGISTRY[item.type];
  const nextPatch = { ...patch };

  if (typeof nextPatch.x === 'number' && Number.isFinite(nextPatch.x)) {
    nextPatch.x = Math.max(0, nextPatch.x);
  }

  if (typeof nextPatch.y === 'number' && Number.isFinite(nextPatch.y)) {
    nextPatch.y = Math.max(0, nextPatch.y);
  }

  if (typeof nextPatch.w === 'number' && Number.isFinite(nextPatch.w)) {
    nextPatch.w = Math.max(registryItem.defaultSize.w, nextPatch.w);
  }

  if (typeof nextPatch.h === 'number' && Number.isFinite(nextPatch.h)) {
    nextPatch.h = Math.max(registryItem.defaultSize.h, nextPatch.h);
  }

  return nextPatch;
}

export function createEmptyDetailLayoutDocument(overrides: Partial<DetailLayoutDocument> = {}): DetailLayoutDocument {
  return {
    ...DETAIL_LAYOUT_DEFAULT_DOCUMENT,
    ...overrides,
    items: overrides.items ?? [],
    version: 1,
    gridSize: overrides.gridSize ?? DETAIL_LAYOUT_DEFAULT_GRID_SIZE,
  };
}

export function createDetailLayoutItem(
  type: DetailLayoutItemType,
  overrides: Partial<DetailLayoutItem> = {},
  gridSize = DETAIL_LAYOUT_DEFAULT_GRID_SIZE,
): DetailLayoutItem {
  const registryItem = DETAIL_LAYOUT_REGISTRY[type];
  const rect = snapRectToGrid(
    {
      x: overrides.x ?? 16,
      y: overrides.y ?? 16,
      w: overrides.w ?? registryItem.defaultSize.w,
      h: overrides.h ?? registryItem.defaultSize.h,
    },
    gridSize,
  );

  return {
    id: overrides.id ?? nextDetailLayoutItemId(type),
    type,
    title: overrides.title ?? registryItem.defaultTitle,
    field: registryItem.supportsField ? overrides.field ?? registryItem.defaultField : undefined,
    parentId: overrides.parentId ?? null,
    required: overrides.required ?? false,
    readOnly: overrides.readOnly ?? false,
    ...rect,
  };
}

export function appendDetailLayoutItem(document: DetailLayoutDocument, item: DetailLayoutItem): DetailLayoutDocument {
  return {
    ...document,
    items: [...document.items, item],
  };
}

export function areDetailLayoutDocumentsEqual(left: DetailLayoutDocument, right: DetailLayoutDocument) {
  if (left === right) {
    return true;
  }

  if (left.version !== right.version || left.gridSize !== right.gridSize || left.items.length !== right.items.length) {
    return false;
  }

  return left.items.every((item, index) => {
    const other = right.items[index];
    return item.id === other.id
      && item.type === other.type
      && item.title === other.title
      && item.field === other.field
      && (item.parentId ?? null) === (other.parentId ?? null)
      && item.required === other.required
      && item.readOnly === other.readOnly
      && item.x === other.x
      && item.y === other.y
      && item.w === other.w
      && item.h === other.h;
  });
}

export function updateDetailLayoutItem(
  document: DetailLayoutDocument,
  itemId: string,
  patch: DetailLayoutItemPatch,
): DetailLayoutDocument {
  const items = document.items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }

    const normalizedPatch = clampDetailLayoutNumericPatch(item, patch);
    const nextParentId = patch.parentId === undefined ? item.parentId ?? null : patch.parentId;
    return {
      ...item,
      ...normalizedPatch,
      parentId: canUseDetailLayoutParent(document.items, item.id, nextParentId) ? nextParentId : item.parentId ?? null,
    };
  });

  return {
    ...document,
    items,
  };
}

export function removeDetailLayoutItem(document: DetailLayoutDocument, itemId: string): DetailLayoutDocument {
  const descendantIds = getDetailLayoutDescendantIds(document.items, itemId);

  return {
    ...document,
    items: document.items.filter((item) => item.id !== itemId && !descendantIds.has(item.id)),
  };
}
