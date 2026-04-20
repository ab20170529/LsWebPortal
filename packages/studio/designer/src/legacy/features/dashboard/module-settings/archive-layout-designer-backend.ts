import type {
  SingleTableDesignerControlDto,
  SingleTableDesignerGroupDto,
  SingleTableDesignerLayoutDto,
} from '../../../lib/backend-module-config';

type LayoutRect = {
  bottom: number;
  centerX: number;
  centerY: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

type ColumnLookup = {
  byBackendId: Map<string, Record<string, any>>;
  byControlName: Map<string, Record<string, any>>;
  byFieldKey: Map<string, Record<string, any>>;
  byName: Map<string, Record<string, any>>;
  bySourceField: Map<string, Record<string, any>>;
};

type RecordIdentity = {
  backendId: unknown;
  controlName: string;
  displayName: string;
  fieldKey: string;
  fieldName: string;
};

type DesignerLayoutEntry = {
  columnId: string;
  height: number;
  orderId: number;
  raw: SingleTableDesignerLayoutDto;
  rect: LayoutRect;
  width: number;
};

export type ArchiveLayoutDesignerGroupSource = {
  configuredColumnsPerRow: number;
  configuredRows: number;
  description: string;
  id: string;
  name: string;
  raw: SingleTableDesignerGroupDto;
  rect: LayoutRect | null;
};

export type ArchiveLayoutDesignerControlSource = {
  backendId: unknown;
  columnId: string;
  controlHeight: number;
  controlName: string;
  controlWidth: number;
  defaultValue: string;
  fieldKey: string;
  fieldName: string;
  groupName: string;
  layoutRow: SingleTableDesignerLayoutDto | null;
  name: string;
  orderId: number;
  raw: SingleTableDesignerControlDto;
};

export type ArchiveLayoutSourceState = {
  controls: ArchiveLayoutDesignerControlSource[];
  formKey: string;
  groups: ArchiveLayoutDesignerGroupSource[];
  layoutRows: SingleTableDesignerLayoutDto[];
  moduleCode: string;
};

export type ArchiveLayoutSavePlan = {
  formKey: string;
  groupDeleteIds: Array<number | string>;
  groupSaveBodies: Record<string, unknown>[];
  layoutDeleteFieldIds: Array<number | string>;
  layoutSaveBodies: Record<string, unknown>[];
};

const GROUP_COLUMNS_PER_ROW_KEYS = [
  'columnsPerRow',
  'columnCount',
  'columnNum',
  'columnnum',
  'colCount',
  'colcount',
];

const GROUP_ROW_COUNT_KEYS = [
  'rows',
  'rowCount',
  'rowcount',
  'rowNum',
  'rownum',
  'lineCount',
  'linecount',
];

const RECT_BOTTOM_KEYS = [
  'bottom',
  'Bottom',
  'controlBottom',
  'ControlBottom',
  'groupBottom',
  'GroupBottom',
];

const RECT_HEIGHT_KEYS = [
  'height',
  'Height',
  'controlHeight',
  'ControlHeight',
  'controlH',
  'ControlH',
  'groupHeight',
  'GroupHeight',
  'layoutHeight',
  'LayoutHeight',
  'locationHeight',
  'LocationHeight',
  'posHeight',
  'PosHeight',
  'boxHeight',
  'BoxHeight',
];

const RECT_LEFT_KEYS = [
  'left',
  'Left',
  'controlLeft',
  'ControlLeft',
  'groupLeft',
  'GroupLeft',
  'locationLeft',
  'LocationLeft',
  'locationX',
  'LocationX',
  'posLeft',
  'PosLeft',
  'posX',
  'PosX',
  'x',
  'X',
  'startX',
  'StartX',
  'boxLeft',
  'BoxLeft',
];

const RECT_RIGHT_KEYS = [
  'right',
  'Right',
  'controlRight',
  'ControlRight',
  'groupRight',
  'GroupRight',
  'locationRight',
  'LocationRight',
];

const RECT_TOP_KEYS = [
  'top',
  'Top',
  'controlTop',
  'ControlTop',
  'groupTop',
  'GroupTop',
  'locationTop',
  'LocationTop',
  'locationY',
  'LocationY',
  'posTop',
  'PosTop',
  'posY',
  'PosY',
  'y',
  'Y',
  'startY',
  'StartY',
  'boxTop',
  'BoxTop',
];

const RECT_WIDTH_KEYS = [
  'width',
  'Width',
  'controlWidth',
  'ControlWidth',
  'controlW',
  'ControlW',
  'groupWidth',
  'GroupWidth',
  'layoutWidth',
  'LayoutWidth',
  'locationWidth',
  'LocationWidth',
  'posWidth',
  'PosWidth',
  'boxWidth',
  'BoxWidth',
];

const GROUP_HEADER_HEIGHT = 56;
const GROUP_GAP = 22;
const GROUP_MIN_HEIGHT = GROUP_HEADER_HEIGHT + 96;
const GROUP_PADDING_X = 18;
const GROUP_PADDING_BOTTOM = 18;
const GROUP_PADDING_TOP = 16;
const FIELD_GAP = 14;
const DEFAULT_ROW_GAP = 14;
const STAGE_OFFSET_X = 24;
const STAGE_TOP_PADDING = 24;
const STAGE_WIDTH = 760;
const UNASSIGNED_LEFT = 24;
const UNASSIGNED_TOP_GAP = 48;
const UNASSIGNED_ROW_GAP = 16;
const UNASSIGNED_WIDTH = 120;
const UNASSIGNED_HEIGHT = 36;
const DESIGNER_GROUP_CONTROL_TYPE = 333;

function normalizeLookupKey(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeRecordKey(value: unknown) {
  return normalizeLookupKey(value).replace(/[^a-z0-9]/g, '');
}

function stripBraces(value: string) {
  return value.replace(/[{}]/g, '').trim();
}

function getRecordFieldValue(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      return record[key];
    }
  }

  const normalizedEntries = Object.entries(record).map(([key, value]) => [normalizeRecordKey(key), value] as const);
  for (const key of keys) {
    const normalizedKey = normalizeRecordKey(key);
    const matched = normalizedEntries.find(([candidate]) => candidate === normalizedKey);
    if (matched) {
      return matched[1];
    }
  }

  return undefined;
}

function toRecordText(value: unknown) {
  if (value == null) return '';
  return String(value).trim();
}

function toRecordNumber(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function stripUndefinedEntries<T extends Record<string, unknown>>(record: T) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  ) as T;
}

function clampGroupRows(value: number) {
  return Math.min(6, Math.max(1, value));
}

function buildBaseColumnLookup(columns: Record<string, any>[]): ColumnLookup {
  const byBackendId = new Map<string, Record<string, any>>();
  const byControlName = new Map<string, Record<string, any>>();
  const byFieldKey = new Map<string, Record<string, any>>();
  const byName = new Map<string, Record<string, any>>();
  const bySourceField = new Map<string, Record<string, any>>();

  columns.forEach((column) => {
    const backendIdKey = normalizeLookupKey(column.backendId);
    const controlNameKey = normalizeLookupKey(column.controlName);
    const fieldKey = normalizeLookupKey(column.fieldKey || column.backendFieldKey);
    const sourceFieldKey = normalizeLookupKey(column.sourceField || column.fieldName);
    const nameKey = normalizeLookupKey(column.name);

    if (backendIdKey) {
      byBackendId.set(backendIdKey, column);
    }
    if (controlNameKey) {
      byControlName.set(controlNameKey, column);
    }
    if (fieldKey) {
      byFieldKey.set(fieldKey, column);
    }
    if (sourceFieldKey) {
      bySourceField.set(sourceFieldKey, column);
    }
    if (nameKey) {
      byName.set(nameKey, column);
    }
  });

  return { byBackendId, byControlName, byFieldKey, byName, bySourceField };
}

function resolveRecordIdentity(record: Record<string, unknown>): RecordIdentity {
  return {
    backendId: getRecordFieldValue(record, 'fieldid', 'fieldId', 'controlid', 'controlId'),
    controlName: toRecordText(getRecordFieldValue(record, 'controlname', 'controlName')),
    displayName: toRecordText(getRecordFieldValue(record, 'username', 'userName', 'displayName', 'name', 'caption', 'title')),
    fieldKey: toRecordText(getRecordFieldValue(record, 'fieldkey', 'fieldKey')),
    fieldName: toRecordText(getRecordFieldValue(record, 'fieldname', 'fieldName', 'sqlfield', 'sqlField')),
  };
}

function findMatchedColumn(identity: RecordIdentity, lookup: ColumnLookup) {
  const backendIdKey = normalizeLookupKey(identity.backendId);
  const controlNameKey = normalizeLookupKey(identity.controlName);
  const displayNameKey = normalizeLookupKey(identity.displayName);
  const fieldKey = normalizeLookupKey(identity.fieldKey);
  const fieldNameKey = normalizeLookupKey(identity.fieldName);

  return lookup.byBackendId.get(backendIdKey)
    ?? lookup.byControlName.get(controlNameKey)
    ?? lookup.bySourceField.get(fieldNameKey)
    ?? lookup.byFieldKey.get(fieldKey)
    ?? lookup.byName.get(displayNameKey)
    ?? null;
}

function resolveLayoutRect(
  record: Record<string, unknown>,
  fallbackWidth: number = Number.NaN,
  fallbackHeight: number = Number.NaN,
): LayoutRect | null {
  const left = toRecordNumber(getRecordFieldValue(record, ...RECT_LEFT_KEYS), Number.NaN);
  const top = toRecordNumber(getRecordFieldValue(record, ...RECT_TOP_KEYS), Number.NaN);
  const right = toRecordNumber(getRecordFieldValue(record, ...RECT_RIGHT_KEYS), Number.NaN);
  const bottom = toRecordNumber(getRecordFieldValue(record, ...RECT_BOTTOM_KEYS), Number.NaN);

  let width = toRecordNumber(getRecordFieldValue(record, ...RECT_WIDTH_KEYS), fallbackWidth);
  let height = toRecordNumber(getRecordFieldValue(record, ...RECT_HEIGHT_KEYS), fallbackHeight);

  if ((!Number.isFinite(width) || width <= 0) && Number.isFinite(left) && Number.isFinite(right)) {
    width = right - left;
  }
  if ((!Number.isFinite(height) || height <= 0) && Number.isFinite(top) && Number.isFinite(bottom)) {
    height = bottom - top;
  }

  if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return {
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2,
    height,
    left,
    right: left + width,
    top,
    width,
  };
}

function getRectArea(rect: LayoutRect) {
  return rect.width * rect.height;
}

function isPointInsideRect(rect: LayoutRect, x: number, y: number) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function getRectOverlapArea(left: LayoutRect, right: LayoutRect) {
  const overlapWidth = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
  const overlapHeight = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
  return overlapWidth * overlapHeight;
}

function mapDesignerControlToColumn(
  control: SingleTableDesignerControlDto,
  index: number,
  lookup: ColumnLookup,
) {
  const identity = resolveRecordIdentity(control);
  const matchedColumn = findMatchedColumn(identity, lookup);

  const width = toRecordNumber(
    getRecordFieldValue(control, 'controlWidth', 'width'),
    Number(matchedColumn?.width) > 0 ? Number(matchedColumn.width) : 120,
  );
  const height = toRecordNumber(
    getRecordFieldValue(control, 'controlHeight', 'height'),
    Number(matchedColumn?.layoutHeight) > 0 ? Number(matchedColumn.layoutHeight) : 21,
  );

  return {
    ...(matchedColumn ?? {}),
    ...control,
    id: matchedColumn?.id ?? (normalizeLookupKey(identity.backendId) ? `field_${normalizeLookupKey(identity.backendId)}` : `designer_control_${index + 1}`),
    backendId: identity.backendId ?? matchedColumn?.backendId ?? null,
    controlHeight: height,
    controlName: identity.controlName || matchedColumn?.controlName || '',
    controlWidth: width,
    defaultValue: toRecordText(getRecordFieldValue(control, 'defaultValue', 'defaultvalue')) || matchedColumn?.defaultValue || '',
    fieldKey: identity.fieldKey || matchedColumn?.fieldKey || matchedColumn?.backendFieldKey || '',
    fieldName: identity.fieldName || matchedColumn?.fieldName || '',
    groupName: toRecordText(getRecordFieldValue(control, 'groupname', 'groupName')) || matchedColumn?.groupName || '',
    layoutHeight: height,
    name: identity.displayName || matchedColumn?.name || identity.fieldName || `Field ${index + 1}`,
    orderId: toRecordNumber(getRecordFieldValue(control, 'orderid', 'orderId', 'tabOrder'), index + 1),
    sourceField: identity.fieldName || matchedColumn?.sourceField || '',
    type: matchedColumn?.type || 'text',
    width,
  };
}

function buildDesignerColumnId(identity: RecordIdentity, fallbackPrefix: string, index: number) {
  const backendIdKey = normalizeLookupKey(identity.backendId);
  if (backendIdKey) {
    return `field_${backendIdKey}`;
  }

  const fieldNameKey = normalizeLookupKey(identity.fieldName || identity.controlName || identity.fieldKey)
    .replace(/[^a-z0-9_-]/g, '_');
  if (fieldNameKey) {
    return `field_${fieldNameKey}`;
  }

  return `${fallbackPrefix}_${index + 1}`;
}

function mapDesignerLayoutRowToColumn(
  layoutRow: SingleTableDesignerLayoutDto,
  index: number,
  lookup: ColumnLookup,
) {
  const identity = resolveRecordIdentity(layoutRow);
  const matchedColumn = findMatchedColumn(identity, lookup);
  const rect = resolveLayoutRect(
    layoutRow,
    Number(matchedColumn?.controlWidth || matchedColumn?.width) > 0
      ? Number(matchedColumn.controlWidth || matchedColumn.width)
      : 120,
    Number(matchedColumn?.controlHeight || matchedColumn?.layoutHeight) > 0
      ? Number(matchedColumn.controlHeight || matchedColumn.layoutHeight)
      : 21,
  );

  const width = rect?.width ?? toRecordNumber(
    getRecordFieldValue(layoutRow, 'controlWidth', 'width'),
    Number(matchedColumn?.width) > 0 ? Number(matchedColumn.width) : 120,
  );
  const height = rect?.height ?? toRecordNumber(
    getRecordFieldValue(layoutRow, 'controlHeight', 'height', 'layoutHeight'),
    Number(matchedColumn?.layoutHeight) > 0 ? Number(matchedColumn.layoutHeight) : 21,
  );

  return {
    ...(matchedColumn ?? {}),
    ...layoutRow,
    id: matchedColumn?.id ?? buildDesignerColumnId(identity, 'designer_layout', index),
    backendId: identity.backendId ?? matchedColumn?.backendId ?? null,
    canvasX: rect?.left ?? matchedColumn?.canvasX ?? 0,
    canvasY: rect?.top ?? matchedColumn?.canvasY ?? 0,
    controlHeight: height,
    controlName: identity.controlName || matchedColumn?.controlName || identity.fieldName || '',
    controlWidth: width,
    defaultValue: toRecordText(getRecordFieldValue(layoutRow, 'defaultValue', 'defaultvalue')) || matchedColumn?.defaultValue || '',
    fieldKey: identity.fieldKey || matchedColumn?.fieldKey || matchedColumn?.backendFieldKey || '',
    fieldName: identity.fieldName || matchedColumn?.fieldName || '',
    groupName: toRecordText(getRecordFieldValue(layoutRow, 'groupname', 'groupName')) || matchedColumn?.groupName || '',
    layoutHeight: height,
    name: identity.displayName || matchedColumn?.name || identity.fieldName || `Field ${index + 1}`,
    orderId: toRecordNumber(getRecordFieldValue(layoutRow, 'orderid', 'orderId', 'tabOrder', 'zindex', 'zIndex'), index + 1),
    sourceField: identity.fieldName || matchedColumn?.sourceField || '',
    type: matchedColumn?.type || 'text',
    width,
  };
}

function mapDesignerGroup(group: SingleTableDesignerGroupDto, groupIndex: number): ArchiveLayoutDesignerGroupSource {
  const rect = resolveLayoutRect(group);

  return {
    configuredColumnsPerRow: Math.max(
      1,
      toRecordNumber(getRecordFieldValue(group, ...GROUP_COLUMNS_PER_ROW_KEYS), 2),
    ),
    configuredRows: clampGroupRows(
      toRecordNumber(getRecordFieldValue(group, ...GROUP_ROW_COUNT_KEYS), 1),
    ),
    description: toRecordText(getRecordFieldValue(group, 'description', 'remark', 'memo')),
    id: toRecordText(getRecordFieldValue(group, 'id', 'groupid', 'groupId')) || `designer_group_${groupIndex + 1}`,
    name: toRecordText(getRecordFieldValue(group, 'groupname', 'groupName', 'name', 'caption', 'title')) || `Group ${groupIndex + 1}`,
    raw: group,
    rect,
  };
}

function mapDesignerPositionRecordToEntry(
  layoutRow: Record<string, unknown>,
  index: number,
  lookup: ColumnLookup,
): DesignerLayoutEntry | null {
  const identity = resolveRecordIdentity(layoutRow);
  const matchedColumn = findMatchedColumn(identity, lookup);
  if (!matchedColumn?.id) {
    return null;
  }

  const widthFallback = Number(matchedColumn.controlWidth || matchedColumn.width) > 0
    ? Number(matchedColumn.controlWidth || matchedColumn.width)
    : 120;
  const heightFallback = Number(matchedColumn.controlHeight || matchedColumn.layoutHeight) > 0
    ? Number(matchedColumn.controlHeight || matchedColumn.layoutHeight)
    : 21;
  const rect = resolveLayoutRect(layoutRow, widthFallback, heightFallback);
  if (!rect) {
    return null;
  }

  return {
    columnId: String(matchedColumn.id),
    height: rect.height,
    orderId: toRecordNumber(getRecordFieldValue(layoutRow, 'orderid', 'orderId', 'tabOrder', 'zindex', 'zIndex'), index + 1),
    raw: layoutRow,
    rect,
    width: rect.width,
  };
}

function chooseTargetGroup(entry: DesignerLayoutEntry, groups: ArchiveLayoutDesignerGroupSource[]) {
  const groupsWithRect = groups.filter((group) => group.rect);

  const topLeftMatches = groupsWithRect.filter((group) => (
    group.rect && isPointInsideRect(group.rect, entry.rect.left + 1, entry.rect.top + 1)
  ));
  if (topLeftMatches.length > 0) {
    return [...topLeftMatches].sort((left, right) => getRectArea(left.rect!) - getRectArea(right.rect!))[0] ?? null;
  }

  const centerMatches = groupsWithRect.filter((group) => (
    group.rect && isPointInsideRect(group.rect, entry.rect.centerX, entry.rect.centerY)
  ));
  if (centerMatches.length > 0) {
    return [...centerMatches].sort((left, right) => getRectArea(left.rect!) - getRectArea(right.rect!))[0] ?? null;
  }

  const overlappingGroups = groupsWithRect
    .map((group) => ({ group, overlapArea: group.rect ? getRectOverlapArea(group.rect, entry.rect) : 0 }))
    .filter((candidate) => candidate.overlapArea > 0)
    .sort((left, right) => right.overlapArea - left.overlapArea);

  return overlappingGroups[0]?.group ?? null;
}

function buildGroupRowAssignments(entries: DesignerLayoutEntry[]) {
  const deduplicatedEntries = [...entries]
    .sort((left, right) => (
      left.rect.top - right.rect.top
      || left.rect.left - right.rect.left
      || left.orderId - right.orderId
    ))
    .filter((entry, index, sortedEntries) => (
      sortedEntries.findIndex((candidate) => candidate.columnId === entry.columnId) === index
    ));

  const rows: DesignerLayoutEntry[][] = [];
  let currentRowBaselineTop: number | null = null;
  let currentRowBaselineHeight: number | null = null;

  deduplicatedEntries.forEach((entry) => {
    if (rows.length === 0 || currentRowBaselineTop == null || currentRowBaselineHeight == null) {
      rows.push([entry]);
      currentRowBaselineTop = entry.rect.top;
      currentRowBaselineHeight = entry.rect.height;
      return;
    }

    const rowTolerance = Math.max(12, Math.min(currentRowBaselineHeight, entry.rect.height) * 0.5);
    if (Math.abs(entry.rect.top - currentRowBaselineTop) <= rowTolerance) {
      rows[rows.length - 1].push(entry);
      currentRowBaselineTop = Math.min(currentRowBaselineTop, entry.rect.top);
      currentRowBaselineHeight = Math.max(currentRowBaselineHeight, entry.rect.height);
      return;
    }

    rows.push([entry]);
    currentRowBaselineTop = entry.rect.top;
    currentRowBaselineHeight = entry.rect.height;
  });

  rows.forEach((rowEntries) => {
    rowEntries.sort((left, right) => (
      left.rect.left - right.rect.left
      || left.orderId - right.orderId
    ));
  });

  const columnHeights: Record<string, number> = {};
  const columnIds: string[] = [];
  const columnRows: Record<string, number> = {};
  const columnWidths: Record<string, number> = {};

  rows.forEach((rowEntries, rowIndex) => {
    rowEntries.forEach((entry) => {
      columnIds.push(entry.columnId);
      columnRows[entry.columnId] = rowIndex + 1;
      if (entry.width > 0) {
        columnWidths[entry.columnId] = entry.width;
      }
      if (entry.height > 0) {
        columnHeights[entry.columnId] = entry.height;
      }
    });
  });

  return {
    columnHeights,
    columnIds,
    columnRows,
    columnWidths,
    columnsPerRow: Math.max(1, ...rows.map((rowEntries) => rowEntries.length)),
    rows: rows.length,
  };
}

function extractFormKey(
  controlRows: SingleTableDesignerControlDto[],
  groupRows: SingleTableDesignerGroupDto[],
  layoutRows: SingleTableDesignerLayoutDto[],
) {
  const records = [...layoutRows, ...controlRows, ...groupRows];
  for (const record of records) {
    const formKey = stripBraces(toRecordText(getRecordFieldValue(record, 'formKey', 'formkey')));
    if (formKey) {
      return formKey;
    }
  }

  return '';
}

export function buildArchiveLayoutDesignerState(
  moduleCode: string,
  controlRows: SingleTableDesignerControlDto[],
  groupRows: SingleTableDesignerGroupDto[],
  layoutRows: SingleTableDesignerLayoutDto[],
  columns: Record<string, any>[],
) {
  const columnLookup = buildBaseColumnLookup(columns);
  const sortedControlRows = [...controlRows].sort(
    (left, right) => (
      toRecordNumber(getRecordFieldValue(left, 'orderid', 'orderId', 'tabOrder'), 0)
      - toRecordNumber(getRecordFieldValue(right, 'orderid', 'orderId', 'tabOrder'), 0)
    ),
  );
  const mappedControlColumns = sortedControlRows
    .map((row, index) => mapDesignerControlToColumn(row, index, columnLookup));
  const sortedLayoutRows = [...layoutRows].sort(
    (left, right) => (
      toRecordNumber(getRecordFieldValue(left, 'orderid', 'orderId', 'tabOrder', 'zindex', 'zIndex'), 0)
      - toRecordNumber(getRecordFieldValue(right, 'orderid', 'orderId', 'tabOrder', 'zindex', 'zIndex'), 0)
    ),
  );
  const mappedLayoutColumns = sortedLayoutRows
    .map((row, index) => mapDesignerLayoutRowToColumn(row, index, columnLookup));
  const mappedColumns = (mappedControlColumns.length > 0 ? mappedControlColumns : mappedLayoutColumns)
    .filter((column, index, candidateColumns) => (
      candidateColumns.findIndex((candidate) => String(candidate.id) === String(column.id)) === index
    ));
  const mappedColumnLookup = buildBaseColumnLookup(mappedColumns);
  const mappedGroups = groupRows.map((group, index) => mapDesignerGroup(group, index));
  const mappedControlEntries = sortedControlRows
    .map((row, index) => mapDesignerPositionRecordToEntry(row, index, mappedColumnLookup))
    .filter(Boolean) as DesignerLayoutEntry[];
  const mappedLayoutEntries = sortedLayoutRows
    .map((row, index) => mapDesignerPositionRecordToEntry(row, index, mappedColumnLookup))
    .filter(Boolean) as DesignerLayoutEntry[];
  const positionedEntries = [...mappedLayoutEntries, ...mappedControlEntries]
    .filter((entry, index, entries) => (
      entries.findIndex((candidate) => candidate.columnId === entry.columnId) === index
    ));

  const layoutByColumnId = new Map<string, SingleTableDesignerLayoutDto>();
  positionedEntries.forEach((entry) => {
    if (!layoutByColumnId.has(entry.columnId)) {
      layoutByColumnId.set(entry.columnId, entry.raw);
    }
  });

  const groupedEntries = new Map<string, DesignerLayoutEntry[]>();
  positionedEntries.forEach((entry) => {
    const targetGroup = chooseTargetGroup(entry, mappedGroups);
    if (!targetGroup) {
      return;
    }
    const existingEntries = groupedEntries.get(targetGroup.id) ?? [];
    existingEntries.push(entry);
    groupedEntries.set(targetGroup.id, existingEntries);
  });

  const normalizedGroups = mappedGroups.map((group) => {
    const layoutAssignment = buildGroupRowAssignments(groupedEntries.get(group.id) ?? []);
    const effectiveRows = clampGroupRows(
      Math.max(group.configuredRows, layoutAssignment.rows || 1),
    );

    return {
      columnHeights: layoutAssignment.columnHeights,
      columnIds: layoutAssignment.columnIds,
      columnRows: layoutAssignment.columnRows,
      columnWidths: layoutAssignment.columnWidths,
      columnsPerRow: Math.max(group.configuredColumnsPerRow, layoutAssignment.columnsPerRow || 1),
      description: group.description,
      id: group.id,
      layoutRect: group.rect,
      name: group.name,
      rows: effectiveRows,
    };
  });

  const controlRowByColumnId = new Map<string, SingleTableDesignerControlDto>();
  mappedControlColumns.forEach((column, index) => {
    controlRowByColumnId.set(String(column.id), sortedControlRows[index] ?? {});
  });

  const sourceControls = mappedColumns.map((column: Record<string, any>, index) => ({
    backendId: column.backendId ?? null,
    columnId: String(column.id || `designer_control_${index + 1}`),
    controlHeight: toRecordNumber(column.controlHeight ?? column.layoutHeight ?? column.height, 21),
    controlName: toRecordText(column.controlName),
    controlWidth: toRecordNumber(column.controlWidth ?? column.width, 120),
    defaultValue: toRecordText(column.defaultValue),
    fieldKey: toRecordText(column.fieldKey || column.backendFieldKey),
    fieldName: toRecordText(column.sourceField || column.fieldName),
    groupName: toRecordText(column.groupName),
    layoutRow: layoutByColumnId.get(String(column.id)) ?? null,
    name: toRecordText(column.name || column.label || column.username),
    orderId: toRecordNumber(column.orderId ?? column.orderid, index + 1),
    raw: controlRowByColumnId.get(String(column.id)) ?? layoutByColumnId.get(String(column.id)) ?? {},
  } satisfies ArchiveLayoutDesignerControlSource));

  const sourceState: ArchiveLayoutSourceState = {
    controls: sourceControls,
    formKey: extractFormKey(controlRows, groupRows, layoutRows),
    groups: mappedGroups,
    layoutRows: [...layoutRows],
    moduleCode,
  };

  return {
    detailBoardPatch: {
      archiveLayoutDirty: false,
      archiveLayoutSource: sourceState,
      enabled: true,
      groups: normalizedGroups,
      sortColumnId: mappedColumns[0]?.id ?? columns[0]?.id ?? null,
    },
    mappedColumns,
  };
}

function findMatchedCurrentColumn(control: ArchiveLayoutDesignerControlSource, columns: Record<string, any>[]) {
  const lookup = buildBaseColumnLookup(columns);
  return findMatchedColumn({
    backendId: control.backendId,
    controlName: control.controlName,
    displayName: control.name,
    fieldKey: control.fieldKey,
    fieldName: control.fieldName,
  }, lookup);
}

function resolvePersistedFieldId(control: ArchiveLayoutDesignerControlSource, matchedColumn: Record<string, any> | null) {
  const candidates = [
    matchedColumn?.backendId,
    matchedColumn?.id,
    control.backendId,
    getRecordFieldValue(control.raw, 'fieldid', 'fieldId', 'controlid', 'controlId'),
    getRecordFieldValue(control.layoutRow ?? {}, 'fieldid', 'fieldId'),
  ];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === '') {
      continue;
    }

    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }

    const text = String(candidate).trim();
    if (text.length > 0) {
      return text;
    }
  }

  return null;
}

function buildRowBucket(group: Record<string, any>, controlIds: string[]) {
  const rowMap = new Map<number, string[]>();
  const groupColumnRows = group?.columnRows ?? {};
  const configuredColumnsPerRow = Math.max(1, Number(group?.columnsPerRow) || 1);

  controlIds.forEach((columnId, index) => {
    const explicitRow = Number(groupColumnRows?.[columnId]);
    const rowNumber = Number.isFinite(explicitRow) && explicitRow > 0
      ? explicitRow
      : Math.floor(index / configuredColumnsPerRow) + 1;
    const currentRow = rowMap.get(rowNumber) ?? [];
    currentRow.push(columnId);
    rowMap.set(rowNumber, currentRow);
  });

  return [...rowMap.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([, rowControlIds]) => rowControlIds);
}

function getControlHeight(control: ArchiveLayoutDesignerControlSource, group: Record<string, any>) {
  const explicitHeight = Number(group?.columnHeights?.[control.columnId]);
  if (Number.isFinite(explicitHeight) && explicitHeight > 0) {
    return Math.round(explicitHeight);
  }
  return Math.max(21, Math.round(control.controlHeight || UNASSIGNED_HEIGHT));
}

function normalizeIdentityToken(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function getPersistedGroupId(group: ArchiveLayoutDesignerGroupSource | Record<string, any> | null | undefined) {
  if (!group || typeof group !== 'object') {
    return null;
  }

  const candidate = getRecordFieldValue(group as Record<string, unknown>, 'id', 'ID', 'Id', 'groupid', 'groupId');
  if (candidate === undefined || candidate === null || candidate === '') {
    return null;
  }

  const numeric = Number(candidate);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }

  const text = String(candidate).trim();
  return text.length > 0 ? text : null;
}

function getPersistedLayoutFieldId(layoutRow: SingleTableDesignerLayoutDto | null | undefined) {
  if (!layoutRow || typeof layoutRow !== 'object') {
    return null;
  }

  const candidate = getRecordFieldValue(layoutRow, 'fieldId', 'fieldid');
  if (candidate === undefined || candidate === null || candidate === '') {
    return null;
  }

  const numeric = Number(candidate);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }

  const text = String(candidate).trim();
  return text.length > 0 ? text : null;
}

function buildLayoutRect(left: number, top: number, width: number, height: number): LayoutRect {
  return {
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2,
    height,
    left,
    right: left + width,
    top,
    width,
  };
}

function buildArchiveLayoutGroupSnapshots(
  detailBoardConfig: Record<string, any>,
  source: ArchiveLayoutSourceState,
) {
  const currentGroups = Array.isArray(detailBoardConfig?.groups) ? detailBoardConfig.groups : [];
  const sourceGroupMap = new Map(source.groups.map((group) => [String(group.id), group]));
  const controlsById = new Map(source.controls.map((control) => [control.columnId, control]));
  const stageWidth = STAGE_WIDTH - STAGE_OFFSET_X * 2;
  let currentTop = STAGE_TOP_PADDING;

  return currentGroups.map((group: Record<string, any>, groupIndex: number) => {
    const sourceGroup = sourceGroupMap.get(String(group?.id)) ?? null;
    const groupControlIds = (Array.isArray(group?.columnIds) ? group.columnIds : [])
      .map(String)
      .filter((columnId: string) => controlsById.has(columnId));
    const rowBuckets = buildRowBucket(group, groupControlIds);

    let groupContentBottom = GROUP_HEADER_HEIGHT + GROUP_PADDING_TOP;
    rowBuckets.forEach((rowControlIds) => {
      const rowControls = rowControlIds
        .map((columnId) => controlsById.get(columnId))
        .filter(Boolean) as ArchiveLayoutDesignerControlSource[];
      const rowHeight = rowControls.length > 0
        ? Math.max(...rowControls.map((control) => getControlHeight(control, group)))
        : 0;

      groupContentBottom += rowHeight;
      if (rowHeight > 0) {
        groupContentBottom += DEFAULT_ROW_GAP;
      }
    });

    const groupHeight = Math.max(
      GROUP_MIN_HEIGHT,
      groupContentBottom > GROUP_HEADER_HEIGHT + GROUP_PADDING_TOP
        ? groupContentBottom - DEFAULT_ROW_GAP + GROUP_PADDING_BOTTOM
        : GROUP_HEADER_HEIGHT + GROUP_PADDING_TOP + GROUP_PADDING_BOTTOM,
    );
    const rect = buildLayoutRect(STAGE_OFFSET_X, currentTop, stageWidth, groupHeight);
    const persistedId = sourceGroup ? getPersistedGroupId(sourceGroup.raw) : null;
    const name = toRecordText(group?.name || sourceGroup?.name) || `Group ${groupIndex + 1}`;

    currentTop += groupHeight + GROUP_GAP;

    return {
      controlIds: groupControlIds,
      currentGroup: group,
      name,
      persistedId,
      rawGroup: sourceGroup?.raw ?? null,
      rect,
      sourceGroup,
    };
  });
}

function buildDesignerGroupSaveBody(input: {
  formKey: string;
  groupIndex: number;
  name: string;
  persistedId: number | string | null;
  rawGroup: SingleTableDesignerGroupDto | null;
  rect: LayoutRect;
}) {
  const rawGroup = input.rawGroup ?? {};
  const borderColor = toRecordText(getRecordFieldValue(rawGroup, 'borderColor', 'bordercolor'));
  const titlePosition = getRecordFieldValue(rawGroup, 'titlePosition', 'titleposition');
  const groupName = toRecordText(input.name) || `Group ${input.groupIndex + 1}`;

  return stripUndefinedEntries({
    ...(input.persistedId !== null ? { id: input.persistedId } : {}),
    formKey: input.formKey,
    formkey: input.formKey,
    groupName,
    groupname: groupName,
    GroupName: groupName,
    controlLeft: Math.round(input.rect.left),
    controlTop: Math.round(input.rect.top),
    controlHeight: Math.round(input.rect.height),
    controlWidth: Math.round(input.rect.width),
    controlType: DESIGNER_GROUP_CONTROL_TYPE,
    borderColor: borderColor || undefined,
    titlePosition: titlePosition ?? undefined,
  });
}

function hasDesignerGroupBodyChanged(body: Record<string, unknown>, rawGroup: SingleTableDesignerGroupDto | null) {
  if (!rawGroup || typeof rawGroup !== 'object') {
    return true;
  }

  const bodyGroupName = toRecordText(body.groupName ?? body.groupname ?? body.GroupName);
  const rawGroupName = toRecordText(getRecordFieldValue(rawGroup, 'groupName', 'groupname', 'GroupName', 'name', 'caption', 'title'));
  if (bodyGroupName !== rawGroupName) {
    return true;
  }

  const numericKeys: Array<[bodyKey: string, rawKeys: string[]]> = [
    ['controlLeft', ['controlLeft', 'left', 'Left', 'groupLeft', 'GroupLeft']],
    ['controlTop', ['controlTop', 'top', 'Top', 'groupTop', 'GroupTop']],
    ['controlHeight', ['controlHeight', 'height', 'Height', 'groupHeight', 'GroupHeight']],
    ['controlWidth', ['controlWidth', 'width', 'Width', 'groupWidth', 'GroupWidth']],
    ['controlType', ['controlType', 'controltype']],
  ];

  for (const [bodyKey, rawKeys] of numericKeys) {
    const bodyValue = toRecordNumber(body[bodyKey], Number.NaN);
    const rawValue = toRecordNumber(getRecordFieldValue(rawGroup, ...rawKeys), Number.NaN);
    if (Number.isFinite(bodyValue) || Number.isFinite(rawValue)) {
      if (Math.round(bodyValue) !== Math.round(rawValue)) {
        return true;
      }
    }
  }

  const bodyBorderColor = toRecordText(body.borderColor);
  const rawBorderColor = toRecordText(getRecordFieldValue(rawGroup, 'borderColor', 'bordercolor'));
  if (bodyBorderColor !== rawBorderColor) {
    return true;
  }

  const bodyTitlePosition = toRecordText(body.titlePosition);
  const rawTitlePosition = toRecordText(getRecordFieldValue(rawGroup, 'titlePosition', 'titleposition'));
  return bodyTitlePosition !== rawTitlePosition;
}

function buildDesignerLayoutRowBody(input: {
  control: ArchiveLayoutDesignerControlSource;
  fieldId: number | string;
  fieldName: string;
  formKey: string;
  groupName?: string;
  height: number;
  left: number;
  orderId: number;
  top: number;
  width: number;
}) {
  const rawLayout = input.control.layoutRow ?? {};
  const preservedColumnId = getRecordFieldValue(
    rawLayout,
    'Column_Id',
    'columnId',
    'Columns_Id',
    'columns_id',
    'columns_id1',
    'ColumnID',
  ) ?? getRecordFieldValue(
    input.control.raw,
    'Column_Id',
    'columnId',
    'Columns_Id',
    'columns_id',
    'columns_id1',
    'ColumnID',
  );
  const preservedTabOrder = toRecordNumber(
    getRecordFieldValue(rawLayout, 'tabOrder', 'taborder', 'orderid', 'orderId'),
    input.orderId,
  );
  const layoutId = getRecordFieldValue(rawLayout, 'id', 'ID', 'Id');
  const groupName = toRecordText(input.groupName);

  return stripUndefinedEntries({
    ...(layoutId !== undefined && layoutId !== null && layoutId !== '' ? { id: layoutId } : {}),
    formKey: input.formKey,
    fieldId: input.fieldId,
    fieldid: input.fieldId,
    fieldName: input.fieldName,
    fieldname: input.fieldName,
    controlName: input.control.controlName,
    controlname: input.control.controlName,
    controlLeft: input.left,
    controlTop: input.top,
    controlWidth: input.width,
    controlHeight: input.height,
    orderId: input.orderId,
    orderid: input.orderId,
    tabOrder: preservedTabOrder,
    defaultValue: input.control.defaultValue,
    Column_Id: preservedColumnId,
    columnId: preservedColumnId,
    groupName,
    groupname: groupName || undefined,
  });
}

export function buildArchiveLayoutSaveBodies(
  detailBoardConfig: Record<string, any>,
  currentColumns: Record<string, any>[],
  fallbackFormKey?: string,
) {
  const source = detailBoardConfig?.archiveLayoutSource as ArchiveLayoutSourceState | undefined;
  if (!source || !Array.isArray(source.controls) || source.controls.length === 0) {
    return [];
  }

  const formKey = stripBraces(source.formKey || fallbackFormKey || '');
  if (!formKey) {
    return [];
  }

  const groupSnapshots = buildArchiveLayoutGroupSnapshots(detailBoardConfig, source);
  const controlsById = new Map(source.controls.map((control) => [control.columnId, control]));
  const assignedControlIdSet = new Set<string>();
  const saveBodies: Record<string, unknown>[] = [];
  let nextOrderId = 1;

  groupSnapshots.forEach((groupSnapshot) => {
    const { currentGroup, name, rect, sourceGroup } = groupSnapshot;
    const groupControlIds = groupSnapshot.controlIds;
    if (groupControlIds.length === 0) {
      return;
    }

    groupControlIds.forEach((columnId: string) => assignedControlIdSet.add(columnId));
    const rowBuckets = buildRowBucket(currentGroup, groupControlIds);
    const columnsPerRow = Math.max(1, Number(currentGroup?.columnsPerRow) || sourceGroup?.configuredColumnsPerRow || 1);
    const safeSlotWidth = Math.max(
      24,
      Math.floor((rect.width - GROUP_PADDING_X * 2 - FIELD_GAP * Math.max(columnsPerRow - 1, 0)) / columnsPerRow),
    );
    let currentTop = rect.top + GROUP_HEADER_HEIGHT + GROUP_PADDING_TOP;

    rowBuckets.forEach((rowControlIds) => {
      const rowControls = rowControlIds
        .map((columnId) => controlsById.get(columnId))
        .filter(Boolean) as ArchiveLayoutDesignerControlSource[];
      const rowHeight = Math.max(...rowControls.map((control) => getControlHeight(control, currentGroup)));

      rowControls.forEach((control, slotIndex) => {
        const matchedColumn = findMatchedCurrentColumn(control, currentColumns);
        const fieldId = resolvePersistedFieldId(control, matchedColumn);
        if (fieldId == null) {
          return;
        }

        const fieldName = toRecordText(
          matchedColumn?.sourceField
          || matchedColumn?.fieldName
          || control.fieldName
          || control.controlName,
        );
        if (!fieldName) {
          return;
        }

        saveBodies.push(buildDesignerLayoutRowBody({
          control,
          fieldId,
          fieldName,
          formKey,
          groupName: name,
          height: getControlHeight(control, currentGroup),
          left: rect.left + GROUP_PADDING_X + slotIndex * (safeSlotWidth + FIELD_GAP),
          orderId: nextOrderId,
          top: currentTop,
          width: safeSlotWidth,
        }));
        nextOrderId += 1;
      });

      currentTop += rowHeight + DEFAULT_ROW_GAP;
    });
  });

  const maxGroupBottom = Math.max(0, ...groupSnapshots.map((group) => group.rect.bottom));
  const unassignedControls = source.controls.filter((control) => !assignedControlIdSet.has(control.columnId));

  unassignedControls.forEach((control, index) => {
    const matchedColumn = findMatchedCurrentColumn(control, currentColumns);
    const fieldId = resolvePersistedFieldId(control, matchedColumn);
    if (fieldId == null) {
      return;
    }

    const fieldName = toRecordText(
      matchedColumn?.sourceField
      || matchedColumn?.fieldName
      || control.fieldName
      || control.controlName,
    );
    if (!fieldName) {
      return;
    }

    saveBodies.push(buildDesignerLayoutRowBody({
      control,
      fieldId,
      fieldName,
      formKey,
      height: Math.max(UNASSIGNED_HEIGHT, control.controlHeight || UNASSIGNED_HEIGHT),
      left: UNASSIGNED_LEFT,
      orderId: nextOrderId,
      top: maxGroupBottom + UNASSIGNED_TOP_GAP + index * (UNASSIGNED_HEIGHT + UNASSIGNED_ROW_GAP),
      width: Math.max(UNASSIGNED_WIDTH, control.controlWidth || UNASSIGNED_WIDTH),
    }));
    nextOrderId += 1;
  });

  return saveBodies;
}

export function buildArchiveLayoutSavePlan(
  detailBoardConfig: Record<string, any>,
  currentColumns: Record<string, any>[],
  fallbackFormKey?: string,
): ArchiveLayoutSavePlan {
  const source = detailBoardConfig?.archiveLayoutSource as ArchiveLayoutSourceState | undefined;
  const formKey = stripBraces(source?.formKey || fallbackFormKey || '');
  if (!source || !formKey) {
    return {
      formKey,
      groupDeleteIds: [],
      groupSaveBodies: [],
      layoutDeleteFieldIds: [],
      layoutSaveBodies: [],
    };
  }

  const groupSnapshots = buildArchiveLayoutGroupSnapshots(detailBoardConfig, source);
  const layoutSaveBodies = buildArchiveLayoutSaveBodies(detailBoardConfig, currentColumns, formKey);
  const currentGroupIdSet = new Set(
    (Array.isArray(detailBoardConfig?.groups) ? detailBoardConfig.groups : [])
      .map((group: Record<string, any>) => String(group?.id || ''))
      .filter(Boolean),
  );
  const existingLayoutFieldIds = Array.from(new Set(
    (Array.isArray(source.layoutRows) ? source.layoutRows : [])
      .map((layoutRow) => getPersistedLayoutFieldId(layoutRow))
      .filter((fieldId): fieldId is number | string => fieldId !== null),
  ));
  const nextLayoutFieldIdSet = new Set(
    layoutSaveBodies.map((body) => normalizeIdentityToken(body.fieldId ?? body.fieldid)),
  );

  const layoutDeleteFieldIds = existingLayoutFieldIds.filter((fieldId) => (
    !nextLayoutFieldIdSet.has(normalizeIdentityToken(fieldId))
  ));
  const groupDeleteIds = source.groups
    .filter((group) => !currentGroupIdSet.has(String(group.id)))
    .map((group) => getPersistedGroupId(group.raw))
    .filter((groupId): groupId is number | string => groupId !== null);
  const groupSaveBodies = groupSnapshots
    .map((groupSnapshot, groupIndex) => ({
      body: buildDesignerGroupSaveBody({
        formKey,
        groupIndex,
        name: groupSnapshot.name,
        persistedId: groupSnapshot.persistedId,
        rawGroup: groupSnapshot.rawGroup,
        rect: groupSnapshot.rect,
      }),
      groupSnapshot,
    }))
    .filter(({ body, groupSnapshot }) => (
      groupSnapshot.persistedId === null
      || hasDesignerGroupBodyChanged(body, groupSnapshot.rawGroup)
    ))
    .map(({ body }) => body);

  return {
    formKey,
    groupDeleteIds: Array.from(new Set(groupDeleteIds)),
    groupSaveBodies,
    layoutDeleteFieldIds,
    layoutSaveBodies,
  };
}
