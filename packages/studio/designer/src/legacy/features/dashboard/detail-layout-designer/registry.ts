import type { DetailLayoutItemType, DetailLayoutPaletteItem, DetailLayoutRegistryItem } from './types';

export const DETAIL_LAYOUT_REGISTRY: Record<DetailLayoutItemType, DetailLayoutRegistryItem> = {
  input: {
    type: 'input',
    label: '单行输入',
    description: '常规文本字段。',
    defaultTitle: '文本输入',
    defaultField: 'text_field',
    defaultSize: { w: 180, h: 56 },
    supportsField: true,
    isContainer: false,
  },
  select: {
    type: 'select',
    label: '下拉选择',
    description: '适合枚举或状态字段。',
    defaultTitle: '下拉选择',
    defaultField: 'select_field',
    defaultSize: { w: 180, h: 56 },
    supportsField: true,
    isContainer: false,
  },
  date: {
    type: 'date',
    label: '日期',
    description: '适合日期或时间字段。',
    defaultTitle: '日期选择',
    defaultField: 'date_field',
    defaultSize: { w: 180, h: 56 },
    supportsField: true,
    isContainer: false,
  },
  number: {
    type: 'number',
    label: '数字',
    description: '适合数量、金额等数值字段。',
    defaultTitle: '数字输入',
    defaultField: 'number_field',
    defaultSize: { w: 180, h: 56 },
    supportsField: true,
    isContainer: false,
  },
  textarea: {
    type: 'textarea',
    label: '多行文本',
    description: '适合备注和长文本内容。',
    defaultTitle: '多行文本',
    defaultField: 'textarea_field',
    defaultSize: { w: 220, h: 120 },
    supportsField: true,
    isContainer: false,
  },
  label: {
    type: 'label',
    label: '标签',
    description: '纯展示型说明文本。',
    defaultTitle: '说明标签',
    defaultSize: { w: 180, h: 40 },
    supportsField: false,
    isContainer: false,
  },
  button: {
    type: 'button',
    label: '按钮',
    description: '用于动作入口占位。',
    defaultTitle: '操作按钮',
    defaultSize: { w: 120, h: 44 },
    supportsField: false,
    isContainer: false,
  },
  groupbox: {
    type: 'groupbox',
    label: '分组框',
    description: '详情区域内的容器分组。',
    defaultTitle: '信息分组',
    defaultSize: { w: 360, h: 240 },
    supportsField: false,
    isContainer: true,
  },
};

export function createDetailLayoutPaletteItem(
  type: DetailLayoutItemType,
  overrides: Partial<DetailLayoutPaletteItem> = {},
): DetailLayoutPaletteItem {
  const registryItem = DETAIL_LAYOUT_REGISTRY[type];
  return {
    id: overrides.id ?? type,
    type,
    label: overrides.label ?? registryItem.label,
    description: overrides.description ?? registryItem.description,
    defaultSize: overrides.defaultSize ?? registryItem.defaultSize,
    template: overrides.template,
  };
}

export const DETAIL_LAYOUT_PALETTE_ITEMS = Object.values(DETAIL_LAYOUT_REGISTRY).map((item) => (
  createDetailLayoutPaletteItem(item.type)
));

export function getDetailLayoutRegistryItem(type: DetailLayoutItemType) {
  return DETAIL_LAYOUT_REGISTRY[type];
}
