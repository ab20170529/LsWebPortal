import type { SingleTableConditionDto, SingleTableGridFieldDto } from '../../../lib/backend-module-config';
import { BILL_FORM_DEFAULT_WIDTH, getBillFieldLayout } from './dashboard-bill-form-layout-utils';
import {
  CONDITION_PANEL_CONTROL_WIDTH,
  CONDITION_PANEL_MAX_ROWS,
  CONDITION_PANEL_MIN_ROWS,
  CONDITION_PANEL_RESIZE_MAX_WIDTH,
  CONDITION_PANEL_RESIZE_MIN_WIDTH,
} from './dashboard-condition-workbench-utils';
import {
  FIELD_SQL_TAG_LABEL_FALLBACKS,
  FIELD_TYPE_DEFAULT_SQL_TAG_IDS,
  FIELD_TYPE_OPTIONS,
  getRecordFieldValue,
  mapFieldSqlTagToFieldType,
  resolveColumnFieldSqlTagId,
  resolveColumnFieldType,
  toRecordBoolean,
  toRecordNumber,
  toRecordText,
} from './dashboard-field-type-utils';

export function buildDashboardColumn(prefix: string, index: number, overrides: Record<string, any> = {}) {
  return {
    id: `${prefix}_${Date.now()}_${index}`,
    name: `字段 ${index}`,
    type: '文本',
    fieldSqlTag: FIELD_TYPE_DEFAULT_SQL_TAG_IDS['文本'],
    fieldSqlTagName: FIELD_SQL_TAG_LABEL_FALLBACKS[FIELD_TYPE_DEFAULT_SQL_TAG_IDS['文本']],
    width: 104,
    ...getBillFieldLayout(index - 1, BILL_FORM_DEFAULT_WIDTH),
    required: false,
    visible: true,
    searchable: false,
    readonly: false,
    align: '左对齐',
    placeholder: '',
    defaultValue: '',
    dictCode: '',
    formula: '',
    relationSql: '',
    dynamicSql: '',
    helpText: '',
    ...overrides,
  };
}

export function buildDashboardConditionField(index: number, overrides: Record<string, any> = {}) {
  return {
    id: `cond_${Date.now()}_${index}`,
    name: `条件 ${index}`,
    type: '文本',
    width: CONDITION_PANEL_CONTROL_WIDTH,
    panelRow: 1,
    required: false,
    visible: true,
    searchable: true,
    readonly: false,
    align: '左对齐',
    placeholder: '',
    defaultValue: '',
    dictCode: '',
    formula: '',
    relationSql: '',
    dynamicSql: '',
    helpText: '',
    ...overrides,
  };
}

export function parseSqlFieldNames(sql: string) {
  const match = sql.match(/select\s+([\s\S]+?)\s+from/i);
  if (!match) {
    return [];
  }

  return Array.from(new Set(
    match[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const aliasMatch = item.match(/\bas\s+([[\]`"A-Za-z0-9_]+)/i);
        const rawName = aliasMatch?.[1] ?? item.split(/\s+/).pop() ?? item;
        return rawName
          .replace(/[[\]`"]/g, '')
          .split('.')
          .pop()
          ?.trim() ?? '';
      })
      .filter(Boolean),
  ));
}

export function normalizeDashboardColumn(column: any) {
  return {
    ...getBillFieldLayout(0, BILL_FORM_DEFAULT_WIDTH),
    required: false,
    visible: true,
    searchable: false,
    readonly: false,
    align: '左对齐',
    placeholder: '',
    defaultValue: '',
    dictCode: '',
    formula: '',
    relationSql: '',
    dynamicSql: '',
    helpText: '',
    ...column,
    type: resolveColumnFieldType(column),
    fieldSqlTag: resolveColumnFieldSqlTagId(column),
    fieldSqlTagName: toRecordText(getRecordFieldValue(column, 'fieldsqltagname', 'fieldSqlTagName')),
  };
}

export function buildTreeRelationFallbackColumns(fields: string[], currentColumns: any[] = []) {
  return fields.map((fieldName, index) => {
    const existing = currentColumns.find((item) => item.sourceField === fieldName);
    if (existing) {
      return { ...existing, sourceField: fieldName };
    }

    return buildDashboardColumn('tree_col', index + 1, {
      name: fieldName,
      sourceField: fieldName,
      width: index === 1 ? 176 : 148,
    });
  });
}

export function normalizeDashboardConditionField(field: any) {
  return {
    required: false,
    visible: true,
    searchable: true,
    readonly: false,
    align: '左对齐',
    placeholder: '',
    defaultValue: '',
    dictCode: '',
    formula: '',
    relationSql: '',
    dynamicSql: '',
    helpText: '',
    ...field,
    width: Math.min(
      CONDITION_PANEL_RESIZE_MAX_WIDTH,
      Math.max(
        CONDITION_PANEL_RESIZE_MIN_WIDTH,
        Number.isFinite(Number(field?.width)) ? Number(field.width) : CONDITION_PANEL_CONTROL_WIDTH,
      ),
    ),
    panelRow: Math.min(
      CONDITION_PANEL_MAX_ROWS,
      Math.max(
        CONDITION_PANEL_MIN_ROWS,
        Number.isFinite(Number(field?.panelRow)) ? Number(field.panelRow) : CONDITION_PANEL_MIN_ROWS,
      ),
    ),
  };
}

export function resolveSingleTableConditionType(condition: Record<string, unknown>) {
  const directType = toRecordText(
    getRecordFieldValue(condition, 'type', 'controltypename', 'controlTypeName', 'fieldtypename', 'fieldTypeName'),
  );

  if (FIELD_TYPE_OPTIONS.includes(directType)) {
    return directType;
  }

  const controlTypeLabel = toRecordText(
    getRecordFieldValue(condition, 'fieldsqltagname', 'fieldSqlTagName', 'showname', 'showName'),
  );
  const controlTypeValue = getRecordFieldValue(condition, 'controltype', 'controlType', 'fieldsqltag', 'fieldSqlTag');
  const mappedByControlType = mapFieldSqlTagToFieldType(controlTypeValue, controlTypeLabel, directType || '文本');
  if (FIELD_TYPE_OPTIONS.includes(mappedByControlType)) {
    return mappedByControlType;
  }

  if (/(日期|时间|date|time)/i.test(directType)) {
    return '日期框';
  }

  if (/下拉|select/i.test(directType)) {
    return '下拉框';
  }

  if (/搜索|lookup|search/i.test(directType)) {
    return '搜索框';
  }

  const labelText = toRecordText(getRecordFieldValue(condition, 'controllabel', 'controlLabel', 'controlname', 'controlName'));
  if (/(日期|时间|date|time)/i.test(labelText)) {
    return '日期框';
  }

  return '文本';
}

export function mapSingleTableGridFieldRecordToColumn(
  field: SingleTableGridFieldDto,
  index: number,
  existingColumn?: any,
) {
  const normalizedExisting = existingColumn ? normalizeDashboardColumn(existingColumn) : null;
  const backendId = getRecordFieldValue(field, 'id');
  const ownerFieldId = getRecordFieldValue(field, 'fieldid', 'fieldId');
  const fieldKey = toRecordText(getRecordFieldValue(field, 'fieldkey', 'fieldKey'));
  const fieldName = toRecordText(getRecordFieldValue(field, 'fieldname', 'fieldName'));
  const displayName = toRecordText(getRecordFieldValue(field, 'displayname', 'displayName', 'username'));
  const orderId = toRecordNumber(getRecordFieldValue(field, 'orderid', 'orderId'), index + 1);
  const width = toRecordNumber(
    getRecordFieldValue(field, 'width', 'mobilewidth', 'mobileWidth'),
    normalizedExisting?.width ?? (index === 1 ? 176 : 148),
  );

  return buildDashboardColumn('tree_col', index + 1, {
    ...(normalizedExisting ?? {}),
    ...field,
    id: backendId == null ? (normalizedExisting?.id ?? `tree_grid_${Date.now()}_${index + 1}`) : `tree_grid_${backendId}`,
    backendId,
    ownerFieldId,
    orderId,
    backendFieldKey: fieldKey || normalizedExisting?.backendFieldKey || '',
    name: displayName || fieldName || normalizedExisting?.name || `左侧列 ${index + 1}`,
    sourceField: fieldName || fieldKey || normalizedExisting?.sourceField || `tree_field_${index + 1}`,
    type: normalizedExisting?.type || '文本',
    width,
    mobileWidth: toRecordNumber(getRecordFieldValue(field, 'mobilewidth', 'mobileWidth'), width),
    visible: toRecordBoolean(getRecordFieldValue(field, 'isvisible', 'isVisible'), normalizedExisting?.visible ?? true),
    showMobile: toRecordBoolean(getRecordFieldValue(field, 'showmobile', 'showMobile'), normalizedExisting?.showMobile ?? false),
    isCodeField: toRecordBoolean(getRecordFieldValue(field, 'iscodefield', 'isCodeField'), normalizedExisting?.isCodeField ?? false),
  });
}

export function mapSingleTableConditionRecordToField(
  condition: SingleTableConditionDto,
  index: number,
  overrides: Record<string, unknown> = {},
) {
  const backendId = getRecordFieldValue(condition, 'id');
  const controlName = toRecordText(getRecordFieldValue(condition, 'controlname', 'controlName'));
  const controlLabel = toRecordText(getRecordFieldValue(condition, 'controllabel', 'controlLabel'));
  const displayName = controlLabel || controlName || `条件 ${index + 1}`;
  const controlType = resolveSingleTableConditionType(condition);
  const placeholder = controlType === '日期框' || controlType === '下拉框' || controlType === '搜索框' || controlType === '单选框' || controlType === '多选框'
    ? `请选择${displayName}`
    : `请输入${displayName}`;

  return normalizeDashboardConditionField({
    ...condition,
    id: backendId == null ? `cond_${Date.now()}_${index + 1}` : `cond_${backendId}`,
    backendId,
    orderId: toRecordNumber(getRecordFieldValue(condition, 'orderid', 'orderId'), index + 1),
    sourceid: getRecordFieldValue(condition, 'sourceid', 'sourceId'),
    formKey: toRecordText(getRecordFieldValue(condition, 'formkey', 'formKey')),
    name: displayName,
    sourceField: controlName || toRecordText(getRecordFieldValue(condition, 'keyfield', 'keyField')) || `condition_${index + 1}`,
    type: controlType,
    width: toRecordNumber(
      getRecordFieldValue(condition, 'controlwidth', 'controlWidth', 'width'),
      CONDITION_PANEL_CONTROL_WIDTH,
    ),
    defaultValue: toRecordText(getRecordFieldValue(condition, 'defaultvalue', 'defaultValue')),
    relationSql: toRecordText(getRecordFieldValue(condition, 'sourcesql', 'sourceSql')),
    formula: toRecordText(getRecordFieldValue(condition, 'resultfield', 'resultField')),
    dynamicSql: toRecordText(getRecordFieldValue(condition, 'checkcond', 'checkCondition')),
    dictCode: toRecordText(getRecordFieldValue(condition, 'keyfield', 'keyField')),
    placeholder,
    panelRow: CONDITION_PANEL_MIN_ROWS,
    ...overrides,
  });
}
