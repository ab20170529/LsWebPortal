export type SingleTableMainFieldSettingEditor =
  | 'text'
  | 'number'
  | 'textarea'
  | 'checkbox'
  | 'field-name-select'
  | 'field-sql-tag-select'
  | 'data-format-select'
  | 'font-select';

export type SingleTableMainFieldSettingDefinition = {
  editor: SingleTableMainFieldSettingEditor;
  key: string;
  readOnly?: boolean;
  title: string;
  width: number;
};

export const singleTableMainFieldSettings: SingleTableMainFieldSettingDefinition[] = [
  { key: 'id', title: 'ID', width: 96, editor: 'text', readOnly: true },
  { key: 'orderid', title: '序号', width: 88, editor: 'number' },
  { key: 'fieldname', title: '字段', width: 180, editor: 'field-name-select' },
  { key: 'sysname', title: '出厂名称', width: 160, editor: 'text' },
  { key: 'username1', title: '用户名', width: 160, editor: 'text' },
  { key: 'fieldsqltag', title: '来源', width: 190, editor: 'field-sql-tag-select' },
  { key: 'width', title: '宽', width: 90, editor: 'number' },
  { key: 'defaultdate', title: '默认值', width: 180, editor: 'text' },
  { key: 'DataFormat', title: '格式化', width: 190, editor: 'data-format-select' },
  { key: 'vislble', title: '禁显', width: 88, editor: 'checkbox' },
  { key: 'addvisible', title: '禁显1', width: 92, editor: 'checkbox' },
  { key: 'LimitLen', title: '长度限制', width: 110, editor: 'number' },
  { key: 'tagid', title: '必', width: 72, editor: 'checkbox' },
  { key: 'edit', title: '禁编', width: 86, editor: 'checkbox' },
  { key: 'flowContentFlag', title: '摘要', width: 88, editor: 'checkbox' },
  { key: 'flowContentOrder', title: '摘要顺序', width: 112, editor: 'number' },
  { key: 'unionValue', title: '关联值', width: 220, editor: 'textarea' },
  { key: 'unionFields', title: '关联字段', width: 180, editor: 'text' },
  { key: 'ShowMobile', title: '移动显示', width: 100, editor: 'checkbox' },
  { key: 'ShowMobile1', title: '移动显示1', width: 104, editor: 'checkbox' },
  { key: 'vislble5', title: '移动显示2', width: 104, editor: 'checkbox' },
  { key: 'canCopy', title: '复制', width: 80, editor: 'checkbox' },
  { key: 'isSum', title: '合计', width: 80, editor: 'checkbox' },
  { key: 'sumText', title: '合计文本', width: 150, editor: 'text' },
  { key: 'calcExpr', title: '计算公式', width: 220, editor: 'textarea' },
  { key: 'calcOrder', title: '计算顺序', width: 110, editor: 'number' },
  { key: 'mobile_field', title: '移动行显示内容', width: 220, editor: 'textarea' },
  { key: 'sumCalc', title: '合计计算公式', width: 220, editor: 'textarea' },
  { key: 'disableCond', title: '可用条件', width: 220, editor: 'textarea' },
  { key: 'disableType', title: '禁用方式', width: 110, editor: 'text' },
  { key: 'ifMerge', title: '合并', width: 80, editor: 'checkbox' },
  { key: 'MergeGroup', title: '合并分组', width: 110, editor: 'text' },
  { key: 'TM_tagID', title: '标识字段', width: 110, editor: 'text' },
  { key: 'PrivilegeView', title: '浏览权限', width: 110, editor: 'text' },
  { key: 'PrivilegeOper', title: '操作权限', width: 110, editor: 'text' },
  { key: 'mobile_order', title: '显示行内容', width: 110, editor: 'number' },
  { key: 'MobileWidth', title: '移动端宽度', width: 116, editor: 'number' },
  { key: 'ifsearch', title: '移动搜索', width: 96, editor: 'checkbox' },
  { key: 'userenname', title: '用户名1', width: 150, editor: 'text' },
  { key: 'ifSearch', title: '条件', width: 80, editor: 'checkbox' },
  { key: 'autoNo', title: '自动', width: 80, editor: 'checkbox' },
  { key: 'bandFields', title: '绑定字段', width: 150, editor: 'text' },
  { key: 'fieldsqlid', title: 'Value字段', width: 140, editor: 'text' },
  { key: 'fieldsqlname', title: 'Text字段', width: 140, editor: 'text' },
  { key: 'fieldsql', title: 'sql', width: 240, editor: 'textarea' },
  { key: 'addModuleId', title: '添加模块ID', width: 120, editor: 'text' },
  { key: 'AddModuleSpec', title: '默认分类', width: 220, editor: 'textarea' },
  { key: 'addModuleResult', title: '添加返回值', width: 220, editor: 'textarea' },
  { key: 'rpname', title: '分组名称', width: 140, editor: 'text' },
  { key: 'row_id1', title: '行号', width: 86, editor: 'number' },
  { key: 'columns_id1', title: '列号', width: 86, editor: 'number' },
  { key: 'controlWidth', title: '组件宽度', width: 110, editor: 'number' },
  { key: 'TM_HeadString', title: '列头字段', width: 140, editor: 'text' },
  { key: 'fontName', title: '字体', width: 150, editor: 'font-select' },
  { key: 'TM_linkmainTabfield', title: '主表字段关联', width: 150, editor: 'text' },
  { key: 'nextOrder', title: '跳转序号', width: 180, editor: 'textarea' },
  { key: 'mobile_fontSize', title: '移动字号', width: 100, editor: 'number' },
  { key: 'fontsize', title: '字号', width: 88, editor: 'number' },
  { key: 'dataAlignment', title: '显示位置', width: 110, editor: 'text' },
  { key: 'bandTitle', title: '绑定标题', width: 140, editor: 'text' },
  { key: 'imageWidth', title: '图片宽', width: 92, editor: 'number' },
  { key: 'imageHeight', title: '图片高', width: 92, editor: 'number' },
  { key: 'cardOrder', title: 'APP卡序', width: 100, editor: 'number' },
  { key: 'cardEnable', title: 'APP卡禁', width: 96, editor: 'checkbox' },
  { key: 'controlColor', title: 'APP颜色', width: 120, editor: 'text' },
  { key: 'BSRowId', title: 'BS行号', width: 90, editor: 'number' },
  { key: 'BSColPercent', title: 'BS比例', width: 90, editor: 'number' },
  { key: 'bs_order', title: 'BS卡序', width: 90, editor: 'number' },
  { key: 'bs_field', title: 'BS卡字段', width: 120, editor: 'text' },
  { key: 'bs_color', title: 'BS卡颜色', width: 120, editor: 'text' },
  { key: 'bs_fontsize', title: 'BS卡字号', width: 98, editor: 'number' },
  { key: 'TitleColor', title: '标题颜色', width: 120, editor: 'text' },
  { key: 'InputHintText', title: '录入提示', width: 220, editor: 'textarea' },
  { key: 'sumCond', title: '合计条件', width: 220, editor: 'textarea' },
  { key: 'labelWidth', title: '标签宽度', width: 104, editor: 'number' },
  { key: 'labelAlign', title: '对齐方式', width: 110, editor: 'text' },
  { key: 'ownerEnabled', title: '启用', width: 80, editor: 'checkbox', readOnly: true },
  { key: 'highlightBColor', title: '高亮背景色', width: 120, editor: 'text' },
  { key: 'highlightFColor', title: '高亮前景色', width: 120, editor: 'text' },
  { key: 'highlightBold', title: '字体加粗', width: 96, editor: 'checkbox' },
  { key: 'doNotSpelling', title: '禁拼', width: 80, editor: 'checkbox' },
  { key: 'dataAlign', title: 'BS数据对齐', width: 120, editor: 'text' },
  { key: 'frozenFlag', title: '冻结列', width: 88, editor: 'checkbox' },
  { key: 'lookupWidth', title: '下拉宽度', width: 104, editor: 'number' },
  { key: 'lookupFieldsWidth', title: '下拉字段宽度', width: 220, editor: 'textarea' },
  { key: 'isDynamic', title: '动态显示', width: 96, editor: 'checkbox' },
];

const fieldDefinitionMap = new Map(singleTableMainFieldSettings.map((definition) => [definition.key, definition]));

function hasOwn(record: Record<string, unknown> | null | undefined, key: string) {
  return Boolean(record) && Object.prototype.hasOwnProperty.call(record, key);
}

function toText(value: unknown) {
  return value == null ? '' : String(value);
}

function normalizeLookupKey(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function toIntegerLike(value: unknown) {
  if (value === '' || value == null) {
    return undefined;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function resolveCheckboxChecked(
  rawValue: unknown,
  fallback = false,
  options: { inverted?: boolean } = {},
) {
  if (rawValue == null || rawValue === '') {
    return fallback;
  }

  if (options.inverted) {
    return String(rawValue) === '0' || rawValue === 0;
  }

  return rawValue === true || rawValue === 1 || String(rawValue) === '1';
}

function resolveCaseInsensitiveValue(record: Record<string, unknown>, key: string) {
  if (hasOwn(record, key)) {
    return record[key];
  }

  const normalizedTargetKey = normalizeLookupKey(key);

  for (const [entryKey, entryValue] of Object.entries(record)) {
    if (normalizeLookupKey(entryKey) === normalizedTargetKey) {
      return entryValue;
    }
  }

  return undefined;
}

function resolveFirstLooseValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = resolveCaseInsensitiveValue(record, key);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

export function getSingleTableMainFieldSettingDefinition(key: string) {
  return fieldDefinitionMap.get(key) ?? null;
}

export function resolveSingleTableMainFieldSettingValue(record: Record<string, unknown>, key: string) {
  switch (key) {
    case 'fieldname':
      return resolveFirstLooseValue(record, ['fieldname', 'fieldName', 'sourceField']) ?? '';
    case 'username1':
      return resolveFirstLooseValue(record, ['username1', 'username', 'userName', 'displayName', 'displayname', 'name']) ?? '';
    case 'fieldsqltag':
      return resolveFirstLooseValue(record, ['fieldsqltag', 'fieldSqlTag', 'controltype', 'controlType']) ?? 0;
    case 'defaultdate':
      return resolveFirstLooseValue(record, ['defaultdate', 'defaultDate', 'defaultValue']) ?? '';
    case 'vislble':
      return resolveCheckboxChecked(
        resolveFirstLooseValue(record, ['vislble']),
        !resolveCheckboxChecked(resolveFirstLooseValue(record, ['visible']), true),
      );
    case 'tagid':
      return resolveCheckboxChecked(resolveFirstLooseValue(record, ['tagid', 'required']));
    case 'edit':
      return resolveCheckboxChecked(resolveFirstLooseValue(record, ['edit', 'readonly', 'readOnly']));
    case 'fieldsql':
      return resolveFirstLooseValue(record, ['fieldsql', 'fieldSql', 'dynamicSql', 'dynamicsql']) ?? '';
    case 'fieldsqlid':
      return resolveFirstLooseValue(record, ['fieldsqlid', 'fieldSqlId', 'dictCode', 'dictcode']) ?? '';
    case 'fieldsqlname':
      return resolveFirstLooseValue(record, ['fieldsqlname', 'fieldSqlName']) ?? '';
    case 'InputHintText':
      return resolveFirstLooseValue(record, ['InputHintText', 'inputHintText', 'inputhinttext', 'placeholder']) ?? '';
    case 'MobileWidth':
      return resolveFirstLooseValue(record, ['MobileWidth', 'mobileWidth', 'mobilewidth']) ?? '';
    case 'controlWidth':
      return resolveFirstLooseValue(record, ['controlWidth', 'controlwidth']) ?? '';
    case 'ifSearch':
      return resolveCheckboxChecked(
        resolveFirstLooseValue(record, ['ifSearch', 'ifsearch']),
        resolveCheckboxChecked(resolveFirstLooseValue(record, ['searchable']), false),
        { inverted: true },
      );
    case 'ifsearch':
      return resolveCheckboxChecked(resolveFirstLooseValue(record, ['ifsearch', 'showSearchMobile']));
    case 'dataAlign':
      return resolveFirstLooseValue(record, ['dataAlign', 'dataalign', 'align']) ?? '';
    default: {
      const definition = getSingleTableMainFieldSettingDefinition(key);
      const value = resolveFirstLooseValue(record, [key]);
      if (!definition) {
        return value;
      }

      if (definition.editor === 'checkbox') {
        return resolveCheckboxChecked(value);
      }

      return value ?? '';
    }
  }
}

type UpdateSettingOptions = {
  auxiliaryLabel?: string;
  fieldDec?: unknown;
  fieldLen?: unknown;
};

export function updateSingleTableMainFieldSettingValue(
  record: Record<string, unknown>,
  key: string,
  nextValue: unknown,
  options: UpdateSettingOptions = {},
) {
  const nextRecord = { ...record };

  const assignCheckbox = (fieldKey: string, checked: boolean) => {
    nextRecord[fieldKey] = checked ? 1 : 0;
  };

  switch (key) {
    case 'fieldname': {
      const value = toText(nextValue);
      nextRecord.fieldname = value;
      nextRecord.fieldName = value;
      nextRecord.sourceField = value;
      if (!toText(nextRecord.sysname).trim()) {
        nextRecord.sysname = value;
      }
      const nextLimitLen = toIntegerLike(options.fieldLen);
      if (nextLimitLen != null && (nextRecord.LimitLen == null || nextRecord.LimitLen === '')) {
        nextRecord.LimitLen = nextLimitLen;
      }
      if (options.fieldDec != null && (nextRecord.fieldDec == null || nextRecord.fieldDec === '')) {
        nextRecord.fieldDec = toIntegerLike(options.fieldDec);
      }
      return nextRecord;
    }
    case 'username1': {
      const value = toText(nextValue);
      nextRecord.username1 = value;
      nextRecord.username = value;
      nextRecord.userName = value;
      nextRecord.displayName = value;
      nextRecord.displayname = value;
      nextRecord.name = value;
      return nextRecord;
    }
    case 'fieldsqltag': {
      const numericValue = toIntegerLike(nextValue) ?? 0;
      nextRecord.fieldsqltag = numericValue;
      nextRecord.fieldSqlTag = numericValue;
      nextRecord.controltype = numericValue;
      nextRecord.controlType = numericValue;
      if (options.auxiliaryLabel) {
        nextRecord.fieldsqltagname = options.auxiliaryLabel;
        nextRecord.fieldSqlTagName = options.auxiliaryLabel;
      }
      return nextRecord;
    }
    case 'defaultdate': {
      const value = toText(nextValue);
      nextRecord.defaultdate = value;
      nextRecord.defaultDate = value;
      nextRecord.defaultValue = value;
      return nextRecord;
    }
    case 'vislble': {
      const checked = Boolean(nextValue);
      assignCheckbox('vislble', checked);
      nextRecord.visible = !checked;
      return nextRecord;
    }
    case 'tagid': {
      const checked = Boolean(nextValue);
      assignCheckbox('tagid', checked);
      nextRecord.required = checked;
      return nextRecord;
    }
    case 'edit': {
      const checked = Boolean(nextValue);
      assignCheckbox('edit', checked);
      nextRecord.readonly = checked;
      nextRecord.readOnly = checked;
      return nextRecord;
    }
    case 'fieldsql': {
      const value = toText(nextValue);
      nextRecord.fieldsql = value;
      nextRecord.fieldSql = value;
      nextRecord.dynamicSql = value;
      return nextRecord;
    }
    case 'fieldsqlid': {
      const value = toText(nextValue);
      nextRecord.fieldsqlid = value;
      nextRecord.fieldSqlId = value;
      nextRecord.dictCode = value;
      nextRecord.dictcode = value;
      return nextRecord;
    }
    case 'fieldsqlname': {
      const value = toText(nextValue);
      nextRecord.fieldsqlname = value;
      nextRecord.fieldSqlName = value;
      return nextRecord;
    }
    case 'InputHintText': {
      const value = toText(nextValue);
      nextRecord.InputHintText = value;
      nextRecord.inputHintText = value;
      nextRecord.inputhinttext = value;
      nextRecord.placeholder = value;
      return nextRecord;
    }
    case 'MobileWidth': {
      const value = toIntegerLike(nextValue);
      nextRecord.MobileWidth = value;
      nextRecord.mobileWidth = value;
      nextRecord.mobilewidth = value;
      return nextRecord;
    }
    case 'controlWidth': {
      const value = toIntegerLike(nextValue);
      nextRecord.controlWidth = value;
      nextRecord.controlwidth = value;
      return nextRecord;
    }
    case 'ifSearch': {
      const checked = Boolean(nextValue);
      nextRecord.ifSearch = checked ? 0 : 1;
      nextRecord.ifsearch = checked ? 0 : 1;
      nextRecord.searchable = checked;
      return nextRecord;
    }
    case 'ifsearch': {
      const checked = Boolean(nextValue);
      nextRecord.ifsearch = checked ? 1 : 0;
      return nextRecord;
    }
    case 'dataAlign': {
      const value = toText(nextValue);
      nextRecord.dataAlign = value;
      nextRecord.dataalign = value;
      nextRecord.align = value;
      return nextRecord;
    }
    default: {
      const definition = getSingleTableMainFieldSettingDefinition(key);
      if (definition?.editor === 'checkbox') {
        assignCheckbox(key, Boolean(nextValue));
        return nextRecord;
      }

      if (definition?.editor === 'number') {
        nextRecord[key] = toIntegerLike(nextValue);
        return nextRecord;
      }

      nextRecord[key] = nextValue;
      return nextRecord;
    }
  }
}

export function createSingleTableMainFieldDraftRow(moduleCode: string, orderId: number) {
  const draftKey = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const guid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `field_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  return {
    __draftKey: draftKey,
    tab: moduleCode,
    fieldkey: guid,
    fieldKey: guid,
    backendFieldKey: guid,
    fieldname: '',
    fieldName: '',
    sourceField: '',
    sysname: '',
    username1: `字段 ${orderId}`,
    username: `字段 ${orderId}`,
    userName: `字段 ${orderId}`,
    displayName: `字段 ${orderId}`,
    name: `字段 ${orderId}`,
    orderid: orderId,
    width: 100,
    MobileWidth: 120,
    controlWidth: 100,
    fieldsqltag: 0,
    fieldSqlTag: 0,
    fieldsqltagname: '字符串',
    defaultdate: '',
    DataFormat: '',
    vislble: 0,
    addvisible: 0,
    tagid: 0,
    edit: 0,
    ownerEnabled: 1,
    ifSearch: 1,
    ifsearch: 0,
  };
}

export function buildSingleTableMainFieldExtraBody(record: Record<string, unknown>) {
  const body: Record<string, unknown> = {};

  singleTableMainFieldSettings.forEach((definition) => {
    if (definition.key === 'id') {
      return;
    }

    const value = resolveSingleTableMainFieldSettingValue(record, definition.key);
    if (definition.editor === 'checkbox') {
      body[definition.key] = definition.key === 'ifSearch'
        ? (value ? 0 : 1)
        : (value ? 1 : 0);
      return;
    }

    if (definition.editor === 'number') {
      const numericValue = toIntegerLike(value);
      if (numericValue !== undefined) {
        body[definition.key] = numericValue;
      }
      return;
    }

    const textValue = toText(value);
    body[definition.key] = textValue;
  });

  return body;
}
