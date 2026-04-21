import type {
  BiDataAsset,
  BiDataAssetField,
  BiDatasource,
  BiDirectoryNode,
  BiNodeType,
  BiScreen,
  BiShareToken,
} from '../types';

export type ScreenDraftSelection = {
  screenCode: string;
  screenId: number | null;
  screenName: string;
};

export function resolveSelectedScreenIdForNode(
  allScreens: BiScreen[],
  nodeId: number | null,
  currentScreenId: number | null,
) {
  const nodeScreens = allScreens.filter((screen) => screen.nodeId === nodeId);
  if (nodeScreens.length === 0) {
    return null;
  }
  if (currentScreenId && nodeScreens.some((screen) => screen.id === currentScreenId)) {
    return currentScreenId;
  }
  return nodeScreens[0]?.id ?? null;
}

export function resolveScreenDraftSelection(
  screens: BiScreen[],
  rawValue: string | number | null | undefined,
): ScreenDraftSelection {
  const value = String(rawValue ?? '').trim();
  if (!value) {
    return {
      screenCode: '',
      screenId: null,
      screenName: '',
    };
  }

  const screenId = Number(value);
  const targetScreen = Number.isFinite(screenId)
    ? screens.find((screen) => screen.id === screenId) ?? null
    : null;

  return {
    screenCode: targetScreen?.screenCode ?? '',
    screenId: targetScreen?.id ?? null,
    screenName: targetScreen?.name ?? '',
  };
}

function sortNodes(nodes: BiDirectoryNode[]) {
  return [...nodes].sort((left, right) => {
    const leftOrder = Number(left.orderNo ?? 0);
    const rightOrder = Number(right.orderNo ?? 0);
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return left.id - right.id;
  });
}

function mergeNode(nextNode: BiDirectoryNode, currentNode?: BiDirectoryNode): BiDirectoryNode {
  return {
    ...currentNode,
    ...nextNode,
    boundAssets: nextNode.boundAssets ?? currentNode?.boundAssets ?? [],
    canvasMeta: nextNode.canvasMeta ?? currentNode?.canvasMeta,
    children: nextNode.children?.length ? nextNode.children : currentNode?.children ?? [],
    datasourceIds: nextNode.datasourceIds ?? currentNode?.datasourceIds ?? [],
    nodeTypeName: nextNode.nodeTypeName ?? currentNode?.nodeTypeName,
    sourceAssetIds: nextNode.sourceAssetIds ?? currentNode?.sourceAssetIds ?? [],
  };
}

export function updateDirectoryNode(
  nodes: BiDirectoryNode[],
  nodeId: number,
  updater: (node: BiDirectoryNode) => BiDirectoryNode,
): BiDirectoryNode[] {
  let changed = false;

  const visit = (items: BiDirectoryNode[]): BiDirectoryNode[] => {
    const nextItems = items.map((item) => {
      if (item.id === nodeId) {
        const nextItem = updater(item);
        if (nextItem !== item) {
          changed = true;
        }
        return nextItem;
      }

      if (item.children.length === 0) {
        return item;
      }

      const nextChildren = visit(item.children);
      if (nextChildren !== item.children) {
        changed = true;
        return { ...item, children: nextChildren };
      }
      return item;
    });

    return changed ? nextItems : items;
  };

  const nextNodes = visit(nodes);
  return changed ? nextNodes : nodes;
}

export function removeDirectoryNode(nodes: BiDirectoryNode[], nodeId: number): BiDirectoryNode[] {
  let changed = false;

  const visit = (items: BiDirectoryNode[]): BiDirectoryNode[] => {
    const nextItems: BiDirectoryNode[] = [];

    items.forEach((item) => {
      if (item.id === nodeId) {
        changed = true;
        return;
      }

      if (item.children.length === 0) {
        nextItems.push(item);
        return;
      }

      const nextChildren = visit(item.children);
      if (nextChildren !== item.children) {
        changed = true;
        nextItems.push({
          ...item,
          children: nextChildren,
        });
        return;
      }

      nextItems.push(item);
    });

    return changed ? nextItems : items;
  };

  const nextNodes = visit(nodes);
  return changed ? nextNodes : nodes;
}

export function upsertDirectoryNode(
  nodes: BiDirectoryNode[],
  nextNode: BiDirectoryNode,
): BiDirectoryNode[] {
  const replaced = updateDirectoryNode(nodes, nextNode.id, (currentNode) =>
    mergeNode(nextNode, currentNode),
  );
  if (replaced !== nodes) {
    return replaced;
  }

  const normalizedNode = mergeNode(nextNode);

  if (!normalizedNode.parentId) {
    return sortNodes([...nodes, normalizedNode]);
  }

  const appended = updateDirectoryNode(nodes, normalizedNode.parentId, (parentNode) => ({
    ...parentNode,
    children: sortNodes([...parentNode.children, normalizedNode]),
  }));

  return appended === nodes ? sortNodes([...nodes, normalizedNode]) : appended;
}

export function upsertDatasource(
  datasources: BiDatasource[],
  nextDatasource: BiDatasource,
): BiDatasource[] {
  const index = datasources.findIndex((datasource) => datasource.id === nextDatasource.id);
  if (index === -1) {
    return [...datasources, nextDatasource];
  }
  return datasources.map((datasource) =>
    datasource.id === nextDatasource.id ? nextDatasource : datasource,
  );
}

export function upsertDatasourceAsset(
  datasources: BiDatasource[],
  datasourceId: number,
  nextAsset: BiDataAsset,
): BiDatasource[] {
  return datasources.map((datasource) => {
    if (datasource.id !== datasourceId) {
      return datasource;
    }

    const assetIndex = datasource.assets.findIndex((asset) => asset.id === nextAsset.id);
    const assets =
      assetIndex === -1
        ? [...datasource.assets, nextAsset]
        : datasource.assets.map((asset) => (asset.id === nextAsset.id ? nextAsset : asset));

    return {
      ...datasource,
      assets,
    };
  });
}

export function replaceDatasourceAssetFields(
  datasources: BiDatasource[],
  assetId: number,
  fields: BiDataAssetField[],
): BiDatasource[] {
  return datasources.map((datasource) => ({
    ...datasource,
    assets: datasource.assets.map((asset) =>
      asset.id === assetId ? { ...asset, fields } : asset,
    ),
  }));
}

export function upsertScreen(allScreens: BiScreen[], nextScreen: BiScreen): BiScreen[] {
  const index = allScreens.findIndex((screen) => screen.id === nextScreen.id);
  if (index === -1) {
    return [...allScreens, nextScreen];
  }
  return allScreens.map((screen) => (screen.id === nextScreen.id ? nextScreen : screen));
}

export function upsertShareToken(tokens: BiShareToken[], nextToken: BiShareToken): BiShareToken[] {
  const index = tokens.findIndex((token) => token.id === nextToken.id);
  if (index === -1) {
    return [nextToken, ...tokens];
  }
  return tokens.map((token) => (token.id === nextToken.id ? nextToken : token));
}

export function upsertNodeType(nodeTypes: BiNodeType[], nextNodeType: BiNodeType): BiNodeType[] {
  const index = nodeTypes.findIndex((nodeType) => nodeType.id === nextNodeType.id);
  const nextList =
    index === -1
      ? [...nodeTypes, nextNodeType]
      : nodeTypes.map((nodeType) => (nodeType.id === nextNodeType.id ? nextNodeType : nodeType));
  return [...nextList].sort((left, right) => {
    const leftSort = Number(left.sortNo ?? 0);
    const rightSort = Number(right.sortNo ?? 0);
    if (leftSort !== rightSort) {
      return leftSort - rightSort;
    }
    return left.id - right.id;
  });
}
