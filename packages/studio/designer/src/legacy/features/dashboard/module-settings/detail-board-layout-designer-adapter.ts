import type {
  DetailLayoutDocument,
  DetailLayoutFieldOption,
  DetailLayoutItem,
  DetailLayoutItemType,
} from '../detail-layout-designer/types';
import { createEmptyDetailLayoutDocument } from '../detail-layout-designer/utils/layout';
import {
  DETAIL_BOARD_GROUP_MIN_ROWS,
  DETAIL_BOARD_GROUP_MAX_ROWS,
  buildDetailBoardGroup,
  getDetailBoardGroupColumnRow,
  getDetailBoardGroupRows,
} from './detail-board-config';
import { buildLayoutFieldWorkbenchMeta } from './layout-field-workbench-meta';

export const DETAIL_BOARD_DESIGNER_ROOT_GROUP_ID = 'detail_group_root';
const DETAIL_BOARD_GROUPBOX_MIN_WIDTH = 420;
const DETAIL_BOARD_GROUPBOX_MIN_HEIGHT = 180;
const DETAIL_BOARD_GROUP_GAP = 24;
const DETAIL_BOARD_GROUP_PADDING_X = 16;
const DETAIL_BOARD_GROUP_PADDING_Y = 16;
const DETAIL_BOARD_GROUP_ROW_GAP = 16;
const DETAIL_BOARD_GROUP_COLUMN_GAP = 16;
const DETAIL_BOARD_GROUP_HEADER_HEIGHT = 40;
const DETAIL_BOARD_GROUP_BODY_GAP = 24;

type NormalizeColumn = (column: Record<string, any>) => Record<string, any>;

export type ArchiveLayoutSchemeGroup = {
  fieldIds: string[];
  id: string;
  name: string;
};

export type ArchiveLayoutSchemeFieldDefaults = {
  h?: number;
  w?: number;
};

export type ArchiveLayoutScheme = {
  fieldDefaults?: Record<string, ArchiveLayoutSchemeFieldDefaults>;
  groups: ArchiveLayoutSchemeGroup[];
  id: string;
  name: string;
};

function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value: unknown) {
  return Number.isFinite(Number(value));
}

function isDetailLayoutItemType(value: unknown): value is DetailLayoutItemType {
  return value === 'input'
    || value === 'select'
    || value === 'date'
    || value === 'number'
    || value === 'textarea'
    || value === 'label'
    || value === 'button'
    || value === 'groupbox';
}

function mapColumnToDetailLayoutType(normalizedColumn: Record<string, any>) {
  const typeText = String(
    normalizedColumn.type
    ?? normalizedColumn.fieldType
    ?? normalizedColumn.controlType
    ?? normalizedColumn.controltypename
    ?? normalizedColumn.controlTypeName
    ?? '',
  ).toLowerCase();

  if (['日期', 'date', 'time', '时间'].some((keyword) => typeText.includes(keyword.toLowerCase()))) {
    return 'date';
  }

  if (['下拉', 'select', '搜索', '单选', '多选', '枚举'].some((keyword) => typeText.includes(keyword.toLowerCase()))) {
    return 'select';
  }

  if (['数字', '金额', 'number', '数值', '整数', '小数'].some((keyword) => typeText.includes(keyword.toLowerCase()))) {
    return 'number';
  }

  if (['备注', '说明', '多行', 'textarea', '富文本', 'markdown'].some((keyword) => typeText.includes(keyword.toLowerCase()))) {
    return 'textarea';
  }

  return 'input';
}

function buildColumnMap(availableGridColumns: Record<string, any>[]) {
  return new Map(
    availableGridColumns
      .filter((column) => Boolean(column?.id))
      .map((column) => [String(column.id), column]),
  );
}

function normalizeDesignerLayoutDocument(rawLayout: unknown, columnMap: Map<string, any>) {
  if (!isPlainObject(rawLayout) || rawLayout.version !== 1 || !Array.isArray(rawLayout.items) || !isFiniteNumber(rawLayout.gridSize)) {
    return null;
  }

  const normalizedItems = rawLayout.items
    .filter((item): item is Record<string, any> => isPlainObject(item) && isDetailLayoutItemType(item.type))
    .map((item) => ({
      id: String(item.id || `detail_layout_item_${Date.now()}`),
      type: item.type as DetailLayoutItemType,
      title: typeof item.title === 'string' ? item.title : undefined,
      field: typeof item.field === 'string' ? item.field : undefined,
      parentId: typeof item.parentId === 'string' ? item.parentId : null,
      required: Boolean(item.required),
      readOnly: Boolean(item.readOnly),
      x: isFiniteNumber(item.x) ? Number(item.x) : 16,
      y: isFiniteNumber(item.y) ? Number(item.y) : 16,
      w: isFiniteNumber(item.w) ? Number(item.w) : 160,
      h: isFiniteNumber(item.h) ? Number(item.h) : 56,
      rows: isFiniteNumber(item.rows) ? Number(item.rows) : undefined,
    }))
    .filter((item) => item.type === 'groupbox' || !item.field || columnMap.has(String(item.field)));

  const itemIdSet = new Set(normalizedItems.map((item) => item.id));

  return createEmptyDetailLayoutDocument({
    gridSize: Number(rawLayout.gridSize),
    items: normalizedItems.map((item) => ({
      ...item,
      parentId: item.parentId && itemIdSet.has(item.parentId) ? item.parentId : null,
    })) as DetailLayoutItem[],
  });
}

function buildGroupChildItems(
  group: Record<string, any>,
  groupId: string,
  availableColumnMap: Map<string, any>,
  normalizeColumn: NormalizeColumn,
) {
  const rowMap = new Map<number, DetailLayoutItem[]>();
  const rows = Math.max(DETAIL_BOARD_GROUP_MIN_ROWS, getDetailBoardGroupRows(group));

  for (const columnId of group.columnIds ?? []) {
    const rawColumn = availableColumnMap.get(String(columnId));
    if (!rawColumn) {
      continue;
    }

    const normalizedColumn = normalizeColumn(rawColumn);
    const preferredWidth = group.columnWidths?.[columnId];
    const preferredHeight = group.columnHeights?.[columnId];
    const fieldMeta = buildLayoutFieldWorkbenchMeta(normalizeColumn, rawColumn, preferredWidth, preferredHeight);
    const rowNumber = Math.min(rows, Math.max(1, getDetailBoardGroupColumnRow(group, columnId)));
    const rowItems = rowMap.get(rowNumber) ?? [];
    const x = rowItems.reduce((offset, item) => offset + item.w + DETAIL_BOARD_GROUP_COLUMN_GAP, DETAIL_BOARD_GROUP_PADDING_X);

    rowItems.push({
      id: `${groupId}::${columnId}`,
      type: mapColumnToDetailLayoutType(normalizedColumn),
      title: normalizedColumn.name || normalizedColumn.sourceField || String(columnId),
      field: String(columnId),
      parentId: groupId,
      required: Boolean(normalizedColumn.required),
      readOnly: Boolean(normalizedColumn.readOnly),
      x,
      y: 0,
      w: fieldMeta.width,
      h: fieldMeta.height,
    });
    rowMap.set(rowNumber, rowItems);
  }

  const childItems: DetailLayoutItem[] = [];
  let cursorY = DETAIL_BOARD_GROUP_PADDING_Y;
  let maxRowWidth = DETAIL_BOARD_GROUPBOX_MIN_WIDTH - DETAIL_BOARD_GROUP_PADDING_X * 2;

  Array.from({ length: rows }, (_, index) => index + 1).forEach((rowNumber) => {
    const rowItems = rowMap.get(rowNumber) ?? [];
    const rowHeight = rowItems.reduce((max, item) => Math.max(max, item.h), 0);
    const rowWidth = rowItems.reduce((width, item, itemIndex) => (
      width + item.w + (itemIndex > 0 ? DETAIL_BOARD_GROUP_COLUMN_GAP : 0)
    ), 0);
    maxRowWidth = Math.max(maxRowWidth, rowWidth);

    rowItems.forEach((item) => {
      childItems.push({
        ...item,
        y: cursorY,
      });
    });

    cursorY += (rowHeight || 0) + DETAIL_BOARD_GROUP_ROW_GAP;
  });

  return {
    childItems,
    groupHeight: Math.max(
      DETAIL_BOARD_GROUPBOX_MIN_HEIGHT,
      DETAIL_BOARD_GROUP_HEADER_HEIGHT + DETAIL_BOARD_GROUP_BODY_GAP + cursorY,
    ),
    groupWidth: Math.max(
      DETAIL_BOARD_GROUPBOX_MIN_WIDTH,
      maxRowWidth + DETAIL_BOARD_GROUP_PADDING_X * 2,
    ),
  };
}

export function buildDetailLayoutDocumentFromDetailBoard(
  currentDetailBoard: Record<string, any>,
  availableGridColumns: Record<string, any>[],
  normalizeColumn: NormalizeColumn,
): DetailLayoutDocument {
  const availableColumnMap = buildColumnMap(availableGridColumns);
  const normalizedDesignerLayout = normalizeDesignerLayoutDocument(currentDetailBoard?.designerLayout, availableColumnMap);
  if (normalizedDesignerLayout) {
    return normalizedDesignerLayout;
  }

  let nextGroupY = 24;
  const items: DetailLayoutItem[] = [];

  (currentDetailBoard.groups ?? []).forEach((group: Record<string, any>, groupIndex: number) => {
    const groupId = String(group?.id || `detail_group_${groupIndex + 1}`);
    const { childItems, groupHeight, groupWidth } = buildGroupChildItems(group, groupId, availableColumnMap, normalizeColumn);
    items.push({
      id: groupId,
      type: 'groupbox',
      title: typeof group?.name === 'string' ? group.name : `信息分组 ${groupIndex + 1}`,
      parentId: null,
      x: 24,
      y: nextGroupY,
      w: groupWidth,
      h: groupHeight,
      rows: Math.max(DETAIL_BOARD_GROUP_MIN_ROWS, getDetailBoardGroupRows(group)),
    } as DetailLayoutItem & { rows?: number });
    items.push(...childItems);
    nextGroupY += groupHeight + DETAIL_BOARD_GROUP_GAP;
  });

  return createEmptyDetailLayoutDocument({
    items,
  });
}

export function buildArchiveDetailLayoutDocumentFromDetailBoard(
  currentDetailBoard: Record<string, any>,
  availableGridColumns: Record<string, any>[],
  normalizeColumn: NormalizeColumn,
): DetailLayoutDocument {
  const availableColumnMap = buildColumnMap(availableGridColumns);
  const normalizedDesignerLayout = normalizeDesignerLayoutDocument(currentDetailBoard?.designerLayout, availableColumnMap);
  if (normalizedDesignerLayout) {
    return normalizedDesignerLayout;
  }

  const groups = Array.isArray(currentDetailBoard?.groups) ? currentDetailBoard.groups : [];
  const items: DetailLayoutItem[] = [];
  let nextGroupY = 24;

  const appendGroup = (group: Record<string, any>, groupIndex: number) => {
    const effectiveColumnIds = Array.isArray(group?.columnIds)
      ? group.columnIds.map(String).filter((columnId) => availableColumnMap.has(columnId))
      : [];
    if (effectiveColumnIds.length === 0) {
      return;
    }

    const groupId = String(group?.id || `archive_detail_group_${groupIndex + 1}`);
    const { childItems, groupHeight, groupWidth } = buildGroupChildItems(
      {
        ...group,
        columnIds: effectiveColumnIds,
      },
      groupId,
      availableColumnMap,
      normalizeColumn,
    );
    items.push({
      id: groupId,
      type: 'groupbox',
      title: typeof group?.name === 'string' ? group.name : `信息分组 ${groupIndex + 1}`,
      parentId: null,
      x: 24,
      y: nextGroupY,
      w: groupWidth,
      h: groupHeight,
      rows: Math.max(DETAIL_BOARD_GROUP_MIN_ROWS, getDetailBoardGroupRows(group)),
    } as DetailLayoutItem & { rows?: number });
    items.push(...childItems);
    nextGroupY += groupHeight + DETAIL_BOARD_GROUP_GAP;
  };

  groups.forEach((group: Record<string, any>, groupIndex: number) => {
    appendGroup(group, groupIndex);
  });

  return createEmptyDetailLayoutDocument({
    items,
  });
}

function buildLegacyGroupFromItems(
  groupId: string,
  groupTitle: string,
  items: DetailLayoutItem[],
  previousGroupMap: Map<string, Record<string, any>>,
  usedFieldIds: Set<string>,
) {
  const children = items
    .filter((item) => item.field && !usedFieldIds.has(item.field))
    .sort((left, right) => (left.y - right.y) || (left.x - right.x));

  const rowAnchors = Array.from(new Set(children.map((item) => item.y))).sort((left, right) => left - right);
  const columnIds = children.map((item) => item.field as string);
  columnIds.forEach((columnId) => usedFieldIds.add(columnId));
  const previousGroup = previousGroupMap.get(groupId);
  const rowCounts = new Map<number, number>();

  for (const child of children) {
    const rowNumber = Math.max(1, rowAnchors.indexOf(child.y) + 1);
    rowCounts.set(rowNumber, (rowCounts.get(rowNumber) ?? 0) + 1);
  }

  const columnsPerRow = rowCounts.size > 0 ? Math.max(...rowCounts.values()) : 1;
  const configuredRows = Number(previousGroup?.rows);
  const detectedRows = Math.max(DETAIL_BOARD_GROUP_MIN_ROWS, rowAnchors.length || 1);

  return {
    id: groupId,
    name: groupTitle ?? previousGroup?.name ?? '信息分组',
    description: previousGroup?.description ?? '',
    columnIds,
    rows: Number.isFinite(configuredRows)
      ? Math.max(detectedRows, configuredRows)
      : detectedRows,
    columnRows: Object.fromEntries(children.map((child) => [child.field as string, Math.max(1, rowAnchors.indexOf(child.y) + 1)])),
    columnsPerRow,
    columnWidths: Object.fromEntries(children.map((child) => [child.field as string, Math.round(child.w)])),
    columnHeights: Object.fromEntries(children.map((child) => [child.field as string, Math.round(child.h)])),
  };
}

export function buildDetailBoardFromDesignerLayout(
  currentDetailBoard: Record<string, any>,
  document: DetailLayoutDocument,
) {
  const previousGroupMap = new Map<string, Record<string, any>>(
    (currentDetailBoard.groups ?? []).map((group: Record<string, any>) => [String(group.id), group]),
  );
  const childrenByParent = new Map<string | null, DetailLayoutItem[]>();

  document.items.forEach((item) => {
    const parentId = item.parentId ?? null;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(item);
    childrenByParent.set(parentId, siblings);
  });

  for (const siblings of childrenByParent.values()) {
    siblings.sort((left, right) => (left.y - right.y) || (left.x - right.x));
  }

  const usedFieldIds = new Set<string>();
  const groups: Record<string, any>[] = [];
  const rootItems = childrenByParent.get(null) ?? [];
  const rootFieldItems = rootItems.filter((item) => item.type !== 'groupbox' && item.field);

  if (rootFieldItems.length > 0) {
    groups.push(buildLegacyGroupFromItems(
      DETAIL_BOARD_DESIGNER_ROOT_GROUP_ID,
      previousGroupMap.get(DETAIL_BOARD_DESIGNER_ROOT_GROUP_ID)?.name ?? '未分组字段',
      rootFieldItems,
      previousGroupMap,
      usedFieldIds,
    ));
  }

  rootItems
    .filter((item) => item.type === 'groupbox')
    .forEach((groupItem) => {
      groups.push(buildLegacyGroupFromItems(
        groupItem.id,
        typeof groupItem.title === 'string' ? groupItem.title : '信息分组',
        childrenByParent.get(groupItem.id) ?? [],
        previousGroupMap,
        usedFieldIds,
      ));
    });

  return {
    ...currentDetailBoard,
    designerLayout: document,
    groups,
  };
}

export type DetailBoardDesignerPreviewGroup = {
  id: string;
  items: DetailLayoutItem[];
  title: string;
};

export function buildDetailBoardPreviewGroupsFromDesignerLayout(document: DetailLayoutDocument): DetailBoardDesignerPreviewGroup[] {
  const itemsByParent = new Map<string | null, DetailLayoutItem[]>();

  document.items.forEach((item) => {
    const parentId = item.parentId ?? null;
    const siblings = itemsByParent.get(parentId) ?? [];
    siblings.push(item);
    itemsByParent.set(parentId, siblings);
  });

  for (const siblings of itemsByParent.values()) {
    siblings.sort((left, right) => (left.y - right.y) || (left.x - right.x));
  }

  const previewGroups: DetailBoardDesignerPreviewGroup[] = [];
  const rootItems = itemsByParent.get(null) ?? [];
  const rootFieldItems = rootItems.filter((item) => item.type !== 'groupbox' && item.field);

  if (rootFieldItems.length > 0) {
    previewGroups.push({
      id: DETAIL_BOARD_DESIGNER_ROOT_GROUP_ID,
      items: rootFieldItems,
      title: '未分组字段',
    });
  }

  rootItems
    .filter((item) => item.type === 'groupbox')
    .forEach((groupItem) => {
      previewGroups.push({
        id: groupItem.id,
        items: itemsByParent.get(groupItem.id) ?? [],
        title: typeof groupItem.title === 'string' ? groupItem.title : '信息分组',
      });
    });

  return previewGroups;
}

export function buildDetailBoardFieldOptions(
  availableGridColumns: Record<string, any>[],
  normalizeColumn: NormalizeColumn,
): DetailLayoutFieldOption[] {
  return availableGridColumns
    .filter((column) => Boolean(column?.id))
    .map((column) => {
      const normalizedColumn = normalizeColumn(column);
      const fieldId = String(column.id);
      return {
        description: `${normalizedColumn.type || '字段'} · ${normalizedColumn.sourceField || column.id}`,
        itemType: mapColumnToDetailLayoutType(normalizedColumn),
        label: normalizedColumn.sourceField
          ? `${normalizedColumn.name || fieldId} · ${normalizedColumn.sourceField}`
          : (normalizedColumn.name || fieldId),
        rawField: column,
        readOnly: Boolean(normalizedColumn.readOnly),
        required: Boolean(normalizedColumn.required),
        title: normalizedColumn.name || normalizedColumn.sourceField || fieldId,
        value: fieldId,
      };
    });
}

type SuggestedLayoutBucketKey = 'basic' | 'business' | 'extra' | 'audit';

const SUGGESTED_LAYOUT_BUCKETS: Array<{
  description: string;
  key: SuggestedLayoutBucketKey;
  title: string;
}> = [
  { key: 'basic', title: '基础信息', description: '主编码、名称、分类与基础归属信息' },
  { key: 'business', title: '业务信息', description: '状态、组织、人员、日期与业务属性' },
  { key: 'extra', title: '扩展信息', description: '补充说明、联系信息与备注内容' },
  { key: 'audit', title: '审计信息', description: '创建、修改、审核与系统追踪字段' },
];

const AUDIT_FIELD_KEYWORDS = ['创建', '修改', '更新', '审核', '审批', '登记', '制单', '录入', '停用', '启用'];
const EXTRA_FIELD_KEYWORDS = ['备注', '说明', '描述', '原因', '地址', '电话', '手机', '邮箱', '联系'];
const BASIC_FIELD_KEYWORDS = ['编码', '编号', '名称', '简称', '类型', '分类', '键值', '标识', '代码'];
const BUSINESS_FIELD_KEYWORDS = ['状态', '组织', '部门', '员工', '人员', '客户', '供应商', '仓库', '项目', '日期', '时间', '数量', '金额', '单位'];
const LONG_FIELD_KEYWORDS = ['备注', '说明', '描述', '地址', '原因', '内容', '详情'];

function normalizeSuggestedLayoutFieldText(normalizedColumn: Record<string, any>) {
  return `${String(normalizedColumn.name || '')} ${String(normalizedColumn.sourceField || '')}`.trim().toLowerCase();
}

function includesSuggestedLayoutKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function buildSuggestedArchiveLayoutGroups(
  availableGridColumns: Record<string, any>[],
  normalizeColumn: NormalizeColumn,
) {
  const groupedColumns = new Map<SuggestedLayoutBucketKey, Array<{ column: Record<string, any>; normalizedColumn: Record<string, any> }>>(
    SUGGESTED_LAYOUT_BUCKETS.map((bucket) => [bucket.key, []]),
  );

  availableGridColumns
    .filter((column) => Boolean(column?.id))
    .forEach((column) => {
      const normalizedColumn = normalizeColumn(column);
      const fieldMeta = buildLayoutFieldWorkbenchMeta(normalizeColumn, column);
      const bucketKey = resolveSuggestedLayoutBucket(normalizedColumn, fieldMeta.isTallControl);
      groupedColumns.get(bucketKey)?.push({ column, normalizedColumn });
    });

  return SUGGESTED_LAYOUT_BUCKETS
    .map((bucket, index) => {
      const bucketFields = (groupedColumns.get(bucket.key) ?? [])
        .sort((left, right) => (
          resolveSuggestedLayoutOrderScore(left.normalizedColumn) - resolveSuggestedLayoutOrderScore(right.normalizedColumn)
        ) || String(left.column.orderId ?? '').localeCompare(String(right.column.orderId ?? '')));

      if (bucketFields.length === 0) {
        return null;
      }

      let currentRow = 1;
      let itemsInRow = 0;
      const columnIds: string[] = [];
      const columnRows: Record<string, number> = {};
      const columnWidths: Record<string, number> = {};
      const columnHeights: Record<string, number> = {};

      bucketFields.forEach(({ column, normalizedColumn }) => {
        const fieldMeta = buildLayoutFieldWorkbenchMeta(normalizeColumn, column);
        const fieldId = String(column.id);
        const forceSingleRow = fieldMeta.isTallControl || includesSuggestedLayoutKeyword(
          normalizeSuggestedLayoutFieldText(normalizedColumn),
          LONG_FIELD_KEYWORDS,
        );

        if (forceSingleRow && itemsInRow > 0) {
          currentRow += 1;
          itemsInRow = 0;
        }

        columnIds.push(fieldId);
        columnRows[fieldId] = currentRow;
        columnWidths[fieldId] = resolveSuggestedFieldWidth(normalizedColumn, fieldMeta.width, forceSingleRow);

        if (fieldMeta.isTallControl) {
          columnHeights[fieldId] = Math.max(fieldMeta.height, 104);
        }

        if (forceSingleRow) {
          currentRow += 1;
          itemsInRow = 0;
          return;
        }

        itemsInRow += 1;
        if (itemsInRow >= 2) {
          currentRow += 1;
          itemsInRow = 0;
        }
      });

      const usedRows = Math.max(1, ...Object.values(columnRows));

      return {
        columnHeights,
        columnIds,
        columnRows,
        columnWidths,
        columnsPerRow: 2,
        description: bucket.description,
        id: `suggested_detail_group_${bucket.key}_${index + 1}`,
        name: bucket.title,
        rows: Math.max(DETAIL_BOARD_GROUP_MIN_ROWS, Math.min(DETAIL_BOARD_GROUP_MAX_ROWS, usedRows)),
      };
    })
    .filter(Boolean) as Record<string, any>[];
}

function createArchiveLayoutSchemeId(prefix = 'archive_layout_scheme') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createArchiveLayoutSchemeGroupId(prefix = 'archive_layout_scheme_group') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlankArchiveLayoutScheme(name = '新方案'): ArchiveLayoutScheme {
  return {
    fieldDefaults: {},
    groups: [
      {
        fieldIds: [],
        id: createArchiveLayoutSchemeGroupId(),
        name: '信息分组 1',
      },
    ],
    id: createArchiveLayoutSchemeId(),
    name,
  };
}

export function normalizeArchiveLayoutSchemes(
  rawSchemes: unknown,
  availableGridColumns: Record<string, any>[],
): ArchiveLayoutScheme[] {
  if (!Array.isArray(rawSchemes)) {
    return [];
  }

  const validFieldIds = new Set(
    availableGridColumns
      .filter((column) => Boolean(column?.id))
      .map((column) => String(column.id)),
  );

  return rawSchemes
    .filter((scheme): scheme is Record<string, any> => isPlainObject(scheme))
    .map((scheme, schemeIndex) => {
      const usedFieldIds = new Set<string>();
      const groups = Array.isArray(scheme.groups)
        ? scheme.groups
          .filter((group): group is Record<string, any> => isPlainObject(group))
          .map((group, groupIndex) => {
            const fieldIds = Array.isArray(group.fieldIds)
              ? group.fieldIds
                .map((fieldId) => String(fieldId))
                .filter((fieldId) => {
                  if (!validFieldIds.has(fieldId) || usedFieldIds.has(fieldId)) {
                    return false;
                  }
                  usedFieldIds.add(fieldId);
                  return true;
                })
              : [];

            return {
              fieldIds,
              id: typeof group.id === 'string' && group.id.trim()
                ? group.id
                : createArchiveLayoutSchemeGroupId(`archive_layout_scheme_group_${schemeIndex + 1}_${groupIndex + 1}`),
              name: typeof group.name === 'string' && group.name.trim()
                ? group.name
                : `信息分组 ${groupIndex + 1}`,
            } satisfies ArchiveLayoutSchemeGroup;
          })
        : [];

      const fieldDefaults = isPlainObject(scheme.fieldDefaults)
        ? Array.from(usedFieldIds).reduce<Record<string, ArchiveLayoutSchemeFieldDefaults>>((result, fieldId) => {
          const defaults = scheme.fieldDefaults?.[fieldId];
          if (!isPlainObject(defaults)) {
            return result;
          }

          const nextDefaults: ArchiveLayoutSchemeFieldDefaults = {};
          if (isFiniteNumber(defaults.w) && Number(defaults.w) > 0) {
            nextDefaults.w = Number(defaults.w);
          }
          if (isFiniteNumber(defaults.h) && Number(defaults.h) > 0) {
            nextDefaults.h = Number(defaults.h);
          }
          if (typeof nextDefaults.w === 'number' || typeof nextDefaults.h === 'number') {
            result[fieldId] = nextDefaults;
          }
          return result;
        }, {})
        : {};

      return {
        fieldDefaults,
        groups: groups.length > 0 ? groups : createBlankArchiveLayoutScheme().groups,
        id: typeof scheme.id === 'string' && scheme.id.trim()
          ? scheme.id
          : createArchiveLayoutSchemeId(`archive_layout_scheme_${schemeIndex + 1}`),
        name: typeof scheme.name === 'string' && scheme.name.trim()
          ? scheme.name
          : `方案 ${schemeIndex + 1}`,
      } satisfies ArchiveLayoutScheme;
    });
}

export function buildSuggestedArchiveLayoutScheme(
  availableGridColumns: Record<string, any>[],
  normalizeColumn: NormalizeColumn,
): ArchiveLayoutScheme {
  const suggestedGroups = buildSuggestedArchiveLayoutGroups(availableGridColumns, normalizeColumn);
  if (suggestedGroups.length === 0) {
    return createBlankArchiveLayoutScheme('默认方案');
  }

  return {
    fieldDefaults: {},
    groups: suggestedGroups.map((group, index) => ({
      fieldIds: Array.isArray(group.columnIds) ? group.columnIds.map(String) : [],
      id: typeof group.id === 'string' && group.id.trim() ? group.id : createArchiveLayoutSchemeGroupId(),
      name: typeof group.name === 'string' && group.name.trim() ? group.name : `信息分组 ${index + 1}`,
    })),
    id: createArchiveLayoutSchemeId('archive_layout_scheme_suggested'),
    name: '默认方案',
  };
}

export function buildArchiveLayoutDocumentFromScheme(
  scheme: ArchiveLayoutScheme,
  availableGridColumns: Record<string, any>[],
  normalizeColumn: NormalizeColumn,
  previewWorkbenchWidth: number = DETAIL_BOARD_GROUPBOX_MIN_WIDTH,
): DetailLayoutDocument {
  const availableColumnMap = buildColumnMap(availableGridColumns);
  const items: DetailLayoutItem[] = [];
  let nextGroupY = 24;
  const groupWidth = Math.max(DETAIL_BOARD_GROUPBOX_MIN_WIDTH, Math.round(Number(previewWorkbenchWidth) || DETAIL_BOARD_GROUPBOX_MIN_WIDTH));
  const usableGroupWidth = Math.max(DETAIL_BOARD_GROUP_PADDING_X, groupWidth - DETAIL_BOARD_GROUP_PADDING_X * 2);

  scheme.groups.forEach((group, groupIndex) => {
    const groupId = String(group.id || `archive_layout_scheme_group_${groupIndex + 1}`);
    const fieldIds = group.fieldIds
      .map(String)
      .filter((fieldId) => availableColumnMap.has(fieldId));
    let nextFieldX = DETAIL_BOARD_GROUP_PADDING_X;
    let nextFieldY = DETAIL_BOARD_GROUP_PADDING_Y;
    let currentRowHeight = 0;
    let currentRowCount = 1;

    items.push({
      h: DETAIL_BOARD_GROUPBOX_MIN_HEIGHT,
      id: groupId,
      type: 'groupbox',
      w: groupWidth,
      x: 24,
      y: nextGroupY,
      title: group.name || `信息分组 ${groupIndex + 1}`,
      rows: 1,
    } as DetailLayoutItem & { rows?: number });

    fieldIds.forEach((fieldId, fieldIndex) => {
      const rawColumn = availableColumnMap.get(fieldId);
      if (!rawColumn) {
        return;
      }

      const normalizedColumn = normalizeColumn(rawColumn);
      const preferredDefaults = scheme.fieldDefaults?.[fieldId];
      const fieldMeta = buildLayoutFieldWorkbenchMeta(
        normalizeColumn,
        rawColumn,
        preferredDefaults?.w,
        preferredDefaults?.h,
      );
      const resolvedWidth = Number.isFinite(Number(preferredDefaults?.w)) && Number(preferredDefaults?.w) > 0
        ? Number(preferredDefaults?.w)
        : fieldMeta.width;
      const resolvedHeight = Number.isFinite(Number(preferredDefaults?.h)) && Number(preferredDefaults?.h) > 0
        ? Number(preferredDefaults?.h)
        : fieldMeta.height;
      if (
        nextFieldX > DETAIL_BOARD_GROUP_PADDING_X
        && nextFieldX + resolvedWidth > DETAIL_BOARD_GROUP_PADDING_X + usableGroupWidth
      ) {
        nextFieldX = DETAIL_BOARD_GROUP_PADDING_X;
        nextFieldY += Math.max(currentRowHeight, resolvedHeight) + DETAIL_BOARD_GROUP_ROW_GAP;
        currentRowHeight = 0;
        currentRowCount += 1;
      }
      items.push({
        h: resolvedHeight,
        id: `${groupId}::${fieldId}::${fieldIndex + 1}`,
        type: mapColumnToDetailLayoutType(normalizedColumn),
        w: resolvedWidth,
        x: nextFieldX,
        y: nextFieldY,
        field: fieldId,
        parentId: groupId,
        readOnly: Boolean(normalizedColumn.readOnly),
        required: Boolean(normalizedColumn.required),
        title: normalizedColumn.name || normalizedColumn.sourceField || fieldId,
      });
      currentRowHeight = Math.max(currentRowHeight, resolvedHeight);
      nextFieldX += resolvedWidth + DETAIL_BOARD_GROUP_COLUMN_GAP;
    });

    const groupItem = items[items.length - fieldIds.length - 1] as DetailLayoutItem & { rows?: number };
    groupItem.rows = Math.max(1, currentRowCount);

    nextGroupY += DETAIL_BOARD_GROUPBOX_MIN_HEIGHT + DETAIL_BOARD_GROUP_GAP;
  });

  return createEmptyDetailLayoutDocument({
    items,
  });
}

function resolveSuggestedLayoutBucket(
  normalizedColumn: Record<string, any>,
  isTallControl: boolean,
): SuggestedLayoutBucketKey {
  const fieldText = normalizeSuggestedLayoutFieldText(normalizedColumn);

  if (includesSuggestedLayoutKeyword(fieldText, AUDIT_FIELD_KEYWORDS)) {
    return 'audit';
  }

  if (isTallControl || includesSuggestedLayoutKeyword(fieldText, EXTRA_FIELD_KEYWORDS)) {
    return 'extra';
  }

  if (includesSuggestedLayoutKeyword(fieldText, BASIC_FIELD_KEYWORDS)) {
    return 'basic';
  }

  if (includesSuggestedLayoutKeyword(fieldText, BUSINESS_FIELD_KEYWORDS)) {
    return 'business';
  }

  return 'business';
}

function resolveSuggestedLayoutOrderScore(normalizedColumn: Record<string, any>) {
  const fieldText = normalizeSuggestedLayoutFieldText(normalizedColumn);

  if (includesSuggestedLayoutKeyword(fieldText, ['编码', '编号', '标识', '代码'])) return 10;
  if (includesSuggestedLayoutKeyword(fieldText, ['名称', '简称'])) return 20;
  if (includesSuggestedLayoutKeyword(fieldText, ['类型', '分类'])) return 30;
  if (includesSuggestedLayoutKeyword(fieldText, ['状态'])) return 40;
  if (includesSuggestedLayoutKeyword(fieldText, ['组织', '部门', '人员', '员工', '客户', '供应商', '仓库'])) return 50;
  if (includesSuggestedLayoutKeyword(fieldText, ['日期', '时间'])) return 60;
  if (includesSuggestedLayoutKeyword(fieldText, ['数量', '金额', '单位'])) return 70;
  if (includesSuggestedLayoutKeyword(fieldText, EXTRA_FIELD_KEYWORDS)) return 90;
  if (includesSuggestedLayoutKeyword(fieldText, AUDIT_FIELD_KEYWORDS)) return 100;
  return 80;
}

function resolveSuggestedFieldWidth(normalizedColumn: Record<string, any>, fallbackWidth: number, isTallControl: boolean) {
  const fieldText = normalizeSuggestedLayoutFieldText(normalizedColumn);

  if (isTallControl || includesSuggestedLayoutKeyword(fieldText, LONG_FIELD_KEYWORDS)) {
    return Math.max(620, Math.min(840, fallbackWidth + 260));
  }

  if (includesSuggestedLayoutKeyword(fieldText, ['编码', '编号', '状态', '类型', '分类', '日期', '时间'])) {
    return Math.max(240, Math.min(300, fallbackWidth));
  }

  if (String(normalizedColumn.name || '').trim().length >= 8) {
    return Math.max(300, Math.min(380, fallbackWidth + 48));
  }

  return Math.max(280, Math.min(340, fallbackWidth));
}

export function buildSuggestedDetailBoardLayout(
  currentDetailBoard: Record<string, any>,
  availableGridColumns: Record<string, any>[],
  normalizeColumn: NormalizeColumn,
) {
  if (availableGridColumns.length === 0) {
    const nextDetailBoard = {
      ...currentDetailBoard,
      enabled: true,
      groups: [
        buildDetailBoardGroup(1, [], {
          description: '当前还没有字段，可以先新增分组，后续再把主表字段拖进来。',
          id: 'archive_group_basic',
          name: '基础信息',
          rows: 1,
        }),
      ],
      sortColumnId: null,
    };

    return {
      ...nextDetailBoard,
      designerLayout: buildDetailLayoutDocumentFromDetailBoard(nextDetailBoard, availableGridColumns, normalizeColumn),
    };
  }

  const groups = buildSuggestedArchiveLayoutGroups(availableGridColumns, normalizeColumn);

  const nextDetailBoard = {
    ...currentDetailBoard,
    enabled: true,
    groups,
    sortColumnId: currentDetailBoard.sortColumnId ?? availableGridColumns[0]?.id ?? null,
  };

  return {
    ...nextDetailBoard,
    designerLayout: buildDetailLayoutDocumentFromDetailBoard(nextDetailBoard, availableGridColumns, normalizeColumn),
  };
}

export function getDetailBoardFieldDefaultSize(
  normalizeColumn: NormalizeColumn,
  rawField: Record<string, any>,
) {
  const fieldMeta = buildLayoutFieldWorkbenchMeta(normalizeColumn, rawField);
  return {
    h: fieldMeta.height,
    w: fieldMeta.width,
  };
}
