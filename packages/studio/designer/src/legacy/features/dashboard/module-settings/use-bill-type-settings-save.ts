import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import {
  deleteBillTypeDetailField,
  deleteBillTypeDesignerLayout,
  fetchBillTypeConfig,
  fetchBillTypeDesignerLayout,
  fetchBillTypeDetailFields,
  fetchBillTypeMasterFields,
  saveBillTypeDetailField,
  saveBillTypeConfig,
  saveBillTypeDesignerLayout,
  syncBillTypeDesignerLayout,
} from '../../../lib/backend-module-config';
import { buildBillHeaderFieldsFromDesignerLayout } from './dashboard-single-table-field-mappers';

type SaveCurrentPageOptions = {
  gridColumnsOverride?: {
    rows: any[];
    scope: 'left-grid' | 'main-grid' | 'detail-grid';
    tabId?: string;
  };
  silent?: boolean;
};

type UseBillTypeSettingsSaveOptions = {
  billDetailColumns: any[];
  billDetailConfig: Record<string, any>;
  currentModuleCode: string;
  currentModuleName: string;
  isActive: boolean;
  mapSingleTableDetailGridFieldToColumn: (field: any, index: number) => any;
  mainTableColumns: any[];
  mainTableConfig: Record<string, any>;
  onShowToast: (message: string) => void;
  setBillDetailColumns: Dispatch<SetStateAction<any[]>>;
  setBillDetailConfig: Dispatch<SetStateAction<Record<string, any>>>;
  setMainTableColumns: Dispatch<SetStateAction<any[]>>;
  setMainTableConfig: Dispatch<SetStateAction<Record<string, any>>>;
};

function toText(value: unknown) {
  return value == null ? '' : String(value).trim();
}

function stripBraces(value: string) {
  return value.replace(/[{}]/g, '').trim();
}

function toRoundedNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function toBooleanNumber(value: unknown, fallback = false) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
      return 1;
    }
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
      return 0;
    }
  }

  if (typeof value === 'number') {
    return value === 0 ? 0 : 1;
  }

  if (value == null) {
    return fallback ? 1 : 0;
  }

  return value ? 1 : 0;
}

function stripUndefinedEntries(record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== null));
}

function normalizeComparableValue(value: unknown): unknown {
  if (value == null) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeComparableValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, entryValue]) => [key, normalizeComparableValue(entryValue)]),
    );
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }

    const normalized = trimmed.toLowerCase();
    if (['true', 'yes', 'y', 'on'].includes(normalized)) {
      return 1;
    }
    if (['false', 'no', 'n', 'off'].includes(normalized)) {
      return 0;
    }

    return trimmed;
  }

  return value;
}

function areComparableValuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(normalizeComparableValue(left)) === JSON.stringify(normalizeComparableValue(right));
}

function areComparableBodiesEqual(left: Record<string, unknown>, right: Record<string, unknown>) {
  return areComparableValuesEqual(left, right);
}

type BillHeaderLayoutBody = Record<string, unknown>;
type BillFieldPropertyScope = 'detail' | 'main';
type BillFieldPropertySnapshot = Record<string, unknown>;

type BuildBillHeaderLayoutBodiesOptions = {
  preferPersistedLayoutPosition?: boolean;
};

type BillFieldPropertyBaseline = {
  detail: Record<string, BillFieldPropertySnapshot>;
  main: Record<string, BillFieldPropertySnapshot>;
};

type BillFieldPropertyDiff = {
  addedKeys: string[];
  deletedKeys: string[];
  updatedKeys: string[];
};

type BillTypeConfigSnapshot = {
  backendId: unknown;
  billSequence: unknown;
  detailCond: string;
  detailSql: string;
  detailSqlPrompt: string;
  detailTable: string;
  formKey: string;
  masterSql: string;
  masterTable: string;
  overbackKey: string;
  remark: string;
  typeCode: string;
  typeName: string;
};

type BillSettingsSaveBaseline = {
  billFieldPropertyBaseline: BillFieldPropertyBaseline;
  billHeaderLayoutBaseline: BillHeaderLayoutBody[] | null;
  billTypeConfigBaseline: BillTypeConfigSnapshot | null;
  initialized: {
    config: boolean;
    detailFieldProperties: boolean;
    headerLayout: boolean;
    mainFieldProperties: boolean;
  };
  moduleCode: string;
};

function createEmptyBillFieldPropertyBaseline(): BillFieldPropertyBaseline {
  return {
    detail: {},
    main: {},
  };
}

function createEmptyBillSaveBaseline(moduleCode = ''): BillSettingsSaveBaseline {
  return {
    billFieldPropertyBaseline: createEmptyBillFieldPropertyBaseline(),
    billHeaderLayoutBaseline: null,
    billTypeConfigBaseline: null,
    initialized: {
      config: false,
      detailFieldProperties: false,
      headerLayout: false,
      mainFieldProperties: false,
    },
    moduleCode,
  };
}

function getBillHeaderLayoutFieldId(field: Record<string, any>) {
  const rawValue = field.backendId
    ?? field.fieldId
    ?? field.fieldid
    ?? field.controlId
    ?? field.controlid;
  const normalizedValue = toText(rawValue);
  return normalizedValue || null;
}

function getBillHeaderLayoutIdentityKey(record: Record<string, unknown>) {
  return toText(record.fieldId ?? record.fieldid).toLowerCase();
}

function hasPersistedBillHeaderLayout(fields: any[]) {
  return fields.some((field) => field?.layoutRowId != null && field?.layoutRowId !== '');
}

function hasPersistedBillFieldProperties(fields: any[]) {
  return fields.some((field) => Boolean(getBillHeaderLayoutFieldId(field)));
}

function buildBillHeaderLayoutBodies(
  fields: any[],
  fallbackFormKey: unknown,
  options: BuildBillHeaderLayoutBodiesOptions = {},
) {
  const preferPersistedLayoutPosition = options.preferPersistedLayoutPosition === true;
  const bodies = fields
    .map((field, index) => {
      const fieldId = getBillHeaderLayoutFieldId(field);
      if (!fieldId) {
        return null;
      }

      const fieldName = toText(
        field.sourceField
        ?? field.fieldName
        ?? field.fieldname
        ?? field.controlName
        ?? field.controlname,
      );
      const controlName = toText(field.controlName ?? field.controlname ?? fieldName);
      const displayName = toText(
        field.name
        ?? field.userName
        ?? field.username
        ?? field.username1
        ?? field.displayName,
      );
      const formKey = stripBraces(toText(field.formKey ?? fallbackFormKey));
      const controlLeft = toRoundedNumber(
        preferPersistedLayoutPosition
          ? (field.layoutControlLeft ?? field.controlLeft ?? field.canvasX)
          : (field.canvasX ?? field.controlLeft ?? field.layoutControlLeft),
        0,
      );
      const controlTop = toRoundedNumber(
        preferPersistedLayoutPosition
          ? (field.layoutControlTop ?? field.controlTop ?? field.canvasY)
          : (field.canvasY ?? field.controlTop ?? field.layoutControlTop),
        0,
      );
      const controlWidth = toRoundedNumber(field.controlWidth ?? field.width, 0);
      const controlHeight = toRoundedNumber(
        preferPersistedLayoutPosition
          ? (field.layoutControlHeight ?? field.controlHeight ?? field.layoutHeight)
          : (field.controlHeight ?? field.layoutHeight ?? field.layoutControlHeight),
        21,
      );
      const orderId = Math.max(
        1,
        toRoundedNumber(
          field.orderId
          ?? field.orderid
          ?? field.panelOrder
          ?? index + 1,
          index + 1,
        ),
      );
      const tabOrder = Math.max(
        1,
        toRoundedNumber(
          field.tabOrder
          ?? field.taborder
          ?? field.orderId
          ?? field.orderid
          ?? orderId,
          orderId,
        ),
      );
      const fieldTypeId = toRoundedNumber(
        field.fieldTypeId
        ?? field.fieldtypeid
        ?? field.fieldSqlTag
        ?? field.fieldsqltag
        ?? field.controlType
        ?? field.controltype,
        0,
      );
      const fieldTypeName = toText(
        field.fieldTypeName
        ?? field.fieldtypename
        ?? field.fieldSqlTagName
        ?? field.fieldsqltagname
        ?? field.controlTypeName
        ?? field.controltypename,
      );
      const columnId = field.Column_Id ?? field.columnId;
      const groupName = toText(field.groupName ?? field.groupname);
      const layoutRowId = field.layoutRowId;
      const required = toBooleanNumber(field.required, false);
      const readonly = toBooleanNumber(field.readonly ?? field.readOnly, false);
      const visible = field.visible === undefined
        ? 0
        : (field.visible === false || field.visible === 0 || field.visible === '0' ? 1 : 0);

      return {
        ...(layoutRowId != null && layoutRowId !== '' ? { id: layoutRowId } : {}),
        Column_Id: columnId,
        columnId,
        controlHeight,
        controlLeft,
        controlName,
        controlTop,
        controlWidth,
        controlType: fieldTypeId,
        controlTypeName: fieldTypeName || undefined,
        controlname: controlName,
        controltype: fieldTypeId,
        controltypename: fieldTypeName || undefined,
        defaultValue: toText(field.defaultValue),
        displayName,
        edit: readonly,
        fieldId,
        fieldName,
        fieldTypeId,
        fieldTypeName,
        fieldid: fieldId,
        fieldname: fieldName,
        fieldtypeid: fieldTypeId,
        fieldtypename: fieldTypeName || undefined,
        formKey,
        groupName,
        groupname: groupName || undefined,
        isVisible: visible,
        nullable: required,
        orderId,
        orderid: orderId,
        readonly,
        required,
        tabOrder,
        userName: displayName,
        username: displayName,
        username1: displayName,
        visible,
      } satisfies BillHeaderLayoutBody;
    })
    .filter(Boolean) as BillHeaderLayoutBody[];

  return sortBillHeaderLayoutBodies(bodies);
}

function sortBillHeaderLayoutBodies(bodies: BillHeaderLayoutBody[]) {
  return bodies.slice().sort((left, right) => (
      toRoundedNumber(left.orderId ?? left.orderid, 0) - toRoundedNumber(right.orderId ?? right.orderid, 0)
      || toRoundedNumber(left.controlTop, 0) - toRoundedNumber(right.controlTop, 0)
      || toRoundedNumber(left.controlLeft, 0) - toRoundedNumber(right.controlLeft, 0)
      || getBillHeaderLayoutIdentityKey(left).localeCompare(getBillHeaderLayoutIdentityKey(right))
    ));
}

function buildBillHeaderLayoutComparableBody(body: Record<string, unknown>) {
  return stripUndefinedEntries({
    columnId: toText(body.columnId ?? body.Column_Id),
    controlHeight: toRoundedNumber(body.controlHeight, 0),
    controlLeft: toRoundedNumber(body.controlLeft, 0),
    controlName: toText(body.controlName ?? body.controlname),
    controlTop: toRoundedNumber(body.controlTop, 0),
    controlWidth: toRoundedNumber(body.controlWidth, 0),
    defaultValue: toText(body.defaultValue),
    edit: toBooleanNumber(body.edit ?? body.readonly, false),
    fieldId: toText(body.fieldId ?? body.fieldid),
    fieldName: toText(body.fieldName ?? body.fieldname),
    fieldTypeId: toRoundedNumber(body.fieldTypeId ?? body.fieldtypeid ?? body.controlType ?? body.controltype, 0),
    fieldTypeName: toText(body.fieldTypeName ?? body.fieldtypename ?? body.controlTypeName ?? body.controltypename),
    formKey: stripBraces(toText(body.formKey)),
    groupName: toText(body.groupName ?? body.groupname),
    isVisible: toRoundedNumber(body.isVisible ?? body.visible, 0),
    nullable: toBooleanNumber(body.nullable ?? body.required, false),
    orderId: toRoundedNumber(body.orderId ?? body.orderid, 0),
    tabOrder: toRoundedNumber(body.tabOrder, 0),
    username: toText(body.username ?? body.userName ?? body.username1 ?? body.displayName),
  });
}

function buildBillHeaderLayoutPatch(
  currentBodies: BillHeaderLayoutBody[],
  baselineBodies: BillHeaderLayoutBody[],
) {
  const currentById = new Map(currentBodies.map((body) => [getBillHeaderLayoutIdentityKey(body), body]));
  const baselineById = new Map(baselineBodies.map((body) => [getBillHeaderLayoutIdentityKey(body), body]));

  const saveBodies = currentBodies.filter((body) => {
    const identityKey = getBillHeaderLayoutIdentityKey(body);
    if (!identityKey) {
      return false;
    }

    const baselineBody = baselineById.get(identityKey);
    if (!baselineBody) {
      return true;
    }

    return !areComparableBodiesEqual(
      buildBillHeaderLayoutComparableBody(body),
      buildBillHeaderLayoutComparableBody(baselineBody),
    );
  });

  const deleteFieldIds = baselineBodies
    .filter((body) => {
      const identityKey = getBillHeaderLayoutIdentityKey(body);
      return Boolean(identityKey) && !currentById.has(identityKey);
    })
    .map((body) => toText(body.fieldId ?? body.fieldid))
    .filter(Boolean);

  return {
    deleteFieldIds,
    saveBodies,
  };
}

function getBillFieldPropertyIdentityKey(field: Record<string, any>) {
  const persistedFieldId = getBillHeaderLayoutFieldId(field);
  if (persistedFieldId) {
    return `id:${persistedFieldId.toLowerCase()}`;
  }

  const fieldKey = toText(field.backendFieldKey ?? field.fieldKey ?? field.fieldkey);
  if (fieldKey) {
    return `fieldKey:${fieldKey.toLowerCase()}`;
  }

  const fieldName = toText(
    field.sourceField
    ?? field.fieldName
    ?? field.fieldname
    ?? field.controlName
    ?? field.controlname,
  );
  if (fieldName) {
    return `fieldName:${fieldName.toLowerCase()}`;
  }

  return '';
}

function getBillFieldPersistedId(record: Record<string, any>) {
  const normalizedValue = toText(
    record?.backendId
    ?? record?.id
    ?? record?.fieldId
    ?? record?.fieldid,
  );

  return normalizedValue || null;
}

function getBillFieldPersistedIdFromIdentityKey(identityKey: string) {
  if (!identityKey.startsWith('id:')) {
    return null;
  }

  const persistedId = identityKey.slice(3).trim();
  return persistedId || null;
}

function buildBillFieldPropertyComparableBody(
  field: Record<string, any>,
  scope: BillFieldPropertyScope,
): BillFieldPropertySnapshot {
  const fieldTypeId = toRoundedNumber(
    field.fieldTypeId
    ?? field.fieldtypeid
    ?? field.fieldSqlTag
    ?? field.fieldsqltag
    ?? field.controlType
    ?? field.controltype,
    0,
  );
  const fieldTypeName = toText(
    field.fieldTypeName
    ?? field.fieldtypename
    ?? field.fieldSqlTagName
    ?? field.fieldsqltagname
    ?? field.controlTypeName
    ?? field.controltypename,
  );

  return stripUndefinedEntries({
    align: scope === 'detail' ? toText(field.align) : undefined,
    defaultValue: toText(field.defaultValue),
    dynamicSql: toText(field.dynamicSql ?? field.fieldSql ?? field.fieldsql ?? field.checkCond ?? field.checkcond),
    fieldName: toText(
      field.sourceField
      ?? field.fieldName
      ?? field.fieldname
      ?? field.controlName
      ?? field.controlname,
    ),
    fieldTypeId,
    fieldTypeName,
    name: toText(
      field.name
      ?? field.userName
      ?? field.username
      ?? field.username1
      ?? field.displayName,
    ),
    placeholder: toText(field.placeholder ?? field.InputHintText ?? field.inputHintText ?? field.inputhinttext),
    readonly: toBooleanNumber(field.readonly ?? field.readOnly ?? field.edit, false),
    relationSql: toText(field.relationSql ?? field.relationsql ?? field.sourceSql ?? field.sourcesql),
    required: toBooleanNumber(field.required ?? field.nullable, false),
    visible: toBooleanNumber(field.visible ?? field.isVisible ?? field.isvisible, true),
    width: scope === 'detail' ? toRoundedNumber(field.controlWidth ?? field.width, 0) : undefined,
    orderId: scope === 'detail' ? toRoundedNumber(field.orderId ?? field.orderid, 0) : undefined,
  });
}

function buildBillFieldPropertyBaseline(
  fields: any[],
  scope: BillFieldPropertyScope,
) {
  return fields.reduce<Record<string, BillFieldPropertySnapshot>>((result, field) => {
    const identityKey = getBillFieldPropertyIdentityKey(field);
    if (!identityKey || result[identityKey]) {
      return result;
    }

    result[identityKey] = buildBillFieldPropertyComparableBody(field, scope);
    return result;
  }, {});
}

function buildBillFieldPropertyDiff(
  currentFields: any[],
  baselineFields: Record<string, BillFieldPropertySnapshot>,
  scope: BillFieldPropertyScope,
): BillFieldPropertyDiff {
  const currentById = new Map<string, BillFieldPropertySnapshot>();
  const addedKeys: string[] = [];
  const updatedKeys: string[] = [];

  currentFields.forEach((field) => {
    const identityKey = getBillFieldPropertyIdentityKey(field);
    if (!identityKey || currentById.has(identityKey)) {
      return;
    }

    const currentBody = buildBillFieldPropertyComparableBody(field, scope);
    currentById.set(identityKey, currentBody);
    const baselineBody = baselineFields[identityKey];
    if (!baselineBody) {
      addedKeys.push(identityKey);
      return;
    }

    if (!areComparableBodiesEqual(currentBody, baselineBody)) {
      updatedKeys.push(identityKey);
    }
  });

  const deletedKeys = Object.keys(baselineFields).filter((identityKey) => !currentById.has(identityKey));

  return {
    addedKeys,
    deletedKeys,
    updatedKeys,
  };
}

function hasBillFieldPropertyDiff(diff: BillFieldPropertyDiff) {
  return diff.addedKeys.length > 0 || diff.deletedKeys.length > 0 || diff.updatedKeys.length > 0;
}

function buildBillFieldPropertyMap(fields: any[]) {
  return fields.reduce<Record<string, any>>((result, field) => {
    const identityKey = getBillFieldPropertyIdentityKey(field);
    if (!identityKey || result[identityKey]) {
      return result;
    }

    result[identityKey] = field;
    return result;
  }, {});
}

function buildBillDetailFieldSaveBody(record: Record<string, any>) {
  const persistedId = getBillFieldPersistedId(record);
  const fieldName = toText(
    record?.sourceField
    ?? record?.fieldName
    ?? record?.fieldname,
  );
  const displayName = toText(
    record?.name
    ?? record?.username
    ?? record?.userName
    ?? record?.displayName
    ?? record?.displayname,
  );
  const fieldKey = toText(record?.backendFieldKey ?? record?.fieldKey ?? record?.fieldkey);
  const fieldTypeId = toRoundedNumber(
    record?.fieldTypeId
    ?? record?.fieldtypeid
    ?? record?.fieldSqlTag
    ?? record?.fieldsqltag
    ?? record?.controlType
    ?? record?.controltype,
    0,
  );
  const fieldTypeName = toText(
    record?.fieldTypeName
    ?? record?.fieldtypename
    ?? record?.fieldSqlTagName
    ?? record?.fieldsqltagname
    ?? record?.controlTypeName
    ?? record?.controltypename,
  );
  const isVisible = record?.visible === false ? 1 : 0;
  const nullable = toBooleanNumber(record?.required ?? record?.nullable, false);

  return stripUndefinedEntries({
    ...(persistedId ? { id: persistedId } : {}),
    InputHintText: toText(record?.placeholder ?? record?.InputHintText ?? record?.inputHintText ?? record?.inputhinttext),
    checkCond: toText(record?.dynamicSql ?? record?.fieldSql ?? record?.fieldsql ?? record?.checkCond ?? record?.checkcond),
    controlWidth: toRoundedNumber(record?.controlWidth ?? record?.width, 120),
    dataAlign: toText(record?.align ?? record?.dataAlign ?? '左对齐'),
    defaultValue: toText(record?.defaultValue ?? record?.defaultvalue),
    displayName,
    displayname: displayName,
    edit: toBooleanNumber(record?.readonly ?? record?.readOnly ?? record?.edit, false),
    fieldKey,
    fieldName,
    fieldTypeId,
    fieldTypeName,
    fieldname: fieldName,
    fieldtypeid: fieldTypeId,
    fieldtypename: fieldTypeName || undefined,
    inputHintText: toText(record?.placeholder ?? record?.InputHintText ?? record?.inputHintText ?? record?.inputhinttext),
    isCodeField: Boolean(record?.isCodeField ?? record?.iscodefield ?? false),
    isVisible,
    mobileWidth: toRoundedNumber(record?.mobileWidth ?? record?.mobilewidth ?? record?.controlWidth ?? record?.width, 120),
    nullable,
    orderId: Math.max(1, toRoundedNumber(record?.orderId ?? record?.orderid, 1)),
    relationSql: toText(record?.relationSql ?? record?.relationsql ?? record?.sourceSql ?? record?.sourcesql),
    required: nullable,
    showMobile: Boolean(record?.showMobile ?? record?.showmobile ?? false),
    sourceSql: toText(record?.relationSql ?? record?.relationsql ?? record?.sourceSql ?? record?.sourcesql),
    userName: displayName,
    username: displayName,
    width: toRoundedNumber(record?.width ?? record?.controlWidth, 120),
  });
}

function buildBillTypeConfigSnapshotFromRecord(
  source: Record<string, any>,
  currentModuleCode: string,
  currentModuleName: string,
): BillTypeConfigSnapshot {
  return {
    backendId: source?.backendId ?? source?.id,
    billSequence: source?.billSequence,
    detailCond: toText(
      source?.detailCond
      ?? source?.detailcond
      ?? source?.detailCondition
      ?? source?.detailcondition
      ?? source?.unioncond
      ?? source?.unionCond
      ?? source?.relatedCondition
      ?? source?.relatedcondition
      ?? source?.sourceCondition
      ?? source?.sourcecondition
      ?? source?.defaultQuery
      ?? source?.defaultquery,
    ),
    detailSql: toText(source?.detailSql ?? source?.detailsql ?? source?.detailSQL ?? source?.mainSql),
    detailSqlPrompt: toText(source?.detailSqlPrompt ?? source?.detailsqlprompt ?? source?.detailPrompt ?? source?.detailprompt ?? source?.sqlPrompt),
    detailTable: toText(source?.detailTable ?? source?.detailtable ?? source?.detailTableName ?? source?.detailtablename),
    formKey: toText(source?.formKey),
    masterSql: toText(source?.masterSql ?? source?.mainSql),
    masterTable: toText(source?.masterTable ?? source?.mainTable),
    overbackKey: toText(source?.overbackKey),
    remark: toText(source?.remark),
    typeCode: toText(currentModuleCode || source?.typeCode || source?.typecode),
    typeName: toText(source?.typeName ?? source?.typename ?? source?.moduleName ?? currentModuleName),
  };
}

function buildBillTypeConfigSnapshot(
  mainTableConfig: Record<string, any>,
  billDetailConfig: Record<string, any>,
  currentModuleCode: string,
  currentModuleName: string,
): BillTypeConfigSnapshot {
  return buildBillTypeConfigSnapshotFromRecord({
    backendId: mainTableConfig?.backendId ?? billDetailConfig?.backendId ?? mainTableConfig?.id ?? billDetailConfig?.id,
    billSequence: mainTableConfig?.billSequence ?? billDetailConfig?.billSequence,
    detailCond: billDetailConfig?.sourceCondition ?? billDetailConfig?.defaultQuery,
    detailSql: billDetailConfig?.mainSql,
    detailSqlPrompt: billDetailConfig?.sqlPrompt,
    detailTable: billDetailConfig?.tableName ?? billDetailConfig?.detailTable,
    formKey: mainTableConfig?.formKey,
    mainSql: mainTableConfig?.mainSql,
    masterSql: mainTableConfig?.mainSql,
    mainTable: mainTableConfig?.tableName ?? mainTableConfig?.mainTable,
    masterTable: mainTableConfig?.tableName ?? mainTableConfig?.mainTable,
    overbackKey: mainTableConfig?.overbackKey,
    remark: mainTableConfig?.remark,
    typeCode: currentModuleCode || mainTableConfig?.typeCode || billDetailConfig?.typeCode,
    typeName: mainTableConfig?.typeName || mainTableConfig?.moduleName || billDetailConfig?.typeName || currentModuleName,
  }, currentModuleCode, currentModuleName);
}

function hasLoadedBillTypeConfigBaseline(snapshot: BillTypeConfigSnapshot) {
  return Boolean(snapshot.typeCode) && (
    toText(snapshot.backendId) !== ''
    || snapshot.masterSql !== ''
    || snapshot.masterTable !== ''
    || snapshot.formKey !== ''
    || snapshot.overbackKey !== ''
    || snapshot.remark !== ''
    || snapshot.typeName !== ''
    || snapshot.detailCond !== ''
    || snapshot.detailSql !== ''
    || snapshot.detailSqlPrompt !== ''
    || snapshot.detailTable !== ''
  );
}

function buildBillTypeConfigPatch(
  currentSnapshot: BillTypeConfigSnapshot,
  baselineSnapshot: BillTypeConfigSnapshot | null,
) {
  if (!baselineSnapshot) {
    return stripUndefinedEntries({
      billSequence: currentSnapshot.billSequence,
      detailCond: currentSnapshot.detailCond,
      detailSql: currentSnapshot.detailSql,
      detailSqlPrompt: currentSnapshot.detailSqlPrompt,
      detailTable: currentSnapshot.detailTable,
      formKey: currentSnapshot.formKey,
      id: currentSnapshot.backendId,
      masterSql: currentSnapshot.masterSql,
      masterTable: currentSnapshot.masterTable,
      overbackKey: currentSnapshot.overbackKey,
      remark: currentSnapshot.remark,
      typeCode: currentSnapshot.typeCode,
      typeName: currentSnapshot.typeName,
    });
  }

  const patch: Record<string, unknown> = {};

  if (!areComparableValuesEqual(currentSnapshot.masterSql, baselineSnapshot.masterSql)) patch.masterSql = currentSnapshot.masterSql;
  if (!areComparableValuesEqual(currentSnapshot.masterTable, baselineSnapshot.masterTable)) patch.masterTable = currentSnapshot.masterTable;
  if (!areComparableValuesEqual(currentSnapshot.formKey, baselineSnapshot.formKey)) patch.formKey = currentSnapshot.formKey;
  if (!areComparableValuesEqual(currentSnapshot.overbackKey, baselineSnapshot.overbackKey)) patch.overbackKey = currentSnapshot.overbackKey;
  if (!areComparableValuesEqual(currentSnapshot.remark, baselineSnapshot.remark)) patch.remark = currentSnapshot.remark;
  if (!areComparableValuesEqual(currentSnapshot.typeName, baselineSnapshot.typeName)) patch.typeName = currentSnapshot.typeName;
  if (!areComparableValuesEqual(currentSnapshot.billSequence, baselineSnapshot.billSequence)) patch.billSequence = currentSnapshot.billSequence;
  if (!areComparableValuesEqual(currentSnapshot.detailCond, baselineSnapshot.detailCond)) patch.detailCond = currentSnapshot.detailCond;
  if (!areComparableValuesEqual(currentSnapshot.detailSql, baselineSnapshot.detailSql)) patch.detailSql = currentSnapshot.detailSql;
  if (!areComparableValuesEqual(currentSnapshot.detailSqlPrompt, baselineSnapshot.detailSqlPrompt)) patch.detailSqlPrompt = currentSnapshot.detailSqlPrompt;
  if (!areComparableValuesEqual(currentSnapshot.detailTable, baselineSnapshot.detailTable)) patch.detailTable = currentSnapshot.detailTable;

  if (Object.keys(patch).length > 0 && currentSnapshot.backendId != null && currentSnapshot.backendId !== '') {
    patch.id = currentSnapshot.backendId;
  }

  return patch;
}

function buildFetchedMainTableConfigPatch(
  snapshot: BillTypeConfigSnapshot,
  currentModuleName: string,
) {
  return {
    backendId: snapshot.backendId,
    billSequence: snapshot.billSequence,
    dllCoId: snapshot.typeCode,
    formKey: snapshot.formKey,
    mainSql: snapshot.masterSql,
    moduleName: snapshot.typeName || currentModuleName,
    overbackKey: snapshot.overbackKey,
    remark: snapshot.remark,
    tableName: snapshot.masterTable,
    typeCode: snapshot.typeCode,
    typeName: snapshot.typeName,
  };
}

function buildFetchedBillDetailConfigPatch(snapshot: BillTypeConfigSnapshot) {
  return {
    backendId: snapshot.backendId,
    billSequence: snapshot.billSequence,
    defaultQuery: snapshot.detailCond,
    mainSql: snapshot.detailSql,
    sourceCondition: snapshot.detailCond,
    sqlPrompt: snapshot.detailSqlPrompt,
    tableName: snapshot.detailTable,
    typeCode: snapshot.typeCode,
    typeName: snapshot.typeName,
  };
}

export function useBillTypeSettingsSave({
  billDetailColumns,
  billDetailConfig,
  currentModuleCode,
  currentModuleName,
  isActive,
  mapSingleTableDetailGridFieldToColumn,
  mainTableColumns,
  mainTableConfig,
  onShowToast,
  setBillDetailColumns,
  setBillDetailConfig,
  setMainTableColumns,
  setMainTableConfig,
}: UseBillTypeSettingsSaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const baselineRef = useRef<BillSettingsSaveBaseline>(createEmptyBillSaveBaseline());

  useEffect(() => {
    const typeCode = toText(currentModuleCode || mainTableConfig?.typeCode || billDetailConfig?.typeCode);
    if (!typeCode) {
      baselineRef.current = createEmptyBillSaveBaseline();
      return;
    }

    if (baselineRef.current.moduleCode !== typeCode) {
      baselineRef.current = createEmptyBillSaveBaseline(typeCode);
    }

    const currentSnapshot = buildBillTypeConfigSnapshot(
      mainTableConfig,
      billDetailConfig,
      currentModuleCode,
      currentModuleName,
    );
    const nextBaseline: BillSettingsSaveBaseline = {
      ...baselineRef.current,
      billFieldPropertyBaseline: {
        ...baselineRef.current.billFieldPropertyBaseline,
      },
      initialized: {
        ...baselineRef.current.initialized,
      },
      moduleCode: typeCode,
    };
    let hasBaselineUpdates = false;

    if (!nextBaseline.initialized.config && hasLoadedBillTypeConfigBaseline(currentSnapshot)) {
      nextBaseline.billTypeConfigBaseline = currentSnapshot;
      nextBaseline.initialized.config = true;
      hasBaselineUpdates = true;
    }

    if (!nextBaseline.initialized.headerLayout && hasPersistedBillHeaderLayout(mainTableColumns)) {
      nextBaseline.billHeaderLayoutBaseline = buildBillHeaderLayoutBodies(
        mainTableColumns,
        currentSnapshot.formKey,
        { preferPersistedLayoutPosition: true },
      );
      nextBaseline.initialized.headerLayout = true;
      hasBaselineUpdates = true;
    }

    if (!nextBaseline.initialized.mainFieldProperties && hasPersistedBillFieldProperties(mainTableColumns)) {
      nextBaseline.billFieldPropertyBaseline.main = buildBillFieldPropertyBaseline(mainTableColumns, 'main');
      nextBaseline.initialized.mainFieldProperties = true;
      hasBaselineUpdates = true;
    }

    if (!nextBaseline.initialized.detailFieldProperties && hasPersistedBillFieldProperties(billDetailColumns)) {
      nextBaseline.billFieldPropertyBaseline.detail = buildBillFieldPropertyBaseline(billDetailColumns, 'detail');
      nextBaseline.initialized.detailFieldProperties = true;
      hasBaselineUpdates = true;
    }

    if (hasBaselineUpdates) {
      baselineRef.current = nextBaseline;
    }
  }, [
    billDetailColumns,
    billDetailConfig,
    billDetailConfig?.backendId,
    billDetailConfig?.id,
    billDetailConfig?.typeCode,
    currentModuleCode,
    currentModuleName,
    mainTableColumns,
    mainTableConfig,
    mainTableConfig?.backendId,
    mainTableConfig?.id,
    mainTableConfig?.typeCode,
  ]);

  const saveCurrentPage = useCallback(async (options?: SaveCurrentPageOptions) => {
    const shouldShowToast = !options?.silent;
    const currentSnapshot = buildBillTypeConfigSnapshot(mainTableConfig, billDetailConfig, currentModuleCode, currentModuleName);
    const typeCode = currentSnapshot.typeCode;

    if (!isActive || !typeCode) {
      if (shouldShowToast) {
        onShowToast('请先保存菜单信息，再保存模块设置。');
      }
      return false;
    }

    const baseline = baselineRef.current;
    const gridColumnsOverride = options?.gridColumnsOverride;
    const effectiveMainTableColumns = gridColumnsOverride?.scope === 'main-grid'
      ? gridColumnsOverride.rows
      : mainTableColumns;
    const effectiveBillDetailColumns = gridColumnsOverride?.scope === 'detail-grid'
      ? gridColumnsOverride.rows
      : billDetailColumns;
    const hasUnsupportedLeftGridChanges = gridColumnsOverride?.scope === 'left-grid';
    const requestBody = buildBillTypeConfigPatch(currentSnapshot, baseline.billTypeConfigBaseline);
    const currentBillHeaderLayoutBodies = buildBillHeaderLayoutBodies(effectiveMainTableColumns, currentSnapshot.formKey);
    const billHeaderLayoutPatch = buildBillHeaderLayoutPatch(
      currentBillHeaderLayoutBodies,
      baseline.billHeaderLayoutBaseline ?? [],
    );
    const detailFieldPropertyDiff = buildBillFieldPropertyDiff(
      effectiveBillDetailColumns,
      baseline.billFieldPropertyBaseline.detail,
      'detail',
    );
    const detailFieldMap = buildBillFieldPropertyMap(effectiveBillDetailColumns);
    const hasBillHeaderLayoutChanges = (
      billHeaderLayoutPatch.saveBodies.length > 0
      || billHeaderLayoutPatch.deleteFieldIds.length > 0
    );
    const hasDetailFieldChanges = hasBillFieldPropertyDiff(detailFieldPropertyDiff);
    const hasSupportedChanges = Object.keys(requestBody).length > 0 || hasBillHeaderLayoutChanges || hasDetailFieldChanges;
    const hasUnsupportedChanges = Boolean(hasUnsupportedLeftGridChanges);

    if (!hasSupportedChanges) {
      if (hasUnsupportedChanges) {
        if (shouldShowToast) {
          onShowToast('当前单据接口未提供字段级保存，本次没有可提交的配置变更。');
        }
        return false;
      }

      if (shouldShowToast) {
        onShowToast('当前页面没有需要保存的变更。');
      }
      return true;
    }

    setIsSaving(true);

    try {
      if (Object.keys(requestBody).length > 0) {
        await saveBillTypeConfig(typeCode, requestBody);
      }

      for (const body of billHeaderLayoutPatch.saveBodies) {
        await saveBillTypeDesignerLayout(typeCode, body);
      }

      for (const fieldId of billHeaderLayoutPatch.deleteFieldIds) {
        await deleteBillTypeDesignerLayout(typeCode, fieldId);
      }

      if (hasBillHeaderLayoutChanges) {
        await syncBillTypeDesignerLayout(typeCode);
      }

      for (const identityKey of [...detailFieldPropertyDiff.addedKeys, ...detailFieldPropertyDiff.updatedKeys]) {
        const fieldRecord = detailFieldMap[identityKey];
        if (!fieldRecord) {
          continue;
        }

        await saveBillTypeDetailField(typeCode, buildBillDetailFieldSaveBody(fieldRecord));
      }

      for (const identityKey of detailFieldPropertyDiff.deletedKeys) {
        const persistedId = getBillFieldPersistedIdFromIdentityKey(identityKey);
        if (!persistedId) {
          continue;
        }

        await deleteBillTypeDetailField(typeCode, persistedId);
      }

      const [savedTypeConfigRecord, savedLayoutRows, savedMasterFieldRows, savedDetailFieldRows] = await Promise.all([
        fetchBillTypeConfig(typeCode),
        fetchBillTypeDesignerLayout(typeCode),
        fetchBillTypeMasterFields(typeCode),
        fetchBillTypeDetailFields(typeCode),
      ]);
      const savedTypeConfigSnapshot = buildBillTypeConfigSnapshotFromRecord(
        savedTypeConfigRecord as Record<string, any>,
        currentModuleCode,
        currentModuleName,
      );
      const { columns: savedMainColumns } = buildBillHeaderFieldsFromDesignerLayout(savedLayoutRows, savedMasterFieldRows);
      const savedDetailColumns = savedDetailFieldRows.map((field, index) => mapSingleTableDetailGridFieldToColumn(field, index));

      setMainTableColumns(savedMainColumns);
      setBillDetailColumns(savedDetailColumns);
      setMainTableConfig((prev) => ({
        ...prev,
        ...buildFetchedMainTableConfigPatch(savedTypeConfigSnapshot, currentModuleName),
      }));
      setBillDetailConfig((prev) => ({
        ...prev,
        ...buildFetchedBillDetailConfigPatch(savedTypeConfigSnapshot),
      }));

      baselineRef.current = {
        billFieldPropertyBaseline: {
          detail: buildBillFieldPropertyBaseline(savedDetailColumns, 'detail'),
          main: buildBillFieldPropertyBaseline(savedMainColumns, 'main'),
        },
        billHeaderLayoutBaseline: buildBillHeaderLayoutBodies(
          savedMainColumns,
          savedTypeConfigSnapshot.formKey,
          { preferPersistedLayoutPosition: true },
        ),
        billTypeConfigBaseline: savedTypeConfigSnapshot,
        initialized: {
          config: true,
          detailFieldProperties: true,
          headerLayout: true,
          mainFieldProperties: true,
        },
        moduleCode: typeCode,
      };

      if (hasUnsupportedChanges) {
        if (shouldShowToast) {
          onShowToast('当前单据接口未提供字段级保存，本次已保存可提交的单据配置。');
        }
        return false;
      }

      if (shouldShowToast) {
        onShowToast('单据模块设置已保存。');
      }
      return true;
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : '单据模块设置保存失败。';
      if (shouldShowToast) {
        onShowToast(message);
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    billDetailColumns,
    billDetailConfig,
    currentModuleCode,
    currentModuleName,
    isActive,
    mainTableColumns,
    mainTableConfig,
    mapSingleTableDetailGridFieldToColumn,
    onShowToast,
    setBillDetailColumns,
    setBillDetailConfig,
    setMainTableColumns,
    setMainTableConfig,
  ]);

  return {
    isSaving,
    saveCurrentPage,
  };
}
