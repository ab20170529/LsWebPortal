import type { DetailLayoutItem } from '../types';

export function buildDetailLayoutChildrenMap(items: DetailLayoutItem[]) {
  const map = new Map<string | null, DetailLayoutItem[]>();

  for (const item of items) {
    const parentId = item.parentId ?? null;
    const children = map.get(parentId) ?? [];
    children.push(item);
    map.set(parentId, children);
  }

  for (const children of map.values()) {
    children.sort((left, right) => {
      if (left.y !== right.y) {
        return left.y - right.y;
      }

      return left.x - right.x;
    });
  }

  return map;
}

export function getDetailLayoutChildren(items: DetailLayoutItem[], parentId: string | null) {
  return buildDetailLayoutChildrenMap(items).get(parentId) ?? [];
}

export function getDetailLayoutDescendantIds(items: DetailLayoutItem[], parentId: string) {
  const childrenMap = buildDetailLayoutChildrenMap(items);
  const result = new Set<string>();
  const queue = [...(childrenMap.get(parentId) ?? [])];

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) {
      continue;
    }

    result.add(item.id);
    queue.push(...(childrenMap.get(item.id) ?? []));
  }

  return result;
}

export function canUseDetailLayoutParent(items: DetailLayoutItem[], itemId: string, parentId: string | null) {
  if (!parentId) {
    return true;
  }

  if (itemId === parentId) {
    return false;
  }

  return !getDetailLayoutDescendantIds(items, itemId).has(parentId);
}

export function isDetailLayoutContainer(item: DetailLayoutItem | null | undefined) {
  return item?.type === 'groupbox';
}
