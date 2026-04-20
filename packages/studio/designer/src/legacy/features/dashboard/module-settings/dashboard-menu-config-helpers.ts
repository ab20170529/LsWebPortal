import { type BackendMenuNode, type BackendSubsystemNode } from '../../../lib/backend-menus';
import { type SubsystemMenuConfigDto } from '../../../lib/backend-subsystem-menu-config';

export type BusinessType = 'document' | 'table' | 'tree';
export type ModuleMenuFieldKind = 'text' | 'textarea' | 'number' | 'select' | 'switch';
export type ModuleMenuValue = string | boolean;
export type ModuleMenuDraft = Record<string, ModuleMenuValue>;
export type ModuleMenuOption = {
  value: string;
  label: string;
};
export type ModuleMenuFieldSchema = {
  key: string;
  label: string;
  tableField: string;
  kind: ModuleMenuFieldKind;
  placeholder?: string;
  hint?: string;
  options?: ModuleMenuOption[];
  rows?: number;
  span?: 'half' | 'full';
};
export type ModuleMenuSectionSchema = {
  title: string;
  description: string;
  fields: ModuleMenuFieldSchema[];
};
export type MenuModuleTypeProfile = {
  badgeClass: string;
  businessType: BusinessType;
  icon: string;
  label: string;
};

const MENU_MODULE_TYPE_PROFILES: Record<'bill' | 'single-table', MenuModuleTypeProfile> = {
  'single-table': {
    badgeClass:
      'border-sky-100 bg-sky-50 text-sky-600 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300',
    businessType: 'document',
    icon: 'table_view',
    label: '单表',
  },
  bill: {
    badgeClass:
      'border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300',
    businessType: 'table',
    icon: 'receipt_long',
    label: '单据',
  },
};

const SINGLE_TABLE_DEFAULT_DLL_FILE_NAME = 'Lskj.PubModuleDetail.dll';
const MENU_CONFIG_DEFAULTS: ModuleMenuDraft = {
  menuId: '',
  subsystemId: '',
  parentMenuId: '',
  menuStruct: '',
  menuCaption: '',
  moduleCode: '',
  useFlag: 'true',
  modType: '1',
  dllFileName: '',
  urlParams: '',
  groupCaption: '',
  menuRow: '',
  menuTips: '',
};

export const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string; icon: string }> = [
  { value: 'document', label: '单表', icon: 'table_view' },
  { value: 'table', label: '单据', icon: 'receipt_long' },
  { value: 'tree', label: '树形单表', icon: 'account_tree' },
];
export const MODULE_TYPE_OPTIONS = BUSINESS_TYPE_OPTIONS.filter((option) => option.value !== 'tree');
export const MODULE_GUIDE_PROFILES: Record<BusinessType, {
  label: string;
  intro: string;
  configTable: string;
  configTableDesc: string;
  keyFields: string[];
  relatedTables: string[];
}> = {
  document: {
    label: '单表',
    intro: '菜单信息统一写入 P_FormMenuConfigTab，确认类型后，后续模块主配置会落到 p_systemdlltab，并继续向字段、条件、右键、颜色等子表扩展。',
    configTable: 'p_systemdlltab',
    configTableDesc: '单表主模块信息',
    keyFields: ['DllCoid', 'ToolsName', 'SQL', 'SQLDT1', 'formKey', 'condKey'],
    relatedTables: ['p_systemwordbooktab', 'p_systembillsourcecond', 'p_systempopupmenu', 'p_systemwordbookcolor'],
  },
  table: {
    label: '单据',
    intro: '菜单信息统一写入 P_FormMenuConfigTab，确认类型后，后续模块主配置会落到 p_systembilltype，再挂单据主信息、明细、来源和流程。',
    configTable: 'p_systembilltype',
    configTableDesc: '单据模块主信息',
    keyFields: ['模块编码', '模块名称', '模块主表', '模块明细表', '明细表sql', '模块配置关联字段'],
    relatedTables: ['p_systembillinfo', 'p_systembilldetail', 'p_systembillsource', 'p_systempopupmenu'],
  },
  tree: {
    label: '树形单表',
    intro: '菜单信息统一写入 P_FormMenuConfigTab，树形单表仍归属单表体系，后续主配置表与单表一致，并通过树字段和动态 SQL 扩展左侧树结构。',
    configTable: 'p_systemdlltab',
    configTableDesc: '单表主模块信息',
    keyFields: ['DllCoid', 'ToolsName', 'SQL', 'TreeSQL', 'TreeTableExpand', 'MainModuleCodeField'],
    relatedTables: ['p_systemwordbooktab', 'p_systemwordbookgrid', 'p_systembillsourcecond', 'p_systempopupmenu'],
  },
};
export const MENU_CONFIG_TABLE_NAME = 'P_FormMenuConfigTab';
export const MENU_CONFIG_TABLE_DESC = '功能树菜单信息';
export const MENU_CONFIG_SECTIONS: ModuleMenuSectionSchema[] = [
  {
    title: '结构列表基础',
    description: '对应文档中功能树结构列表的主键、层级关系和模块关联字段。',
    fields: [
      { key: 'menuCaption', label: '菜单名称', tableField: 'Menucaption', kind: 'text', placeholder: '功能树显示名称' },
      { key: 'moduleCode', label: '功能模块编码', tableField: 'PurviewId', kind: 'text', placeholder: '对应功能模块编号' },
      { key: 'useFlag', label: '启用状态', tableField: 'Useflag', kind: 'switch', hint: '开启后功能树中显示为启用状态' },
    ],
  },
  {
    title: '结构列表扩展',
    description: '对应文档里结构列表的调用参数、分组展示和功能描述字段。',
    fields: [
      { key: 'dllFileName', label: 'DLL 文件名', tableField: 'Dllfilename', kind: 'text', placeholder: '如：LsBill.dll' },
      { key: 'groupCaption', label: '菜单分组标题', tableField: 'GroupCaption', kind: 'text', placeholder: '用于功能树分组显示' },
      { key: 'menuRow', label: '菜单行顺序', tableField: 'Menurow', kind: 'number', placeholder: '分组内显示顺序' },
      { key: 'urlParams', label: '附加参数', tableField: 'Urlparams', kind: 'textarea', rows: 4, span: 'full', placeholder: 'key=value&key2=value2' },
      { key: 'menuTips', label: '功能描述', tableField: 'Menutips', kind: 'textarea', rows: 4, span: 'full', placeholder: '展示在功能树或配置页的功能说明' },
    ],
  },
];
export const MENU_DEFAULT_COMMON_FIELD_KEYS: Record<BusinessType, string[]> = {
  document: ['menuCaption', 'moduleCode', 'useFlag', 'dllFileName', 'menuTips'],
  table: ['menuCaption', 'moduleCode', 'useFlag', 'dllFileName', 'menuTips'],
  tree: ['menuCaption', 'moduleCode', 'useFlag', 'dllFileName', 'menuTips'],
};

function normalizeMenuTitle(value?: string) {
  return value?.trim() || '';
}

function normalizeMenuCode(value?: string) {
  return value?.trim() || '';
}

function normalizeModuleType(value?: string) {
  return value?.trim().toLowerCase() || '';
}

function isUseflagEnabled(useflag: number | string | undefined, enabled: boolean) {
  if (useflag === 1 || useflag === '1') {
    return true;
  }

  if (useflag === 0 || useflag === '0') {
    return false;
  }

  return enabled;
}

function toPersistedSwitch(value: ModuleMenuValue | undefined) {
  return value === true || value === 'true' ? 1 : 0;
}

function toOptionalNumber(value: ModuleMenuValue | undefined) {
  const text = toDraftText(value).trim();
  if (!text) {
    return undefined;
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : text;
}

export function getMenuModuleTypeProfile(moduleType?: string): MenuModuleTypeProfile | null {
  const normalizedType = normalizeModuleType(moduleType);

  if (normalizedType === 'single-table' || normalizedType === 'bill') {
    return MENU_MODULE_TYPE_PROFILES[normalizedType];
  }

  return null;
}

export function getDefaultMenuDllFileName(businessType: BusinessType) {
  return businessType === 'document' ? SINGLE_TABLE_DEFAULT_DLL_FILE_NAME : '';
}

export function buildMenuConfigDraftDefaults(
  businessType: BusinessType,
  overrides: Partial<ModuleMenuDraft> = {},
): ModuleMenuDraft {
  return {
    ...MENU_CONFIG_DEFAULTS,
    modType: businessType === 'table' ? '2' : '1',
    dllFileName: getDefaultMenuDllFileName(businessType),
    ...overrides,
  };
}

export function filterMenuSectionsByKeys(sections: ModuleMenuSectionSchema[], keys: string[]) {
  const keySet = new Set(keys);
  return sections
    .map((section) => ({
      ...section,
      fields: section.fields.filter((field) => keySet.has(field.key)),
    }))
    .filter((section) => section.fields.length > 0);
}

export function toDraftText(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

export function toDraftSwitch(value: unknown) {
  if (value === true || value === 1 || value === '1') {
    return 'true';
  }

  if (typeof value === 'string' && ['true', 'yes', 'y'].includes(value.trim().toLowerCase())) {
    return 'true';
  }

  return 'false';
}

export function getMenuConfigField(menu: SubsystemMenuConfigDto, ...keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(menu, key)) {
      return menu[key];
    }
  }

  const normalizedEntries = Object.entries(menu).map(([entryKey, entryValue]) => [entryKey.toLowerCase(), entryValue] as const);
  for (const key of keys) {
    const matched = normalizedEntries.find(([entryKey]) => entryKey === key.toLowerCase());
    if (matched) {
      return matched[1];
    }
  }

  return undefined;
}

export function mapSubsystemMenuConfigToDraft(menu: SubsystemMenuConfigDto): ModuleMenuDraft {
  return {
    ...MENU_CONFIG_DEFAULTS,
    dllFileName: toDraftText(getMenuConfigField(menu, 'dllfilename', 'dllFileName', 'DllFileName')),
    groupCaption: toDraftText(getMenuConfigField(menu, 'groupcaption', 'groupCaption', 'GroupCaption')),
    menuCaption: toDraftText(getMenuConfigField(menu, 'menucaption', 'menuCaption', 'Menucaption', 'MenuCaption')),
    menuId: toDraftText(getMenuConfigField(menu, 'menuid', 'menuId', 'Menuid', 'MenuId')),
    menuRow: toDraftText(getMenuConfigField(menu, 'menurow', 'menuRow', 'Menurow', 'MenuRow')),
    menuStruct: toDraftText(getMenuConfigField(menu, 'menustruct', 'menuStruct', 'Menustruct', 'MenuStruct')),
    menuTips: toDraftText(getMenuConfigField(menu, 'menutips', 'menuTips', 'Menutips', 'MenuTips')),
    modType: toDraftText(getMenuConfigField(menu, 'modtype', 'modType', 'Modtype', 'ModType')),
    moduleCode: toDraftText(getMenuConfigField(menu, 'purviewid', 'purviewId', 'Purviewid', 'PurviewId')),
    parentMenuId: toDraftText(getMenuConfigField(menu, 'parentmenuid', 'parentMenuId', 'Parentmenuid', 'ParentMenuId')),
    subsystemId: toDraftText(getMenuConfigField(menu, 'subsysid', 'subsystemId', 'subsysId', 'Subsysid', 'SubsystemId', 'SubsysId')),
    urlParams: toDraftText(getMenuConfigField(menu, 'urlparams', 'urlParams', 'Urlparams', 'UrlParams')),
    useFlag: toDraftSwitch(getMenuConfigField(menu, 'useflag', 'useFlag', 'Useflag', 'UseFlag')),
  };
}

export function mapMenuConfigDraftToPayload(draft: ModuleMenuDraft) {
  return {
    ...(toOptionalNumber(draft.menuId) !== undefined ? { menuid: toOptionalNumber(draft.menuId) } : {}),
    ...(toOptionalNumber(draft.subsystemId) !== undefined ? { subsysid: toOptionalNumber(draft.subsystemId) } : {}),
    ...(toOptionalNumber(draft.parentMenuId) !== undefined ? { parentmenuid: toOptionalNumber(draft.parentMenuId) } : {}),
    ...(toOptionalNumber(draft.menuRow) !== undefined ? { menurow: toOptionalNumber(draft.menuRow) } : {}),
    ...(toOptionalNumber(draft.modType) !== undefined ? { modtype: toOptionalNumber(draft.modType) } : {}),
    menustruct: toDraftText(draft.menuStruct).trim(),
    menucaption: toDraftText(draft.menuCaption).trim(),
    purviewid: toDraftText(draft.moduleCode).trim(),
    useflag: toPersistedSwitch(draft.useFlag),
    dllfilename: toDraftText(draft.dllFileName),
    groupcaption: toDraftText(draft.groupCaption),
    menutips: toDraftText(draft.menuTips),
    urlparams: toDraftText(draft.urlParams),
  };
}

export function buildCreateModuleRelationPayload(options: {
  activeFirstLevelMenu?: Pick<BackendMenuNode, 'menuId' | 'id' | 'title' | 'menuStruct' | 'code'> | null;
  moduleKey: string;
  moduleTitle: string;
  moduleType: 'single-table' | 'bill';
  selectedSubsystem?: Pick<BackendSubsystemNode, 'subsysId' | 'subsysCode' | 'code'> | null;
}) {
  const {
    activeFirstLevelMenu,
    moduleKey,
    moduleTitle,
    moduleType,
    selectedSubsystem,
  } = options;
  const parentMenuTitle = normalizeMenuTitle(activeFirstLevelMenu?.title);
  const parentMenuStruct = normalizeMenuCode(activeFirstLevelMenu?.menuStruct);
  const parentMenuCode = normalizeMenuCode(activeFirstLevelMenu?.code);

  return {
    moduletype: moduleType,
    nodetype: 'menu',
    title: moduleTitle,
    menucaption: moduleTitle,
    purviewid: moduleKey,
    subsysid: selectedSubsystem?.subsysId,
    subsyscode: normalizeMenuCode(selectedSubsystem?.subsysCode ?? selectedSubsystem?.code),
    parentmenuid: activeFirstLevelMenu?.menuId,
    menuparentid: activeFirstLevelMenu?.menuId,
    parentid: activeFirstLevelMenu?.id,
    parentmenucode: parentMenuCode,
    parentmenustruct: parentMenuStruct,
    parentmenutitle: parentMenuTitle,
    menuparenttitle: parentMenuTitle,
    menuparentcode: parentMenuCode,
    menuparentstruct: parentMenuStruct,
    menulevel: 2,
    childlevel: 2,
  };
}

export function buildCreatedConfigMenu(options: {
  currentFirstLevelMenu?: Pick<BackendMenuNode, 'id' | 'menuId'> | null;
  currentSubsystem?: Pick<BackendSubsystemNode, 'subsysId' | 'subsysCode'> | null;
  moduleType: 'single-table' | 'bill';
  savedMenu: SubsystemMenuConfigDto;
}): BackendMenuNode {
  const {
    currentFirstLevelMenu,
    currentSubsystem,
    moduleType,
    savedMenu,
  } = options;
  const nextMenuId = Number(getMenuConfigField(savedMenu, 'menuid', 'menuId', 'Menuid', 'MenuId'));
  const nextUseflag = Number(getMenuConfigField(savedMenu, 'useflag', 'useFlag', 'Useflag', 'UseFlag') ?? 1);
  const nextMenuStruct = normalizeMenuCode(toDraftText(getMenuConfigField(savedMenu, 'menustruct', 'menuStruct', 'Menustruct', 'MenuStruct')));
  const nextMenuTitle = normalizeMenuTitle(toDraftText(getMenuConfigField(savedMenu, 'menucaption', 'menuCaption', 'Menucaption', 'MenuCaption'))) || '新建模块';
  const nextModuleKey = normalizeMenuCode(toDraftText(getMenuConfigField(savedMenu, 'purviewid', 'purviewId', 'Purviewid', 'PurviewId')));
  const nextSubsystemId = Number(getMenuConfigField(savedMenu, 'subsysid', 'subsysId', 'subsystemId', 'Subsysid', 'SubsysId', 'SubsystemId') ?? currentSubsystem?.subsysId ?? 0);
  const nextParentMenuId = Number(getMenuConfigField(savedMenu, 'parentmenuid', 'parentMenuId', 'Parentmenuid', 'ParentMenuId') ?? currentFirstLevelMenu?.menuId ?? -1);

  return {
    id: Number.isFinite(nextMenuId) && nextMenuId > 0 ? `menu:${nextMenuId}` : `draft:${moduleType}:${nextModuleKey || Date.now()}`,
    parentId: currentFirstLevelMenu?.id,
    nodeType: 'menu',
    title: nextMenuTitle,
    code: nextMenuStruct,
    moduleType,
    useflag: nextUseflag,
    subsysId: nextSubsystemId,
    subsysCode: currentSubsystem?.subsysCode,
    menuId: Number.isFinite(nextMenuId) && nextMenuId > 0 ? nextMenuId : undefined,
    parentMenuId: Number.isFinite(nextParentMenuId) ? nextParentMenuId : undefined,
    menuStruct: nextMenuStruct,
    purviewId: nextModuleKey,
    enabled: isUseflagEnabled(nextUseflag, true),
    children: [],
  };
}
