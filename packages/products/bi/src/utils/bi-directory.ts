import type { BiCanvasMeta, BiDataAsset, BiDatasource, BiDirectoryNode, BiScreen } from '../types';

export const DEFAULT_NODE_WIDTH = 224;
export const DEFAULT_NODE_HEIGHT = 148;
const AUTO_LAYOUT_START_X = 64;
const AUTO_LAYOUT_START_Y = 120;
const AUTO_LAYOUT_COLUMN_GAP = 280;
const AUTO_LAYOUT_ROW_GAP = 204;
const AUTO_LAYOUT_ROOT_GAP = 104;

const NODE_TYPE_LABELS: Record<string, string> = {
  ANALYSIS_DIM: '分析维度',
  COMPANY: '公司 / 大维度',
  DEPARTMENT: '部门',
  SUB_DIM: '子维度',
};

const NODE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: '已生效',
  DRAFT: '草稿',
  DISABLED: '已停用',
  FAILED: '失败',
  PUBLISHED: '已发布',
};

const SCREEN_DESIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: '待设计',
  DRAFT_CREATED: '草稿已生成',
  FAILED: '生成失败',
  GENERATED: '已生成',
  PUBLISHED: '已发布',
  VALIDATED: '已校验',
};

const GENERATION_STATUS_LABELS: Record<string, string> = {
  DRAFT_CREATED: '草稿已生成',
  FAILED: '生成失败',
  PUBLISHED: '已发布',
  RUNNING: '生成中',
};

const PUBLISH_MODE_LABELS: Record<string, string> = {
  AUTO_PUBLISH: '自动发布',
  DRAFT: '仅生成草稿',
};

export function flattenDirectoryNodes(nodes: BiDirectoryNode[]): BiDirectoryNode[] {
  return nodes.flatMap((node) => [node, ...flattenDirectoryNodes(node.children)]);
}

export function countAssets(datasources: BiDatasource[]) {
  return datasources.reduce((total, datasource) => total + datasource.assets.length, 0);
}

export function countFields(datasources: BiDatasource[]) {
  return datasources.reduce(
    (total, datasource) =>
      total + datasource.assets.reduce((assetTotal, asset) => assetTotal + asset.fields.length, 0),
    0,
  );
}

export function buildDirectoryIndex(nodes: BiDirectoryNode[]) {
  const index = new Map<number, BiDirectoryNode>();
  flattenDirectoryNodes(nodes).forEach((node) => {
    index.set(node.id, node);
  });
  return index;
}

export function buildNodePath(node: BiDirectoryNode | null, nodes: BiDirectoryNode[]) {
  if (!node) {
    return [];
  }

  const index = buildDirectoryIndex(nodes);
  const path: BiDirectoryNode[] = [];
  let current: BiDirectoryNode | undefined | null = node;
  while (current) {
    path.unshift(current);
    current = current.parentId ? index.get(current.parentId) ?? null : null;
  }
  return path;
}

export function getNodeCanvasMeta(node: BiDirectoryNode, overrides?: Record<number, BiCanvasMeta>) {
  const meta = overrides?.[node.id] ?? node.canvasMeta ?? {};
  return {
    accent: typeof meta.accent === 'string' ? meta.accent : undefined,
    collapsed: Boolean(meta.collapsed),
    height: typeof meta.height === 'number' ? meta.height : DEFAULT_NODE_HEIGHT,
    width: typeof meta.width === 'number' ? meta.width : DEFAULT_NODE_WIDTH,
    x: typeof meta.x === 'number' ? meta.x : 120,
    y: typeof meta.y === 'number' ? meta.y : 120,
  };
}

export function buildAutoLayout(nodes: BiDirectoryNode[]) {
  const layout = new Map<number, BiCanvasMeta>();

  type LayoutCursor = {
    nextY: number;
    topY: number;
  };

  const placeSubtree = (node: BiDirectoryNode, depth: number, startY: number): LayoutCursor => {
    const children = node.children ?? [];
    const baseMeta = getNodeCanvasMeta(node);

    if (children.length === 0) {
      layout.set(node.id, {
        ...node.canvasMeta,
        height: baseMeta.height,
        width: baseMeta.width,
        x: AUTO_LAYOUT_START_X + depth * AUTO_LAYOUT_COLUMN_GAP,
        y: startY,
      });
      return {
        nextY: startY + AUTO_LAYOUT_ROW_GAP,
        topY: startY,
      };
    }

    let cursorY = startY;
    const childTopYs: number[] = [];

    children.forEach((child) => {
      const childLayout = placeSubtree(child, depth + 1, cursorY);
      childTopYs.push(childLayout.topY);
      cursorY = childLayout.nextY;
    });

    const firstChildTopY = childTopYs[0] ?? startY;
    const lastChildTopY = childTopYs[childTopYs.length - 1] ?? startY;
    const currentTopY = Math.round((firstChildTopY + lastChildTopY) / 2);

    layout.set(node.id, {
      ...node.canvasMeta,
      height: baseMeta.height,
      width: baseMeta.width,
      x: AUTO_LAYOUT_START_X + depth * AUTO_LAYOUT_COLUMN_GAP,
      y: currentTopY,
    });

    return {
      nextY: cursorY,
      topY: currentTopY,
    };
  };

  let rootStartY = AUTO_LAYOUT_START_Y;
  nodes.forEach((rootNode) => {
    const subtreeLayout = placeSubtree(rootNode, 0, rootStartY);
    rootStartY = subtreeLayout.nextY + AUTO_LAYOUT_ROOT_GAP;
  });

  return layout;
}

export function getNodeTone(nodeType: string) {
  switch (nodeType) {
    case 'COMPANY':
      return 'company';
    case 'DEPARTMENT':
      return 'department';
    case 'ANALYSIS_DIM':
      return 'dimension';
    default:
      return 'sub-dimension';
  }
}

export function getNodeTypeLabel(nodeType: string, nodeTypeName?: string | null) {
  if (nodeTypeName?.trim()) {
    return nodeTypeName.trim();
  }
  return NODE_TYPE_LABELS[nodeType] ?? nodeType;
}

export function getStatusLabel(status?: string | null) {
  return NODE_STATUS_LABELS[(status ?? 'DRAFT').toUpperCase()] ?? '草稿';
}

export function getScreenDesignStatusLabel(status?: string | null) {
  return SCREEN_DESIGN_STATUS_LABELS[(status ?? 'DRAFT').toUpperCase()] ?? '待设计';
}

export function getGenerationStatusLabel(status?: string | null) {
  return GENERATION_STATUS_LABELS[(status ?? '').toUpperCase()] ?? '尚未生成';
}

export function getPublishModeLabel(mode?: string | null) {
  return PUBLISH_MODE_LABELS[(mode ?? 'DRAFT').toUpperCase()] ?? '仅生成草稿';
}

export function getAssetTypeLabel(assetType: string) {
  return assetType === 'SQL' ? 'SQL 资产' : '数据表资产';
}

export function collectAllowedTables(datasources: BiDatasource[]) {
  const tableNames = new Set<string>();
  datasources.forEach((datasource) => {
    datasource.assets.forEach((asset) => {
      if (asset.assetType === 'TABLE' && asset.tableName) {
        tableNames.add(`${asset.tableSchema ?? 'dbo'}.${asset.tableName}`);
      }
      asset.sourceTables.forEach((tableName) => {
        if (tableName.trim()) {
          tableNames.add(tableName.trim());
        }
      });
    });
  });
  return Array.from(tableNames);
}

export function getDatasourceAssetSummary(datasource: BiDatasource) {
  const tableCount = datasource.assets.filter((asset) => asset.assetType === 'TABLE').length;
  const sqlCount = datasource.assets.filter((asset) => asset.assetType === 'SQL').length;
  return { sqlCount, tableCount };
}

export function getPublishedVersionId(screen: BiScreen | null) {
  if (!screen) {
    return null;
  }
  return screen.currentVersionId ?? screen.versions.find((version) => version.published)?.id ?? null;
}

export function getModuleCount(screen: BiScreen) {
  return screen.versions.reduce((maxCount, version) => Math.max(maxCount, version.modules.length), 0);
}

export function collectFieldCoverage(datasources: BiDatasource[]) {
  return datasources.flatMap((datasource) =>
    datasource.assets.flatMap((asset: BiDataAsset) =>
      asset.fields.map((field) => `${asset.assetCode}.${field.fieldName}`),
    ),
  );
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(date);
}
