import type { FieldSqlTagOptionDto } from '../../../lib/backend-system';

export function getDashboardErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return '菜单加载失败，请稍后重试。';
}

export function normalizeMenuTitle(value?: string) {
  return value?.trim() || '';
}

export function normalizeMenuCode(value?: string) {
  return value?.trim() || '';
}

export function normalizeModuleType(value?: string) {
  return value?.trim().toLowerCase() || '';
}

export function getRecordFieldValue(record: Record<string, unknown> | null | undefined, ...keys: string[]) {
  if (!record) {
    return undefined;
  }

  const directLookup = record as Record<string, unknown>;
  const normalizedEntries = Object.entries(directLookup).map(([key, value]) => [key.toLowerCase(), value] as const);
  const normalizedLookup = new Map(normalizedEntries);

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(directLookup, key)) {
      return directLookup[key];
    }

    const matchedValue = normalizedLookup.get(key.toLowerCase());
    if (matchedValue !== undefined) {
      return matchedValue;
    }
  }

  return undefined;
}

export function toRecordText(value: unknown) {
  return value == null ? '' : String(value).trim();
}

export function stripBraces(value: string) {
  return value.replace(/[{}]/g, '').trim();
}

export function toRecordNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

export function toRecordBoolean(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    if (!normalizedValue) {
      return fallback;
    }

    if (['1', 'true', 'yes', 'y', 'on'].includes(normalizedValue)) {
      return true;
    }

    if (['0', 'false', 'no', 'n', 'off'].includes(normalizedValue)) {
      return false;
    }
  }

  return fallback;
}

export function toDetailGridFieldVisible(value: unknown, fallback: boolean) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return !toRecordBoolean(value, false);
}

export function normalizeFieldSqlTagId(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        return Math.round(parsed);
      }
    }
  }

  return fallback;
}

export const FIELD_TYPE_OPTIONS = ['文本', '数字', '下拉框', '搜索框', '日期框', '单选框', '多选框', '树形节点关联'];
export const FIELD_SQL_TAG_TREE_RELATION_ID = 3;
const FIELD_SQL_TAG_DATE_IDS = new Set([4, 44, 444, 4444, 44444]);
const FIELD_SQL_TAG_SELECT_IDS = new Set([1, 2, 23, 35, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127]);
const FIELD_SQL_TAG_SEARCH_IDS = new Set([5, 6, 15, 16, 38, 39, 40, 41, 42, 43, 102, 103, 109, 110, 111, 112, 113, 114, 116, 117, 160, 161]);
const FIELD_SQL_TAG_MULTI_IDS = new Set([13, 14, 17, 18, 19, 33, 34, 104, 105, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139]);
const FIELD_SQL_TAG_RADIO_IDS = new Set([106, 107]);
const FIELD_SQL_TAG_NUMBER_IDS = new Set([7, 27, 96, 108, 115]);

export const FIELD_TYPE_DEFAULT_SQL_TAG_IDS: Record<string, number> = {
  文本: 0,
  数字: 7,
  下拉框: 1,
  搜索框: 5,
  日期框: 4,
  单选框: 106,
  多选框: 17,
  树形节点关联: FIELD_SQL_TAG_TREE_RELATION_ID,
};

export const FIELD_SQL_TAG_LABEL_FALLBACKS: Record<number, string> = {
  0: '字符串',
  1: '下拉框返回ID',
  2: '下拉框返回名称',
  3: '树型结点关联',
  4: '日期类型框',
  5: '搜索框返回ID',
  6: '搜索框返回名称',
  7: '数值',
  15: '搜索框返回ID-带参数',
  16: '搜索框返回名称-带参数',
  17: '复选框',
  18: '下拉多选返回代码',
  19: '下拉多选返回名称',
  23: '下拉框返回名称-带参数',
  35: '下拉框返回ID-带参数',
  38: '智能搜索返回ID',
  39: '智能搜索返回名称',
  40: '智能搜索返回ID-带参数',
  41: '智能搜索返回名称-带参数',
  42: '弹出模块单选返回ID',
  43: '弹出模块多选返回ID',
  44: '日期时间类型框(时分秒)',
  106: '单选按钮返回ID',
  107: '单选按钮返回名称',
  118: '树型下拉返回ID',
  119: '树型下拉返回名称',
};

export const DEFAULT_FIELD_SQL_TAG_OPTIONS: FieldSqlTagOptionDto[] = [
  { showid: 0, showname: '字符串' },
  { showid: 7, showname: '数值' },
  { showid: 1, showname: '下拉框返回ID' },
  { showid: 5, showname: '搜索框返回ID' },
  { showid: 4, showname: '日期类型框' },
  { showid: 106, showname: '单选按钮返回ID' },
  { showid: 17, showname: '复选框' },
  { showid: FIELD_SQL_TAG_TREE_RELATION_ID, showname: '树型结点关联' },
];

export const COLUMN_ALIGN_OPTIONS = ['左对齐', '居中', '右对齐'];
export const TABLE_TYPE_OPTIONS = ['普通表格', '多表头', '树表格'];
export const GRID_COLOR_RULE_OPERATOR_OPTIONS = ['等于', '包含', '大于', '小于', '大于等于', '小于等于'];
export const BILL_SOURCE_CONFIG_TYPE_OPTIONS = ['普通来源', '弹窗来源', '明细来源'];
export const BILL_SOURCE_TYPE_OPTIONS = ['SQL', '视图', '接口'];

export function getFieldSqlTagOptionLabel(option: FieldSqlTagOptionDto | null | undefined) {
  const optionId = normalizeFieldSqlTagId(option?.showid, -1);
  const rawLabel = toRecordText(option?.showname);

  return rawLabel || FIELD_SQL_TAG_LABEL_FALLBACKS[optionId] || `类型 ${optionId}`;
}

export function mapFieldSqlTagToFieldType(fieldSqlTagValue: unknown, fieldSqlTagLabel = '', fallbackType = '文本') {
  const fieldSqlTagId = normalizeFieldSqlTagId(fieldSqlTagValue, -1);
  const normalizedLabel = fieldSqlTagLabel.replace(/\s+/g, '').toLowerCase();

  if (
    fieldSqlTagId === FIELD_SQL_TAG_TREE_RELATION_ID
    || normalizedLabel.includes('树型结点关联')
    || normalizedLabel.includes('树形节点关联')
  ) {
    return '树形节点关联';
  }

  if (FIELD_SQL_TAG_DATE_IDS.has(fieldSqlTagId) || /(日期|时间|date|time)/i.test(fieldSqlTagLabel)) {
    return '日期框';
  }

  if (FIELD_SQL_TAG_RADIO_IDS.has(fieldSqlTagId) || /单选/.test(fieldSqlTagLabel)) {
    return '单选框';
  }

  if (FIELD_SQL_TAG_MULTI_IDS.has(fieldSqlTagId) || /(多选|复选)/.test(fieldSqlTagLabel)) {
    return '多选框';
  }

  if (FIELD_SQL_TAG_SEARCH_IDS.has(fieldSqlTagId) || /(搜索|lookup)/i.test(fieldSqlTagLabel)) {
    return '搜索框';
  }

  if (FIELD_SQL_TAG_SELECT_IDS.has(fieldSqlTagId) || /下拉/.test(fieldSqlTagLabel)) {
    return '下拉框';
  }

  if (FIELD_SQL_TAG_NUMBER_IDS.has(fieldSqlTagId) || /(数值|金额|进度|price|amount|qty|number)/i.test(fieldSqlTagLabel)) {
    return '数字';
  }

  return FIELD_TYPE_OPTIONS.includes(fallbackType) ? fallbackType : '文本';
}

export function resolveColumnFieldType(column: Record<string, unknown> | null | undefined) {
  const rawType = toRecordText(getRecordFieldValue(column, 'type'));
  const fieldSqlTagLabel = toRecordText(getRecordFieldValue(column, 'fieldsqltagname', 'fieldSqlTagName'));
  const fieldSqlTagValue = getRecordFieldValue(column, 'fieldsqltag', 'fieldSqlTag');

  return mapFieldSqlTagToFieldType(fieldSqlTagValue, fieldSqlTagLabel, rawType);
}

export function resolveColumnFieldSqlTagId(column: Record<string, unknown> | null | undefined) {
  const rawFieldSqlTag = getRecordFieldValue(column, 'fieldsqltag', 'fieldSqlTag', 'controltype', 'controlType');
  if (rawFieldSqlTag !== undefined && rawFieldSqlTag !== null && String(rawFieldSqlTag).trim() !== '') {
    return normalizeFieldSqlTagId(rawFieldSqlTag, 0);
  }

  const fallbackType = toRecordText(getRecordFieldValue(column, 'type'));
  return FIELD_TYPE_DEFAULT_SQL_TAG_IDS[fallbackType] ?? 0;
}

export function isTreeRelationFieldColumn(column: Record<string, unknown> | null | undefined) {
  if (!column) {
    return false;
  }

  return mapFieldSqlTagToFieldType(
    getRecordFieldValue(column, 'fieldsqltag', 'fieldSqlTag'),
    toRecordText(getRecordFieldValue(column, 'fieldsqltagname', 'fieldSqlTagName')),
    toRecordText(getRecordFieldValue(column, 'type')),
  ) === '树形节点关联';
}
