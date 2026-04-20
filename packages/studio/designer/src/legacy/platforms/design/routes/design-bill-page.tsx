import { useMemo, useState, useTransition } from 'react';

import type { DesignFixedRoute } from '../../../app/contracts/platform-routing';
import type { PlatformDefinition } from '../../../app/registry/platform-registry';
import { DesignFixedRouteShell } from '../design-fixed-route-shell';
import { getDesignRouteMeta } from '../design-route-meta';

type DesignBillPageProps = {
  currentPath: string;
  platform: PlatformDefinition;
  route: DesignFixedRoute;
};

type LayoutPresetKey = 'balanced' | 'dense' | 'guided';
type LegacyFieldType = 'number' | 'select' | 'text' | 'textarea';

type LegacyGroupDefinition = {
  accentClassName: string;
  chipClassName: string;
  controlType: number;
  description: string;
  id: string;
  name: string;
};

type LegacyControlField = {
  columnId: string;
  defaultValue: string;
  fieldName: string;
  fieldType: LegacyFieldType;
  groupId: string;
  hint: string;
  id: string;
  label: string;
  source: string;
  tabOrder: number;
};

type LayoutPresetDefinition = {
  defaultColumnCount: number;
  defaultRowSpace: number;
  description: string;
  hint: string;
  key: LayoutPresetKey;
  label: string;
};

type PreviewFieldLayout = LegacyControlField & {
  height: number;
  width: number;
  x: number;
  y: number;
};

type PreviewGroupLayout = LegacyGroupDefinition & {
  fields: PreviewFieldLayout[];
  height: number;
  rowSpace: number;
  width: number;
  x: number;
  y: number;
};

const STAGE_WIDTH = 760;
const STAGE_OFFSET_X = 24;
const STAGE_TOP_PADDING = 24;
const GROUP_GAP = 22;
const GROUP_HEADER_HEIGHT = 60;
const GROUP_PADDING_X = 20;
const GROUP_PADDING_BOTTOM = 22;
const GROUP_PADDING_TOP = 18;
const FIELD_GAP = 16;

const LAYOUT_PRESET_OPTIONS: LayoutPresetDefinition[] = [
  {
    key: 'balanced',
    label: '平衡布局',
    description: '保留右侧老设计的坐标感，同时把分组和字段层级拉清楚，适合日常配置。',
    hint: '推荐给大多数单据模块',
    defaultColumnCount: 2,
    defaultRowSpace: 14,
  },
  {
    key: 'dense',
    label: '紧凑生成',
    description: '优先减少滚动和空白区域，更适合一次性快速生成整页布局。',
    hint: '适合字段数量偏多时',
    defaultColumnCount: 3,
    defaultRowSpace: 10,
  },
  {
    key: 'guided',
    label: '引导操作',
    description: '把基础字段优先拉直展示，方便新人理解控件和分组框之间的关系。',
    hint: '适合培训和复核场景',
    defaultColumnCount: 2,
    defaultRowSpace: 18,
  },
];

const LEGACY_GROUPS: LegacyGroupDefinition[] = [
  {
    id: 'source',
    name: '方案布局',
    description: '对应 v_systemcontrolTab 和 p_systemControlLocation 的主控件信息。',
    controlType: 101,
    accentClassName: 'border-sky-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,249,255,0.94))] shadow-[0_20px_38px_-30px_rgba(14,165,233,0.35)]',
    chipClassName: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  {
    id: 'layout',
    name: '坐标尺寸',
    description: '把横纵坐标、宽高和栏位节奏拆出来，让一键布局可控。',
    controlType: 202,
    accentClassName: 'border-indigo-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(238,242,255,0.94))] shadow-[0_20px_38px_-30px_rgba(99,102,241,0.26)]',
    chipClassName: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  },
  {
    id: 'execute',
    name: '执行方案',
    description: '对应 p_systemcontrolColumn 的栏目和 RowSpace，让布局参数集中管理。',
    controlType: 303,
    accentClassName: 'border-amber-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,251,235,0.94))] shadow-[0_20px_38px_-30px_rgba(245,158,11,0.22)]',
    chipClassName: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  {
    id: 'label',
    name: '标签设置',
    description: '分组框、弹出框和保存表信息统一放在这里，减少来回切换。',
    controlType: 333,
    accentClassName: 'border-emerald-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,253,245,0.94))] shadow-[0_20px_38px_-30px_rgba(16,185,129,0.24)]',
    chipClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
];

const LEGACY_CONTROLS: LegacyControlField[] = [
  {
    id: 'formKey',
    label: '表单标识',
    fieldName: 'formKey',
    fieldType: 'text',
    groupId: 'source',
    hint: '来源 P_SystemDllTab 或 p_systembilltype.FormKey。',
    source: 'v_systemcontrolTab.formKey',
    defaultValue: 'FormKey',
    tabOrder: 10,
    columnId: 'C01',
  },
  {
    id: 'fieldName',
    label: '字段名',
    fieldName: 'fieldname',
    fieldType: 'text',
    groupId: 'source',
    hint: '控件真实字段，决定保存和回写。',
    source: 'v_systemcontrolTab.fieldname',
    defaultValue: '',
    tabOrder: 20,
    columnId: 'C01',
  },
  {
    id: 'userName',
    label: '用户名',
    fieldName: 'username',
    fieldType: 'text',
    groupId: 'source',
    hint: '右侧展示名称，适合直接给业务人员看。',
    source: 'v_systemcontrolTab.username',
    defaultValue: '',
    tabOrder: 30,
    columnId: 'C01',
  },
  {
    id: 'fieldTypeId',
    label: '控件类型',
    fieldName: 'fieldtypeid',
    fieldType: 'select',
    groupId: 'source',
    hint: '区分文本框、下拉框、多行文本等控件能力。',
    source: 'v_systemcontrolTab.fieldtypeid',
    defaultValue: '文本框',
    tabOrder: 40,
    columnId: 'C01',
  },
  {
    id: 'controlLeft',
    label: '横坐标',
    fieldName: 'controlLeft',
    fieldType: 'number',
    groupId: 'layout',
    hint: '决定控件起始横向位置。',
    source: 'p_systemControlLocation.controlLeft',
    defaultValue: '0',
    tabOrder: 50,
    columnId: 'C02',
  },
  {
    id: 'controlTop',
    label: '纵坐标',
    fieldName: 'controlTop',
    fieldType: 'number',
    groupId: 'layout',
    hint: '和分组框顶部、行间距联动。',
    source: 'p_systemControlLocation.controlTop',
    defaultValue: '0',
    tabOrder: 60,
    columnId: 'C02',
  },
  {
    id: 'controlWidth',
    label: '宽度',
    fieldName: 'controlWidth',
    fieldType: 'number',
    groupId: 'layout',
    hint: '默认 120，可配合一键布局自动调整。',
    source: 'p_systemControlLocation.controlWidth',
    defaultValue: '120',
    tabOrder: 70,
    columnId: 'C02',
  },
  {
    id: 'controlHeight',
    label: '高度',
    fieldName: 'controlHeight',
    fieldType: 'number',
    groupId: 'layout',
    hint: '默认 21，长文本建议放到更高行高。',
    source: 'p_systemControlLocation.controlHeight',
    defaultValue: '21',
    tabOrder: 80,
    columnId: 'C02',
  },
  {
    id: 'columnId',
    label: '栏目编号',
    fieldName: 'Column_Id',
    fieldType: 'text',
    groupId: 'execute',
    hint: '把字段挂到栏目上，方便整组生成。',
    source: 'p_systemcontrolColumn.Column_Id',
    defaultValue: 'C03',
    tabOrder: 90,
    columnId: 'C03',
  },
  {
    id: 'rowSpace',
    label: '行间距',
    fieldName: 'RowSpace',
    fieldType: 'number',
    groupId: 'execute',
    hint: '执行方案的关键参数，直接影响可读性。',
    source: 'p_systemcontrolColumn.RowSpace',
    defaultValue: '14',
    tabOrder: 100,
    columnId: 'C03',
  },
  {
    id: 'tabOrder',
    label: 'Tab 顺序',
    fieldName: 'tabOrder',
    fieldType: 'number',
    groupId: 'execute',
    hint: '保证键盘操作顺畅，不会来回跳。',
    source: 'p_systemControlLocation.tabOrder',
    defaultValue: '100',
    tabOrder: 110,
    columnId: 'C03',
  },
  {
    id: 'defaultValue',
    label: '默认值',
    fieldName: 'defaultValue',
    fieldType: 'textarea',
    groupId: 'execute',
    hint: '用于快速填充和默认布局策略。',
    source: 'p_systemControlLocation.defaultValue',
    defaultValue: '自动生成布局默认方案',
    tabOrder: 120,
    columnId: 'C03',
  },
  {
    id: 'groupName',
    label: '分组名称',
    fieldName: 'GroupName',
    fieldType: 'text',
    groupId: 'label',
    hint: '对应 p_systemAddGroup.GroupName。',
    source: 'p_systemAddGroup.GroupName',
    defaultValue: '基础信息',
    tabOrder: 130,
    columnId: 'C04',
  },
  {
    id: 'controlType',
    label: '分组框类型',
    fieldName: 'controlType',
    fieldType: 'select',
    groupId: 'label',
    hint: '333 代表分组框，适合可视化定位。',
    source: 'p_systemAddGroup.controlType',
    defaultValue: '333',
    tabOrder: 140,
    columnId: 'C04',
  },
  {
    id: 'parentWidth',
    label: '弹出框宽度',
    fieldName: 'parentWidth',
    fieldType: 'number',
    groupId: 'label',
    hint: '弹出框参数来自 p_systemControlParent。',
    source: 'p_systemControlParent.parentWidth',
    defaultValue: '820',
    tabOrder: 150,
    columnId: 'C04',
  },
  {
    id: 'parentHeight',
    label: '弹出框高度',
    fieldName: 'parentHeight',
    fieldType: 'number',
    groupId: 'label',
    hint: '配合分组框高度一起决定展示边界。',
    source: 'p_systemControlParent.parentHeight',
    defaultValue: '560',
    tabOrder: 160,
    columnId: 'C04',
  },
];

const LEGACY_SOURCE_SUMMARY = [
  {
    title: '右侧方案布局',
    tableName: 'v_systemcontrolTab + p_systemControlLocation',
    detail: '字段名、控件类型、默认值、坐标与栏目映射都从这里组合。',
  },
  {
    title: '右侧执行方案',
    tableName: 'p_systemcontrolColumn',
    detail: '一键布局重点使用 Column_Id、RowSpace 和整体范围尺寸。',
  },
  {
    title: '右侧标签设置',
    tableName: 'p_systemAddGroup + p_systemControlParent',
    detail: '分组框、弹出框和可视化标签都归这部分管理。',
  },
];

const SQL_SYNC_SCRIPT = `update p_systemwordbooktab
set
  controlleft = b.controlleft,
  controlTop = b.controlTop,
  controlHeight = b.controlHeight,
  controlWidth = b.controlWidth,
  tabOrder = b.tabOrder
from p_systemControlLocation b
where p_systemwordbooktab.formKey = b.formKey
  and p_systemwordbooktab.id = b.fieldId
  and b.formKey = 'formKey';`;

function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getPresetDefinition(presetKey: LayoutPresetKey) {
  return LAYOUT_PRESET_OPTIONS.find((item) => item.key === presetKey) ?? LAYOUT_PRESET_OPTIONS[0];
}

function resolveGroupOrder(presetKey: LayoutPresetKey) {
  switch (presetKey) {
    case 'dense':
      return ['source', 'execute', 'layout', 'label'];
    case 'guided':
      return ['source', 'layout', 'label', 'execute'];
    default:
      return ['source', 'layout', 'execute', 'label'];
  }
}

function resolveGroupColumnCount(presetKey: LayoutPresetKey, groupId: string, baseColumnCount: number) {
  const normalizedBase = clampValue(baseColumnCount, 1, 3);

  if (presetKey === 'guided' && groupId === 'source') {
    return 1;
  }

  if (presetKey === 'dense') {
    return groupId === 'label' ? Math.min(2, Math.max(1, normalizedBase)) : Math.min(3, Math.max(2, normalizedBase));
  }

  if (groupId === 'label') {
    return Math.min(2, normalizedBase);
  }

  return normalizedBase;
}

function resolveGroupRowSpace(presetKey: LayoutPresetKey, rowSpace: number) {
  if (presetKey === 'dense') {
    return clampValue(rowSpace - 2, 8, 20);
  }

  if (presetKey === 'guided') {
    return clampValue(rowSpace + 2, 10, 24);
  }

  return clampValue(rowSpace, 8, 24);
}

function buildPreviewGroups(presetKey: LayoutPresetKey, columnCount: number, rowSpace: number) {
  const groupOrder = resolveGroupOrder(presetKey);
  const normalizedRowSpace = resolveGroupRowSpace(presetKey, rowSpace);
  const stageWidth = STAGE_WIDTH - STAGE_OFFSET_X * 2;
  let currentTop = STAGE_TOP_PADDING;

  return groupOrder.map((groupId) => {
    const groupDefinition = LEGACY_GROUPS.find((item) => item.id === groupId) ?? LEGACY_GROUPS[0];
    const groupFields = LEGACY_CONTROLS.filter((field) => field.groupId === groupId);
    const groupColumnCount = resolveGroupColumnCount(presetKey, groupId, columnCount);
    const innerWidth = stageWidth - GROUP_PADDING_X * 2;
    const computedFieldWidth = Math.floor(
      (innerWidth - FIELD_GAP * Math.max(groupColumnCount - 1, 0)) / Math.max(groupColumnCount, 1),
    );

    let groupContentBottom = GROUP_HEADER_HEIGHT + GROUP_PADDING_TOP;

    const fieldLayouts = groupFields.map<PreviewFieldLayout>((field, index) => {
      const row = Math.floor(index / groupColumnCount);
      const column = index % groupColumnCount;
      const fieldHeight = field.fieldType === 'textarea' ? 110 : 72;
      const x = GROUP_PADDING_X + column * (computedFieldWidth + FIELD_GAP);
      const y = GROUP_HEADER_HEIGHT + GROUP_PADDING_TOP + row * (fieldHeight + normalizedRowSpace);

      groupContentBottom = Math.max(groupContentBottom, y + fieldHeight);

      return {
        ...field,
        height: fieldHeight,
        width: computedFieldWidth,
        x,
        y,
      };
    });

    const groupHeight = groupContentBottom + GROUP_PADDING_BOTTOM;
    const previewGroup: PreviewGroupLayout = {
      ...groupDefinition,
      fields: fieldLayouts,
      height: groupHeight,
      rowSpace: normalizedRowSpace,
      width: stageWidth,
      x: STAGE_OFFSET_X,
      y: currentTop,
    };

    currentTop += groupHeight + GROUP_GAP;
    return previewGroup;
  });
}

function renderControlShell(field: PreviewFieldLayout) {
  switch (field.fieldType) {
    case 'number':
      return (
        <div className="bill-designer-control-shell flex h-full items-center justify-between rounded-[14px] px-3 text-[12px] text-slate-500">
          <span>{field.defaultValue}</span>
          <span className="material-symbols-outlined text-[15px] text-slate-300">straighten</span>
        </div>
      );
    case 'select':
      return (
        <div className="bill-designer-control-shell flex h-full items-center justify-between rounded-[14px] px-3 text-[12px] text-slate-500">
          <span>{field.defaultValue}</span>
          <span className="material-symbols-outlined text-[16px] text-slate-300">expand_more</span>
        </div>
      );
    case 'textarea':
      return (
        <div className="bill-designer-control-shell flex h-full rounded-[14px] px-3 py-2 text-[12px] leading-5 text-slate-500">
          <span className="overflow-hidden">{field.defaultValue}</span>
        </div>
      );
    default:
      return (
        <div className="bill-designer-control-shell flex h-full items-center rounded-[14px] px-3 text-[12px] text-slate-500">
          <span>{field.defaultValue || '请输入内容'}</span>
        </div>
      );
  }
}

function formatPixelValue(value: number) {
  return `${Math.round(value)}px`;
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200/80 bg-white/88 px-4 py-4 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.22)]">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className={`mt-2 text-[22px] font-black tracking-tight ${tone}`}>{value}</div>
    </div>
  );
}

export function DesignBillPage({
  currentPath,
  platform,
  route,
}: DesignBillPageProps) {
  const routeMeta = getDesignRouteMeta('bill');
  const defaultPreset = getPresetDefinition('balanced');
  const [selectedPreset, setSelectedPreset] = useState<LayoutPresetKey>(defaultPreset.key);
  const [columnCount, setColumnCount] = useState(defaultPreset.defaultColumnCount);
  const [rowSpace, setRowSpace] = useState(defaultPreset.defaultRowSpace);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [focusedGroupId, setFocusedGroupId] = useState(resolveGroupOrder(defaultPreset.key)[0] ?? LEGACY_GROUPS[0].id);
  const [layoutRevision, setLayoutRevision] = useState(1);
  const [isPending, startTransition] = useTransition();

  const presetDefinition = getPresetDefinition(selectedPreset);
  const previewGroups = useMemo(
    () => buildPreviewGroups(selectedPreset, columnCount, rowSpace),
    [columnCount, rowSpace, selectedPreset],
  );

  const activeGroupId = previewGroups.some((group) => group.id === focusedGroupId)
    ? focusedGroupId
    : (previewGroups[0]?.id ?? '');
  const focusedGroup = previewGroups.find((group) => group.id === activeGroupId) ?? null;
  const lastGroup = previewGroups[previewGroups.length - 1] ?? null;
  const canvasHeight = lastGroup ? lastGroup.y + lastGroup.height + 28 : 420;
  const moduleCode = route.context.moduleCode?.trim() || '';

  if (!routeMeta) {
    return null;
  }

  const handlePresetSelect = (presetKey: LayoutPresetKey) => {
    const nextPreset = getPresetDefinition(presetKey);

    startTransition(() => {
      setSelectedPreset(nextPreset.key);
      setColumnCount(nextPreset.defaultColumnCount);
      setRowSpace(nextPreset.defaultRowSpace);
      setFocusedGroupId(resolveGroupOrder(nextPreset.key)[0] ?? LEGACY_GROUPS[0].id);
      setLayoutRevision((current) => current + 1);
    });
  };

  const handleGenerateLayout = () => {
    startTransition(() => {
      setLayoutRevision((current) => current + 1);
      setFocusedGroupId(resolveGroupOrder(selectedPreset)[0] ?? LEGACY_GROUPS[0].id);
    });
  };

  const handleResetLayout = () => {
    startTransition(() => {
      setSelectedPreset(defaultPreset.key);
      setColumnCount(defaultPreset.defaultColumnCount);
      setRowSpace(defaultPreset.defaultRowSpace);
      setShowCoordinates(true);
      setFocusedGroupId(resolveGroupOrder(defaultPreset.key)[0] ?? LEGACY_GROUPS[0].id);
      setLayoutRevision(1);
    });
  };

  return (
    <DesignFixedRouteShell
      currentPath={currentPath}
      currentRouteKey="bill"
      eyebrow="布局设计"
      platform={platform}
      routeMeta={routeMeta}
    >
      <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="rounded-[28px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,250,252,0.82))] p-6 shadow-[0_28px_54px_-36px_rgba(15,23,42,0.32)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">快速设计</div>
              <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">布局设计台</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                先把分组、坐标、栏目和标签设计放在同一页里，保证能看、能调、能继续往保存逻辑接。
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-500">
              版本 {layoutRevision.toString().padStart(2, '0')}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetricCard label="数据来源" tone="text-sky-600" value="3 块" />
            <MetricCard label="控件定义" tone="text-indigo-600" value={`${LEGACY_CONTROLS.length} 项`} />
            <MetricCard label="分组框类型" tone="text-emerald-600" value="333" />
            <MetricCard label="同步修正" tone="text-amber-600" value="必执行" />
          </div>

          <div className="mt-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">布局预设</div>
            <div className="mt-3 space-y-3">
              {LAYOUT_PRESET_OPTIONS.map((option) => {
                const isActive = option.key === selectedPreset;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handlePresetSelect(option.key)}
                    className={`w-full rounded-[22px] border px-4 py-4 text-left transition-all ${
                      isActive
                        ? 'border-primary/20 bg-primary/10 shadow-[0_22px_36px_-30px_rgba(37,99,235,0.45)]'
                        : 'border-slate-200/80 bg-white/84 hover:border-primary/20 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[14px] font-bold text-slate-900">{option.label}</div>
                        <div className="mt-2 text-[12px] leading-6 text-slate-600">{option.description}</div>
                      </div>
                      <span className="rounded-full border border-white/70 bg-white/86 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {option.hint}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200/80 bg-white/84 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">生成参数</div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[12px] font-semibold text-slate-700">每行列数</label>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                    {columnCount} 列
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  value={columnCount}
                  onChange={(event) => setColumnCount(Number(event.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer accent-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[12px] font-semibold text-slate-700">行间距</label>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                    {rowSpace}px
                  </span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={24}
                  value={rowSpace}
                  onChange={(event) => setRowSpace(Number(event.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer accent-primary"
                />
              </div>

              <label className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                <div>
                  <div className="text-[12px] font-semibold text-slate-800">显示坐标提示</div>
                  <div className="mt-1 text-[11px] leading-5 text-slate-500">方便核对 controlLeft / controlTop / 宽高。</div>
                </div>
                <input
                  type="checkbox"
                  checked={showCoordinates}
                  onChange={(event) => setShowCoordinates(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerateLayout}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/20 bg-primary px-4 text-[12px] font-bold text-white shadow-[0_18px_30px_-24px_rgba(37,99,235,0.6)] transition-colors hover:bg-blue-700"
              >
                <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
                一键生成布局
              </button>
              <button
                type="button"
                onClick={handleResetLayout}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[12px] font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                恢复推荐值
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">旧定义拆分结果</div>
            <div className="mt-4 space-y-3">
              {LEGACY_SOURCE_SUMMARY.map((item) => (
                <div key={item.title} className="rounded-[18px] border border-white/80 bg-white/90 px-4 py-3">
                  <div className="text-[13px] font-bold text-slate-900">{item.title}</div>
                  <div className="mt-1 font-mono text-[11px] text-slate-500">{item.tableName}</div>
                  <div className="mt-2 text-[12px] leading-6 text-slate-600">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,248,252,0.84))] p-6 shadow-[0_28px_54px_-36px_rgba(15,23,42,0.32)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">可视化预览</div>
              <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">分组和一键布局结果</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                这里把旧表结构直接翻成可操作的右侧设计稿，重点看分组、字段顺序和整体节奏，不再只盯 SQL。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary">
                {presetDefinition.label}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500">
                {moduleCode ? `模块 ${moduleCode}` : '未带入模块编码'}
              </span>
              {isPending ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700">
                  生成中
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {previewGroups.map((group) => {
              const isActive = group.id === activeGroupId;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setFocusedGroupId(group.id)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all ${
                    isActive
                      ? `${group.chipClassName} shadow-[0_16px_28px_-22px_rgba(15,23,42,0.24)]`
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {group.name}
                </button>
              );
            })}
          </div>

          <div className="mt-6 overflow-x-auto rounded-[30px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_26%),linear-gradient(180deg,rgba(247,250,252,0.94),rgba(255,255,255,0.92))] p-4">
            <div
              className="cloudy-cloud-grid relative mx-auto rounded-[28px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(244,248,255,0.82))] shadow-[0_34px_76px_-52px_rgba(15,23,42,0.38)]"
              style={{ height: canvasHeight, minWidth: STAGE_WIDTH, width: STAGE_WIDTH }}
            >
              <div className="absolute left-6 top-5 flex items-center gap-3 rounded-full border border-white/80 bg-white/86 px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.18)]">
                <span className="material-symbols-outlined text-[15px] text-primary">space_dashboard</span>
                右侧方案布局预览
              </div>

              {previewGroups.map((group) => {
                const isActive = group.id === activeGroupId;

                return (
                  <section
                    key={group.id}
                    className={`absolute overflow-hidden rounded-[26px] border transition-all ${group.accentClassName} ${
                      isActive ? 'ring-2 ring-primary/25' : ''
                    }`}
                    style={{
                      height: group.height,
                      left: group.x,
                      top: group.y,
                      width: group.width,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setFocusedGroupId(group.id)}
                      className="flex w-full items-start justify-between gap-3 border-b border-white/70 px-5 py-4 text-left"
                    >
                      <div>
                        <div className="text-[15px] font-bold text-slate-900">{group.name}</div>
                        <div className="mt-1 text-[12px] leading-6 text-slate-600">{group.description}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${group.chipClassName}`}>
                          controlType {group.controlType}
                        </span>
                        <span className="rounded-full border border-white/80 bg-white/88 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                          {group.fields.length} 项
                        </span>
                      </div>
                    </button>

                    {group.fields.map((field) => (
                      <div
                        key={field.id}
                        className="absolute"
                        style={{
                          height: field.height,
                          left: field.x,
                          top: field.y,
                          width: field.width,
                        }}
                      >
                        <div className="bill-designer-field h-full rounded-[20px] border border-white/75 bg-white/92 p-3 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.22)]">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                {field.fieldName}
                              </div>
                              <div className="mt-1 truncate text-[13px] font-semibold text-slate-900">{field.label}</div>
                            </div>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                              #{field.tabOrder}
                            </span>
                          </div>

                          <div className={`mt-3 ${field.fieldType === 'textarea' ? 'h-[46px]' : 'h-[34px]'}`}>
                            {renderControlShell(field)}
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                            <span className="truncate">{field.columnId}</span>
                            <span className="truncate">{field.source}</span>
                          </div>

                          {showCoordinates ? (
                            <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700">
                              <span className="truncate">
                                {`x ${formatPixelValue(group.x + field.x)} · y ${formatPixelValue(group.y + field.y)} · w ${formatPixelValue(field.width)} · h ${formatPixelValue(field.height)}`}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </section>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,250,252,0.82))] p-6 shadow-[0_28px_54px_-36px_rgba(15,23,42,0.32)] xl:col-span-2">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">执行与标签</div>
          <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">分组参数面板</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            右侧把分组框参数、执行方案和最终固定执行语句放在一起，方便你确认旧逻辑没有丢。
          </p>

          {focusedGroup ? (
            <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-[0_20px_38px_-30px_rgba(15,23,42,0.22)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">当前聚焦分组</div>
                  <div className="mt-2 text-[18px] font-bold text-slate-900">{focusedGroup.name}</div>
                  <div className="mt-2 text-[12px] leading-6 text-slate-600">{focusedGroup.description}</div>
                </div>
                <span className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${focusedGroup.chipClassName}`}>
                  controlType {focusedGroup.controlType}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">分组位置</div>
                  <div className="mt-2 text-[13px] font-semibold text-slate-800">
                    {formatPixelValue(focusedGroup.x)} / {formatPixelValue(focusedGroup.y)}
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">分组尺寸</div>
                  <div className="mt-2 text-[13px] font-semibold text-slate-800">
                    {formatPixelValue(focusedGroup.width)} / {formatPixelValue(focusedGroup.height)}
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">栏目密度</div>
                  <div className="mt-2 text-[13px] font-semibold text-slate-800">{focusedGroup.fields.length} 项</div>
                </div>
                <div className="rounded-[18px] border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">执行行距</div>
                  <div className="mt-2 text-[13px] font-semibold text-slate-800">{focusedGroup.rowSpace}px</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-white/88 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">标签设置清单</div>
            <div className="mt-4 space-y-3">
              {previewGroups.map((group) => (
                <div key={group.id} className="rounded-[18px] border border-slate-200/80 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[13px] font-bold text-slate-900">{group.name}</div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${group.chipClassName}`}>
                      {group.controlType}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] leading-6 text-slate-500">
                    GroupName: {group.name} · controlLeft: {Math.round(group.x)} · controlTop: {Math.round(group.y)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-white/88 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">执行方案概览</div>
            <div className="mt-4 space-y-3">
              {previewGroups.map((group, index) => (
                <div key={group.id} className="rounded-[18px] border border-slate-200/80 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[13px] font-bold text-slate-900">{`栏目 ${index + 1}`}</div>
                    <div className="font-mono text-[11px] text-slate-500">{group.fields[0]?.columnId ?? 'C00'}</div>
                  </div>
                  <div className="mt-2 text-[12px] leading-6 text-slate-600">
                    RowSpace {group.rowSpace}px，建议把 {group.fields.length} 个字段统一落在同一组配置里，避免手工改坐标时漏项。
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-white/88 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">固定执行 SQL</div>
            <div className="mt-3 rounded-[18px] border border-slate-200/80 bg-slate-950 p-4">
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-6 text-slate-100">
                {SQL_SYNC_SCRIPT}
              </pre>
            </div>
            <div className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-6 text-amber-800">
              所有涉及控件坐标、宽高和 Tab 顺序的修改，生成后都应该回写这一段同步语句，避免设计页和保存表不一致。
            </div>
          </div>
        </section>
      </div>
    </DesignFixedRouteShell>
  );
}
