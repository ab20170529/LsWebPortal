import type {
  BillTypeDesignerLayoutDto,
  BillTypeMasterFieldDto,
  SingleTableGridFieldDto,
  SingleTableModuleFieldDto,
} from '../../../lib/backend-module-config';
import {
  FIELD_TYPE_OPTIONS,
  getRecordFieldValue,
  mapFieldSqlTagToFieldType,
  normalizeFieldSqlTagId,
  toDetailGridFieldVisible,
  toRecordBoolean,
  toRecordNumber,
  toRecordText,
} from './dashboard-field-type-utils';
import {
  alignBillHeaderFieldsToFlowLayout,
  BILL_FORM_DEFAULT_WIDTH,
  BILL_FORM_WORKBENCH_LAYOUT_GAP_X,
  BILL_FORM_WORKBENCH_LAYOUT_GAP_Y,
  BILL_FORM_WORKBENCH_LAYOUT_PADDING_X,
  BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y,
  BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT,
  getBillFieldLayout,
} from './dashboard-bill-form-layout-utils';

const BILL_DESIGNER_CONTROL_LEFT_KEYS = [
  'controlLeft',
  'left',
  'Left',
  'locationLeft',
  'locationX',
  'x',
  'X',
] as const;

const BILL_DESIGNER_CONTROL_TOP_KEYS = [
  'controlTop',
  'top',
  'Top',
  'locationTop',
  'locationY',
  'y',
  'Y',
] as const;

const BILL_DESIGNER_CONTROL_HEIGHT_KEYS = [
  'controlHeight',
  'height',
  'Height',
  'layoutHeight',
] as const;

function getBillHeaderLayoutLeftValue(record: Record<string, any>) {
  return toRecordNumber(
    record.layoutControlLeft ?? record.controlLeft ?? record.canvasX,
    0,
  );
}

function getBillHeaderLayoutTopValue(record: Record<string, any>) {
  return toRecordNumber(
    record.layoutControlTop ?? record.controlTop ?? record.canvasY,
    0,
  );
}

function getBillHeaderLayoutHeightValue(record: Record<string, any>) {
  return Math.max(
    21,
    toRecordNumber(
      record.layoutControlHeight ?? record.controlHeight ?? record.layoutHeight,
      21,
    ),
  );
}

function buildBillHeaderRowAssignments(columns: Array<Record<string, any>>) {
  let currentRow = 0;
  let currentRowBaselineTop: number | null = null;
  let currentRowBaselineHeight: number | null = null;
  const rowAssignments = new Map<string, { panelOrder: number; panelRow: number }>();
  const rowBuckets = new Map<number, Array<Record<string, any>>>();
  let currentRowColumns: Array<Record<string, any>> = [];

  const sortedColumns = columns
    .slice()
    .sort((left, right) => (
      getBillHeaderLayoutTopValue(left) - getBillHeaderLayoutTopValue(right)
      || getBillHeaderLayoutLeftValue(left) - getBillHeaderLayoutLeftValue(right)
      || toRecordNumber(left.orderId, 0) - toRecordNumber(right.orderId, 0)
    ));

  sortedColumns.forEach((column) => {
      const columnTop = getBillHeaderLayoutTopValue(column);
      const columnHeight = getBillHeaderLayoutHeightValue(column);

      if (currentRowBaselineTop == null || currentRowBaselineHeight == null) {
        currentRow = 1;
        currentRowBaselineTop = columnTop;
        currentRowBaselineHeight = columnHeight;
        currentRowColumns = [column];
        rowBuckets.set(currentRow, currentRowColumns);
        return;
      }

      const rowTolerance = Math.max(12, Math.min(currentRowBaselineHeight, columnHeight) * 0.5);
      if (Math.abs(columnTop - currentRowBaselineTop) <= rowTolerance) {
        currentRowBaselineTop = Math.min(currentRowBaselineTop, columnTop);
        currentRowBaselineHeight = Math.max(currentRowBaselineHeight, columnHeight);
        currentRowColumns.push(column);
        return;
      }

      currentRow += 1;
      currentRowBaselineTop = columnTop;
      currentRowBaselineHeight = columnHeight;
      currentRowColumns = [column];
      rowBuckets.set(currentRow, currentRowColumns);
  });

  Array.from(rowBuckets.entries())
    .sort((left, right) => left[0] - right[0])
    .forEach(([panelRow, rowColumns]) => {
      rowColumns
        .slice()
        .sort((left, right) => (
          getBillHeaderLayoutLeftValue(left) - getBillHeaderLayoutLeftValue(right)
          || getBillHeaderLayoutTopValue(left) - getBillHeaderLayoutTopValue(right)
          || toRecordNumber(left.orderId, 0) - toRecordNumber(right.orderId, 0)
        ))
        .forEach((column, index) => {
          rowAssignments.set(String(column.id), {
            panelOrder: index + 1,
            panelRow,
          });
        });
    });

  return rowAssignments;
}

function buildSingleTableFieldColumn(index: number, overrides: Record<string, unknown> = {}) {
  return {
    ...getBillFieldLayout(index, BILL_FORM_DEFAULT_WIDTH),
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

function resolveSingleTableFieldType(field: Record<string, unknown>) {
  const directType = toRecordText(
    getRecordFieldValue(field, 'type', 'fieldType', 'fieldtypename', 'fieldTypeName', 'controltypename', 'controlTypeName'),
  );

  if (FIELD_TYPE_OPTIONS.includes(directType)) {
    return directType;
  }

  const fieldSqlTagLabel = toRecordText(getRecordFieldValue(field, 'fieldsqltagname', 'fieldSqlTagName', 'showname', 'showName'));
  const fieldSqlTagValue = getRecordFieldValue(field, 'fieldsqltag', 'fieldSqlTag', 'controltype', 'controlType');
  const mappedByFieldSqlTag = mapFieldSqlTagToFieldType(fieldSqlTagValue, fieldSqlTagLabel, directType || '文本');
  if (FIELD_TYPE_OPTIONS.includes(mappedByFieldSqlTag)) {
    return mappedByFieldSqlTag;
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

  if (/radio/i.test(directType)) {
    return '单选框';
  }

  if (/checkbox|multi/i.test(directType)) {
    return '多选框';
  }

  const fieldName = toRecordText(getRecordFieldValue(field, 'username1', 'displayName', 'fieldname', 'fieldName'));
  const systemName = toRecordText(getRecordFieldValue(field, 'sysname', 'systemName'));
  const nameForGuess = `${fieldName} ${systemName}`;

  if (/(日期|时间|date|time)/i.test(nameForGuess)) {
    return '日期框';
  }

  if (/(数量|金额|单价|price|amount|qty|count|number)/i.test(nameForGuess)) {
    return '数字';
  }

  return '文本';
}

export function mapSingleTableFieldRecordToColumn(field: SingleTableModuleFieldDto, index: number) {
  const backendId = getRecordFieldValue(field, 'id');
  const displayName = toRecordText(getRecordFieldValue(field, 'username1', 'username', 'userName', 'displayName', 'displayname'));
  const fieldName = toRecordText(getRecordFieldValue(field, 'fieldname', 'fieldName', 'controlname', 'controlName', 'sqlfield', 'sqlField'));
  const systemName = toRecordText(getRecordFieldValue(field, 'sysname', 'systemName'));
  const fieldKey = toRecordText(getRecordFieldValue(field, 'fieldkey', 'fieldKey', 'backendFieldKey'));
  const placeholder = toRecordText(getRecordFieldValue(
    field,
    'InputHintText',
    'inputHintText',
    'inputhinttext',
    'placeholder',
    'prompttext',
    'promptText',
  ));
  const relationSql = toRecordText(getRecordFieldValue(field, 'relationsql', 'relationSql', 'sourceSql', 'sourcesql'));
  const dynamicSql = toRecordText(getRecordFieldValue(field, 'fieldsql', 'fieldSql', 'dynamicsql', 'dynamicSql', 'checkCond', 'checkcond'));
  const helpText = toRecordText(getRecordFieldValue(field, 'bak', 'helptext', 'helpText', 'remark', 'memo', 'description', 'desc'));
  const defaultValue = toRecordText(getRecordFieldValue(field, 'defaultdate', 'defaultDate', 'defaultvalue', 'defaultValue'));
  const fieldSqlTag = normalizeFieldSqlTagId(
    getRecordFieldValue(field, 'fieldsqltag', 'fieldSqlTag', 'controltype', 'controlType', 'fieldTypeId', 'fieldtypeid'),
    0,
  );
  const fieldSqlTagName = toRecordText(getRecordFieldValue(
    field,
    'fieldsqltagname',
    'fieldSqlTagName',
    'showname',
    'showName',
    'fieldTypeName',
    'fieldtypename',
    'controltypename',
    'controlTypeName',
  ));
  const alignValue = toRecordText(getRecordFieldValue(field, 'dataAlign', 'dataalign', 'align'));
  const hiddenValue = getRecordFieldValue(field, 'vislble', 'vislble');
  const visibleAliasValue = getRecordFieldValue(field, 'visible', 'isVisible', 'showmobile', 'showMobile');
  const requiredValue = getRecordFieldValue(field, 'tagid', 'required', 'isneed', 'isNeed', 'mustinput', 'mustInput');
  const readonlyValue = getRecordFieldValue(field, 'edit', 'readonly', 'readOnly', 'isreadonly', 'isReadOnly');
  const searchableValue = getRecordFieldValue(field, 'ifSearch', 'ifsearch', 'searchable', 'isquery', 'isQuery', 'queryable');

  return buildSingleTableFieldColumn(index, {
    ...field,
    id: backendId == null ? `field_${Date.now()}_${index + 1}` : `field_${backendId}`,
    backendId,
    orderId: toRecordNumber(getRecordFieldValue(field, 'orderid', 'orderId'), index + 1),
    backendFieldKey: fieldKey,
    formKey: toRecordText(getRecordFieldValue(field, 'formkey', 'formKey')),
    tab: toRecordText(getRecordFieldValue(field, 'tab')),
    fieldSqlTag,
    fieldSqlTagName,
    name: displayName || fieldName || systemName || fieldKey || `字段 ${index + 1}`,
    sourceField: fieldName,
    type: resolveSingleTableFieldType(field),
    width: toRecordNumber(
      getRecordFieldValue(field, 'width', 'controlwidth', 'controlWidth', 'mobilewidth', 'mobileWidth'),
      BILL_FORM_DEFAULT_WIDTH,
    ),
    required: toRecordBoolean(requiredValue, false),
    visible: hiddenValue == null ? toRecordBoolean(visibleAliasValue, true) : !toRecordBoolean(hiddenValue, false),
    searchable: toRecordBoolean(searchableValue, false),
    readonly: toRecordBoolean(readonlyValue, false),
    align: alignValue || '左对齐',
    placeholder,
    defaultValue,
    dictCode: toRecordText(getRecordFieldValue(field, 'fieldsqlid', 'fieldSqlId', 'dictcode', 'dictCode')),
    formula: toRecordText(getRecordFieldValue(field, 'calcExpr', 'calcexpr', 'formula')),
    relationSql,
    dynamicSql,
    helpText,
  });
}

export function mapSingleTableDetailGridFieldToColumn(field: SingleTableGridFieldDto, index: number) {
  const mappedColumn = mapSingleTableFieldRecordToColumn(field, index) as Record<string, any>;
  const rest = { ...mappedColumn };
  delete rest.id;
  const displayName = toRecordText(getRecordFieldValue(field, 'username', 'userName', 'displayName', 'displayname'));
  const fieldName = toRecordText(getRecordFieldValue(field, 'fieldName', 'fieldname'));
  const detailVisibleValue = getRecordFieldValue(field, 'isvisible', 'isVisible');
  const detailRequiredValue = getRecordFieldValue(field, 'nullable', 'isnullable', 'isNullable');
  const detailFieldTypeId = normalizeFieldSqlTagId(
    getRecordFieldValue(field, 'fieldTypeId', 'fieldtypeid'),
    normalizeFieldSqlTagId(getRecordFieldValue(mappedColumn, 'fieldsqltag', 'fieldSqlTag', 'controltype', 'controlType'), 0),
  );
  const detailFieldTypeName = toRecordText(getRecordFieldValue(
    field,
    'fieldTypeName',
    'fieldtypename',
    'fieldTypeLabel',
    'fieldtypelabel',
  )) || mappedColumn.fieldSqlTagName || mappedColumn.controlTypeName || '';

  return {
    ...rest,
    id: `d_col_${Date.now()}_${index + 1}`,
    backendId: getRecordFieldValue(field, 'id'),
    fieldSqlTag: detailFieldTypeId,
    fieldSqlTagName: detailFieldTypeName,
    fieldTypeId: detailFieldTypeId,
    controltype: detailFieldTypeId,
    controlType: detailFieldTypeId,
    controltypename: detailFieldTypeName,
    controlTypeName: detailFieldTypeName,
    orderId: toRecordNumber(getRecordFieldValue(field, 'orderid', 'orderId'), index + 1),
    name: displayName || mappedColumn.name || `明细字段 ${index + 1}`,
    required: detailRequiredValue == null ? mappedColumn.required : toRecordBoolean(detailRequiredValue, false),
    sourceField: fieldName,
    type: mapFieldSqlTagToFieldType(
      detailFieldTypeId,
      detailFieldTypeName,
      toRecordText(mappedColumn.type) || '文本',
    ),
    visible: toDetailGridFieldVisible(detailVisibleValue, mappedColumn.visible !== false),
  };
}

function normalizeBillDesignerFieldId(value: unknown, fallback: string) {
  const normalized = String(value ?? '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeBillFieldLookupKey(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function buildBillHeaderMasterFieldLookup(masterFieldRows: BillTypeMasterFieldDto[]) {
  const byBackendId = new Map<string, BillTypeMasterFieldDto>();
  const byFieldKey = new Map<string, BillTypeMasterFieldDto>();
  const byFieldName = new Map<string, BillTypeMasterFieldDto>();
  const byName = new Map<string, BillTypeMasterFieldDto>();

  masterFieldRows.forEach((field) => {
    const backendIdKey = normalizeBillFieldLookupKey(getRecordFieldValue(field, 'id', 'fieldid', 'fieldId', 'controlid', 'controlId'));
    const fieldKey = normalizeBillFieldLookupKey(getRecordFieldValue(field, 'fieldkey', 'fieldKey'));
    const fieldName = normalizeBillFieldLookupKey(getRecordFieldValue(field, 'fieldname', 'fieldName', 'controlname', 'controlName', 'sqlfield', 'sqlField'));
    const displayName = normalizeBillFieldLookupKey(getRecordFieldValue(field, 'username', 'userName', 'username1', 'displayName', 'name'));

    if (backendIdKey) {
      byBackendId.set(backendIdKey, field);
    }
    if (fieldKey) {
      byFieldKey.set(fieldKey, field);
    }
    if (fieldName) {
      byFieldName.set(fieldName, field);
    }
    if (displayName) {
      byName.set(displayName, field);
    }
  });

  return {
    byBackendId,
    byFieldKey,
    byFieldName,
    byName,
  };
}

function findMatchedBillHeaderMasterField(
  layoutRow: BillTypeDesignerLayoutDto,
  lookup: ReturnType<typeof buildBillHeaderMasterFieldLookup>,
) {
  const backendIdKey = normalizeBillFieldLookupKey(getRecordFieldValue(layoutRow, 'fieldid', 'fieldId', 'controlid', 'controlId', 'id'));
  const fieldKey = normalizeBillFieldLookupKey(getRecordFieldValue(layoutRow, 'fieldkey', 'fieldKey'));
  const fieldName = normalizeBillFieldLookupKey(getRecordFieldValue(layoutRow, 'fieldname', 'fieldName', 'controlname', 'controlName', 'sqlfield', 'sqlField'));
  const displayName = normalizeBillFieldLookupKey(getRecordFieldValue(layoutRow, 'username', 'userName', 'displayName', 'name', 'controlLabel', 'controllabel'));

  return lookup.byBackendId.get(backendIdKey)
    ?? lookup.byFieldKey.get(fieldKey)
    ?? lookup.byFieldName.get(fieldName)
    ?? lookup.byName.get(displayName)
    ?? null;
}

export function buildBillHeaderFieldsFromDesignerLayout(
  layoutRows: BillTypeDesignerLayoutDto[],
  masterFieldRows: BillTypeMasterFieldDto[] = [],
) {
  const masterFieldLookup = buildBillHeaderMasterFieldLookup(masterFieldRows);
  const mappedColumns = layoutRows.map((layoutRow, index) => {
    const matchedMasterField = findMatchedBillHeaderMasterField(layoutRow, masterFieldLookup);
    const fieldRecord = (matchedMasterField ?? layoutRow) as SingleTableModuleFieldDto;
    const mappedColumn = mapSingleTableFieldRecordToColumn(fieldRecord, index) as Record<string, any>;
    const resolvedFieldTypeId = normalizeFieldSqlTagId(
      getRecordFieldValue(
        matchedMasterField ?? layoutRow,
        'fieldTypeId',
        'fieldtypeid',
        'fieldTypeID',
      ),
      normalizeFieldSqlTagId(
        getRecordFieldValue(mappedColumn, 'fieldsqltag', 'fieldSqlTag', 'controltype', 'controlType'),
        0,
      ),
    );
    const resolvedFieldTypeName = toRecordText(
      getRecordFieldValue(
        matchedMasterField ?? layoutRow,
        'fieldTypeName',
        'fieldtypename',
        'fieldTypeLabel',
        'fieldtypelabel',
        'fieldsqltagname',
        'fieldSqlTagName',
        'controltypename',
        'controlTypeName',
      ),
    ) || mappedColumn.fieldSqlTagName || mappedColumn.controlTypeName || '';
    const nullableValue = getRecordFieldValue(matchedMasterField ?? {}, 'nullable', 'isnullable', 'isNullable');
    const visibleValue = getRecordFieldValue(matchedMasterField ?? {}, 'isvisible', 'isVisible', 'visible');
    const resolvedBackendId = getRecordFieldValue(
      layoutRow,
      'fieldid',
      'fieldId',
      'controlid',
      'controlId',
      'id',
    ) ?? getRecordFieldValue(matchedMasterField ?? {}, 'id', 'fieldid', 'fieldId');
    const resolvedFieldName = toRecordText(
      getRecordFieldValue(layoutRow, 'fieldname', 'fieldName', 'controlname', 'controlName', 'sqlfield', 'sqlField'),
    ) || toRecordText(
      getRecordFieldValue(matchedMasterField ?? {}, 'fieldname', 'fieldName', 'controlname', 'controlName', 'sqlfield', 'sqlField'),
    ) || mappedColumn.sourceField;
    const resolvedDisplayName = toRecordText(
      getRecordFieldValue(layoutRow, 'username', 'userName', 'displayName', 'name', 'caption', 'title', 'controlLabel', 'controllabel'),
    ) || toRecordText(
      getRecordFieldValue(matchedMasterField ?? {}, 'username', 'userName', 'username1', 'displayName', 'name', 'caption', 'title'),
    ) || mappedColumn.name;
    const resolvedWidth = toRecordNumber(
      getRecordFieldValue(layoutRow, 'controlWidth', 'width', 'mobilewidth', 'mobileWidth'),
      mappedColumn.width ?? BILL_FORM_DEFAULT_WIDTH,
    );
    const resolvedHeight = toRecordNumber(
      getRecordFieldValue(layoutRow, ...BILL_DESIGNER_CONTROL_HEIGHT_KEYS),
      mappedColumn.controlHeight ?? mappedColumn.layoutHeight ?? 21,
    );
    const resolvedLeft = toRecordNumber(
      getRecordFieldValue(layoutRow, ...BILL_DESIGNER_CONTROL_LEFT_KEYS),
      mappedColumn.canvasX ?? getBillFieldLayout(index, resolvedWidth).canvasX,
    );
    const resolvedTop = toRecordNumber(
      getRecordFieldValue(layoutRow, ...BILL_DESIGNER_CONTROL_TOP_KEYS),
      mappedColumn.canvasY ?? getBillFieldLayout(index, resolvedWidth).canvasY,
    );
    const normalizedBackendId = resolvedBackendId == null || String(resolvedBackendId).trim() === ''
      ? null
      : resolvedBackendId;
    const fallbackId = normalizeBillDesignerFieldId(
      resolvedFieldName || resolvedDisplayName || getRecordFieldValue(layoutRow, 'controlname', 'controlName'),
      `layout_${index + 1}`,
    );

    return {
      ...mappedColumn,
      ...(matchedMasterField ?? {}),
      ...layoutRow,
      id: normalizedBackendId == null ? `field_${fallbackId}` : `field_${String(normalizedBackendId).trim()}`,
      backendId: normalizedBackendId,
      fieldSqlTag: resolvedFieldTypeId,
      fieldSqlTagName: resolvedFieldTypeName,
      fieldTypeId: resolvedFieldTypeId,
      controltype: resolvedFieldTypeId,
      controlType: resolvedFieldTypeId,
      controltypename: resolvedFieldTypeName,
      controlTypeName: resolvedFieldTypeName,
      layoutRowId: getRecordFieldValue(layoutRow, 'id', 'ID', 'Id'),
      name: resolvedDisplayName || resolvedFieldName || mappedColumn.name || `字段 ${index + 1}`,
      required: nullableValue == null ? mappedColumn.required : toRecordBoolean(nullableValue, false),
      sourceField: resolvedFieldName || mappedColumn.sourceField || `field_${index + 1}`,
      type: mapFieldSqlTagToFieldType(
        resolvedFieldTypeId,
        resolvedFieldTypeName,
        toRecordText(mappedColumn.type) || '文本',
      ),
      visible: visibleValue == null ? mappedColumn.visible : !toRecordBoolean(visibleValue, false),
      width: resolvedWidth,
      controlWidth: resolvedWidth,
      controlHeight: resolvedHeight,
      layoutControlHeight: resolvedHeight,
      layoutControlLeft: resolvedLeft,
      layoutControlTop: resolvedTop,
      layoutHeight: resolvedHeight,
      canvasX: resolvedLeft,
      canvasY: resolvedTop,
      orderId: toRecordNumber(getRecordFieldValue(layoutRow, 'orderid', 'orderId', 'tabOrder', 'zindex', 'zIndex'), index + 1),
    };
  });
  const rowAssignments = buildBillHeaderRowAssignments(mappedColumns);

  const columns = alignBillHeaderFieldsToFlowLayout(mappedColumns
    .map((column) => ({
      ...column,
      panelOrder: rowAssignments.get(String(column.id))?.panelOrder ?? toRecordNumber(column.orderId, 1),
      panelRow: rowAssignments.get(String(column.id))?.panelRow ?? 1,
    }))
    .sort((left, right) => (
      toRecordNumber(left.panelRow, 1) - toRecordNumber(right.panelRow, 1)
      || toRecordNumber(left.panelOrder, 1) - toRecordNumber(right.panelOrder, 1)
      || getBillHeaderLayoutTopValue(left) - getBillHeaderLayoutTopValue(right)
      || getBillHeaderLayoutLeftValue(left) - getBillHeaderLayoutLeftValue(right)
      || toRecordNumber(left.orderId, 0) - toRecordNumber(right.orderId, 0)
    )), {
      gapX: BILL_FORM_WORKBENCH_LAYOUT_GAP_X,
      gapY: BILL_FORM_WORKBENCH_LAYOUT_GAP_Y,
      layoutPaddingX: BILL_FORM_WORKBENCH_LAYOUT_PADDING_X,
      layoutPaddingY: BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y,
      minRowHeight: BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT,
    });

  return {
    columns,
    rowCount: Math.max(1, ...columns.map((column) => toRecordNumber(column.panelRow, 1))),
  };
}
