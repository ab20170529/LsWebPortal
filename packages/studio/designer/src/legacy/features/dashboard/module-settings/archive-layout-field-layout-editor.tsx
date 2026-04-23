import React from 'react';
import {
  AutoScrollActivator,
  closestCenter,
  DndContext,
  DragOverlay,
  getFirstCollision,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type CollisionDetection,
  type Modifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { CalendarDays, ChevronDown, Search } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '../../../lib/utils';
import type { DetailLayoutDocument, DetailLayoutFieldOption, DetailLayoutItem } from '../detail-layout-designer/types';
import { createEmptyDetailLayoutDocument } from '../detail-layout-designer/utils/layout';
import {
  DASHBOARD_DRAG_MOTION_BASE_MS,
  DASHBOARD_DRAG_MOTION_EASING,
  DesignerWorkbenchDraggableItem,
  DesignerWorkbenchDropLane,
} from '../dashboard-workbench-dnd';
import type {
  ArchiveLayoutScheme,
  ArchiveLayoutSchemeFieldDefaults,
} from './detail-board-layout-designer-adapter';
import {
  ARCHIVE_LAYOUT_PREVIEW_WIDTH_MAX as PREVIEW_WIDTH_MAX,
  ARCHIVE_LAYOUT_PREVIEW_WIDTH_MIN as PREVIEW_WIDTH_MIN,
  countArchiveLayoutSchemeFields as countSchemeFields,
  createArchiveLayoutSchemeGroupId as createSchemeGroupId,
  createArchiveLayoutSchemeId as createSchemeId,
  createEmptyArchiveLayoutScheme as createEmptyScheme,
  normalizeArchiveLayoutPreviewWorkbenchWidth as normalizePreviewWorkbenchWidth,
} from './archive-layout-scheme-workbench-utils';
import {
  BILL_FORM_DEFAULT_WIDTH,
  BILL_FORM_MAX_WIDTH,
  BILL_FORM_MIN_CONTROL_HEIGHT,
  BILL_FORM_MIN_WIDTH,
  BILL_FORM_WORKBENCH_LAYOUT_GAP_X,
  BILL_FORM_WORKBENCH_LAYOUT_GAP_Y,
  BILL_FORM_WORKBENCH_LAYOUT_PADDING_X,
  BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y,
  BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT,
  alignBillHeaderFieldsToFlowLayout,
  getBillHeaderFieldHeight,
  getBillHeaderFieldShellHeight,
  getBillHeaderFieldWidth,
} from './dashboard-bill-form-layout-utils';
import { useArchiveLayoutSchemeWorkbench } from './use-archive-layout-scheme-workbench';

const SURFACE_CLASS = 'rounded-[22px] border border-[#dbe6f1] bg-[linear-gradient(180deg,#fbfdff_0%,#f4f8fc_100%)] shadow-[0_18px_42px_-40px_rgba(15,23,42,0.18)]';
const GROUP_HEADER_HEIGHT = 42;
const GROUP_GAP = 10;
const GROUP_MIN_HEIGHT = 176;
const GROUP_MIN_WIDTH = 880;
const GROUP_DEFAULT_ROWS = 1;
const DEFAULT_GROUP_TITLE = '未分组字段';
const DASHBOARD_DRAG_FEEDBACK_SAME_ROW_HYSTERESIS_MS = 56;
const DASHBOARD_DRAG_FEEDBACK_CROSS_ROW_HYSTERESIS_MS = 72;
const DASHBOARD_DRAG_FEEDBACK_VISUAL_ENTER_MS = 24;
const DASHBOARD_DRAG_FEEDBACK_VISUAL_EXIT_MS = 34;
const DASHBOARD_DRAG_FEEDBACK_LOCK_MS = 64;
const DASHBOARD_DRAG_FEEDBACK_LOCK_MOTION_EXTRA_MS = 26;
const DASHBOARD_DRAG_FEEDBACK_VISUAL_DELAY_MOTION_EXTRA_MS = 18;
const DASHBOARD_DRAG_FEEDBACK_MOTION_EXTRA_MS = 44;
const DASHBOARD_DRAG_FEEDBACK_SETTLE_MS = 96;
const DASHBOARD_DRAG_FEEDBACK_END_SETTLE_MS = 104;
const DASHBOARD_DRAG_FEEDBACK_CANCEL_SETTLE_MS = 88;
const PREVIEW_WIDTH_PRESETS = [
  { key: 'compact' as const, label: '紧凑', value: 880 },
  { key: 'standard' as const, label: '标准', value: 1080 },
  { key: 'full' as const, label: '最大', value: PREVIEW_WIDTH_MAX },
];
type ArchiveLayoutFieldLayoutEditorProps = {
  buildSchemeDocument: (scheme: ArchiveLayoutScheme, previewWorkbenchWidth?: number) => DetailLayoutDocument;
  document: DetailLayoutDocument;
  fieldOptions: DetailLayoutFieldOption[];
  getDefaultSize: (field: Record<string, any>) => { h: number; w: number };
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  onDocumentChange: (document: DetailLayoutDocument) => void;
  onSchemesChange: (schemes: ArchiveLayoutScheme[]) => void;
  renderFieldPreview: (column: Record<string, any>, index: number, scope: string) => React.ReactNode;
  schemes: ArchiveLayoutScheme[];
  suggestedScheme: ArchiveLayoutScheme;
};

type FlowDraft = DetailLayoutItem & {
  panelOrder: number;
  panelRow: number;
};

type ArchiveLayoutGroupViewModel = {
  fields: FlowDraft[];
  group: DetailLayoutItem;
};
type ArchiveLayoutGroupRowViewModel = {
  fields: FlowDraft[];
  rowNumber: number;
};
type ArchiveLayoutWorkbenchGroupRenderModel = {
  group: ArchiveLayoutGroupViewModel;
  laneMinHeight: number;
  rows: ArchiveLayoutGroupRowViewModel[];
};
type ArchiveLayoutWorkbenchFieldRenderModel = {
  displayTitle: string;
  field: FlowDraft;
  normalizedField: Record<string, any>;
  previewHeight: number;
  shellHeight: number;
  width: number;
};

type SelectedFieldContext = {
  field: FlowDraft;
  group: ArchiveLayoutGroupViewModel;
};

type FieldDropTarget = {
  beforeId: string | null;
  groupId: string;
  mode: 'standard' | 'row';
  rowNumber: number | null;
};

type FieldDragData = { fieldId: string; groupId: string; type: 'archive-field' };
type GroupDragData = { groupId: string; type: 'archive-group' };
type FieldInsertDropData = { beforeId: string | null; groupId: string; type: 'archive-field-insert' };
type FieldRowDropData = { beforeId: string | null; groupId: string; rowNumber: number; type: 'archive-field-row' };
type FieldSizeInputDraft = { fieldId: string | null; h: string; w: string };
type WidthPreset = 'compact' | 'standard' | 'full';
type HeightPreset = 'single' | 'comfortable' | 'expanded';
type FieldResizeState = {
  dimension: 'h' | 'w';
  fieldId: string;
  startHeight: number;
  startMouseX: number;
  startMouseY: number;
  startWidth: number;
};
type FieldResizePreview = {
  fieldId: string;
  h: number;
  w: number;
};
type SidebarTabKey = 'fields' | 'structure' | 'schemes';
type GroupedPlacedField = {
  groupId: string;
  option: DetailLayoutFieldOption;
};

const SIDEBAR_TABS: Array<{ key: SidebarTabKey; label: string }> = [
  { key: 'fields', label: '字段池' },
  { key: 'structure', label: '当前结构' },
  { key: 'schemes', label: '已有方案' },
];

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function areFieldDropTargetsEqual(left: FieldDropTarget | null, right: FieldDropTarget | null) {
  return (
    left?.beforeId === right?.beforeId
    && left?.groupId === right?.groupId
    && left?.mode === right?.mode
    && left?.rowNumber === right?.rowNumber
  );
}

function buildSchemeFromCurrentLayout(groups: ArchiveLayoutGroupViewModel[]): ArchiveLayoutScheme {
  const fieldDefaults = groups.reduce<Record<string, ArchiveLayoutSchemeFieldDefaults>>((result, group) => {
    group.fields.forEach((field) => {
      if (!field.field) {
        return;
      }
      result[String(field.field)] = {
        h: Number(field.h) || undefined,
        w: Number(field.w) || undefined,
      };
    });
    return result;
  }, {});

  const layoutGroups = groups.map((group, groupIndex) => ({
    fieldIds: group.fields
      .slice()
      .sort((left, right) => (left.panelRow - right.panelRow) || (left.panelOrder - right.panelOrder) || (left.y - right.y) || (left.x - right.x))
      .map((field) => String(field.field || ''))
      .filter(Boolean),
    id: createSchemeGroupId(`archive_layout_from_layout_group_${groupIndex + 1}`),
    name: String(group.group.title || `信息分组 ${groupIndex + 1}`).trim() || `信息分组 ${groupIndex + 1}`,
  })).filter((group) => group.fieldIds.length > 0);

  return {
    fieldDefaults,
    groups: layoutGroups.length > 0 ? layoutGroups : createEmptyScheme().groups,
    id: createSchemeId('archive_layout_from_layout'),
    name: '当前布局方案',
    previewWorkbenchWidth: undefined,
  };
}

function getPreviewWorkbenchWidthFromDocument(document: DetailLayoutDocument) {
  const firstGroup = buildGroupOrder(document)[0];
  if (!firstGroup?.w) {
    return GROUP_MIN_WIDTH;
  }
  return normalizePreviewWorkbenchWidth(firstGroup.w);
}

function getGroupFlowUsableWidth(groupWidth: number) {
  return Math.max(BILL_FORM_MIN_WIDTH, groupWidth - BILL_FORM_WORKBENCH_LAYOUT_PADDING_X * 2);
}

function parseArchiveFieldDragId(id: unknown) {
  if (typeof id !== 'string') {
    return null;
  }
  return id.startsWith('archive-field:') ? id.slice('archive-field:'.length) : null;
}

function getClientPointFromActivatorEvent(event: Event | undefined) {
  if (!event) {
    return null;
  }
  if ('clientX' in event && 'clientY' in event) {
    return {
      x: Number(event.clientX),
      y: Number(event.clientY),
    };
  }
  if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent && event.touches.length > 0) {
    return {
      x: Number(event.touches[0]?.clientX ?? 0),
      y: Number(event.touches[0]?.clientY ?? 0),
    };
  }
  return null;
}

function parseCommittedNumber(rawValue: string, fallback: number, min: number, max: number) {
  const normalizedValue = rawValue.trim();
  if (!normalizedValue) {
    return fallback;
  }
  const parsedValue = Number(normalizedValue);
  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }
  return clampNumber(parsedValue, min, max);
}

function sortItems(items: DetailLayoutItem[]) {
  return items.slice().sort((left, right) => (left.y - right.y) || (left.x - right.x));
}

function getFieldOptionMap(fieldOptions: DetailLayoutFieldOption[]) {
  return new Map(fieldOptions.map((item) => [String(item.value), item]));
}

function buildGroupOrder(document: DetailLayoutDocument) {
  return sortItems(document.items.filter((item) => item.type === 'groupbox'));
}

function buildDrafts(items: DetailLayoutItem[]) {
  const sorted = sortItems(items.filter((item) => item.type !== 'groupbox' && item.field));
  const rowAnchors = Array.from(new Set(sorted.map((item) => item.y))).sort((left, right) => left - right);
  const orderByRow = new Map<number, number>();
  return sorted.map((item) => {
    const row = Math.max(1, rowAnchors.indexOf(item.y) + 1);
    const nextOrder = (orderByRow.get(row) ?? 0) + 1;
    orderByRow.set(row, nextOrder);
    return { ...item, panelOrder: nextOrder, panelRow: row };
  });
}

function sortDraftsForFlow<T extends FlowDraft>(drafts: T[]) {
  return drafts
    .slice()
    .sort((left, right) => (left.panelRow - right.panelRow) || (left.panelOrder - right.panelOrder) || (left.y - right.y) || (left.x - right.x));
}

function normalizeDrafts<T extends FlowDraft>(drafts: T[]): T[] {
  return reindexDrafts(sortDraftsForFlow(drafts));
}

function reindexDrafts<T extends FlowDraft>(drafts: T[]): T[] {
  const normalizedDrafts = drafts.map((item) => ({
    ...item,
    panelRow: Math.max(1, Math.round(Number(item.panelRow) || 1)),
  }));
  const rowNumbers = Array.from(new Set(normalizedDrafts.map((item) => item.panelRow))).sort((left, right) => left - right);
  const rowMap = new Map(rowNumbers.map((rowNumber, index) => [rowNumber, index + 1]));
  const orderByRow = new Map<number, number>();

  return normalizedDrafts.map((item) => {
    const nextRow = rowMap.get(item.panelRow) ?? 1;
    const nextOrder = (orderByRow.get(nextRow) ?? 0) + 1;
    orderByRow.set(nextRow, nextOrder);
    return {
      ...item,
      panelOrder: nextOrder,
      panelRow: nextRow,
    };
  });
}

function getDisplayTitle(item: DetailLayoutItem, fieldOption?: DetailLayoutFieldOption, rawField?: Record<string, any>) {
  return String(item.title || fieldOption?.title || rawField?.name || fieldOption?.label || item.field || '字段').trim();
}

function getFieldWidthPresetValue(preset: WidthPreset, usableWidth: number) {
  if (preset === 'compact') {
    return clampNumber(Math.round((usableWidth - BILL_FORM_WORKBENCH_LAYOUT_GAP_X) / 2), BILL_FORM_MIN_WIDTH, BILL_FORM_MAX_WIDTH);
  }
  if (preset === 'full') {
    return clampNumber(usableWidth, BILL_FORM_MIN_WIDTH, BILL_FORM_MAX_WIDTH);
  }
  return clampNumber(BILL_FORM_DEFAULT_WIDTH, BILL_FORM_MIN_WIDTH, BILL_FORM_MAX_WIDTH);
}

function stabilizeDocument(
  document: DetailLayoutDocument,
  fieldOptions: DetailLayoutFieldOption[],
  getDefaultSize: (field: Record<string, any>) => { h: number; w: number },
  draftOverrides?: Map<string, FlowDraft[]>,
  preferredGroupOrder?: string[],
  previewWorkbenchWidth: number = GROUP_MIN_WIDTH,
) {
  const normalizedPreviewWidth = normalizePreviewWorkbenchWidth(previewWorkbenchWidth);
  const groupFlowUsableWidth = getGroupFlowUsableWidth(normalizedPreviewWidth);
  const optionMap = getFieldOptionMap(fieldOptions);
  const sourceGroups = buildGroupOrder(document);
  const sourceFields = document.items.filter((item) => item.type !== 'groupbox' && item.field);
  if (sourceGroups.length === 0 && sourceFields.length === 0) {
    return createEmptyDetailLayoutDocument({
      gridSize: document.gridSize,
      items: [],
    });
  }
  const fallbackGroup: DetailLayoutItem = {
    h: GROUP_MIN_HEIGHT,
    id: 'archive_layout_group_default',
    type: 'groupbox',
    w: normalizedPreviewWidth,
    x: 24,
    y: 24,
    title: DEFAULT_GROUP_TITLE,
  };
  (fallbackGroup as DetailLayoutItem & { rows?: number }).rows = GROUP_DEFAULT_ROWS;
  const groups = sourceGroups.length > 0 ? sourceGroups : [fallbackGroup];
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const groupIds = preferredGroupOrder?.filter((id) => groups.some((group) => group.id === id)) ?? groups.map((group) => group.id);
  const groupOrder = groupIds
    .map((id) => groupById.get(id))
    .filter((group): group is DetailLayoutItem => Boolean(group));
  const childrenByParent = new Map<string | null, DetailLayoutItem[]>();

  sourceFields.forEach((item) => {
    const parentId = item.parentId ?? null;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(item);
    childrenByParent.set(parentId, siblings);
  });

  if ((childrenByParent.get(null) ?? []).length > 0) {
    const firstGroup = groupOrder[0] ?? fallbackGroup;
    childrenByParent.set(firstGroup.id, [...(childrenByParent.get(firstGroup.id) ?? []), ...(childrenByParent.get(null) ?? [])]);
    childrenByParent.delete(null);
  }

  let nextGroupY = 24;
  const nextItems: DetailLayoutItem[] = [];

  groupOrder.forEach((group, groupIndex) => {
    const rawDrafts = draftOverrides?.get(group.id) ?? buildDrafts(childrenByParent.get(group.id) ?? []);
    const preparedDrafts = normalizeDrafts(rawDrafts).map((item) => {
      const fieldOption = optionMap.get(String(item.field ?? ''));
      const defaultSize = fieldOption ? getDefaultSize(fieldOption.rawField as Record<string, any>) : { h: BILL_FORM_MIN_CONTROL_HEIGHT, w: BILL_FORM_DEFAULT_WIDTH };
      return {
        ...item,
        resolvedHeight: clampNumber(item.h || defaultSize.h, BILL_FORM_MIN_CONTROL_HEIGHT, 160),
        resolvedWidth: clampNumber(item.w || defaultSize.w, BILL_FORM_MIN_WIDTH, Math.min(BILL_FORM_MAX_WIDTH, groupFlowUsableWidth)),
      };
    });
    const drafts = reindexDrafts(preparedDrafts);
    const aligned = alignBillHeaderFieldsToFlowLayout(
      drafts.map((item) => {
        const fieldOption = optionMap.get(String(item.field ?? ''));
        const rawField = (fieldOption?.rawField ?? {}) as Record<string, any>;
        return {
          controlHeight: item.resolvedHeight,
          id: item.id,
          name: getDisplayTitle(item, fieldOption, rawField),
          panelOrder: item.panelOrder,
          panelRow: item.panelRow,
          width: item.resolvedWidth,
        };
      }),
      {
        defaultHeight: BILL_FORM_MIN_CONTROL_HEIGHT,
        defaultWidth: BILL_FORM_DEFAULT_WIDTH,
        gapX: BILL_FORM_WORKBENCH_LAYOUT_GAP_X,
        gapY: BILL_FORM_WORKBENCH_LAYOUT_GAP_Y,
        layoutPaddingX: BILL_FORM_WORKBENCH_LAYOUT_PADDING_X,
        layoutPaddingY: BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y,
        maxWidth: BILL_FORM_MAX_WIDTH,
        minRowHeight: BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT,
        minWidth: BILL_FORM_MIN_WIDTH,
      },
    ) as Array<{ canvasX?: number; canvasY?: number; controlHeight?: number; id: string; width?: number }>;

    const alignedMap = new Map(aligned.map((item) => [item.id, item]));
    const childItems = drafts.map((item) => {
      const alignedItem = alignedMap.get(item.id);
      return {
        ...item,
        h: alignedItem ? getBillHeaderFieldHeight(alignedItem) : item.h,
        parentId: group.id,
        w: alignedItem ? getBillHeaderFieldWidth(alignedItem) : item.w,
        x: alignedItem?.canvasX ?? BILL_FORM_WORKBENCH_LAYOUT_PADDING_X,
        y: alignedItem?.canvasY ?? BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y,
      };
    });

    const bodyHeight = childItems.reduce((max, item) => {
      const shellHeight = getBillHeaderFieldShellHeight({ controlHeight: item.h, width: item.w });
      return Math.max(max, item.y + shellHeight);
    }, BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y + BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT);
    const actualRowCount = Math.max(1, drafts.reduce((max, item) => Math.max(max, item.panelRow), 1));
    const desiredRowCount = Math.max(actualRowCount, Number((group as DetailLayoutItem & { rows?: number }).rows) || 0);
    const desiredBodyHeight = BILL_FORM_WORKBENCH_LAYOUT_PADDING_Y
      + desiredRowCount * BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT
      + Math.max(0, desiredRowCount - 1) * BILL_FORM_WORKBENCH_LAYOUT_GAP_Y;
    const groupHeight = Math.max(GROUP_MIN_HEIGHT, Math.max(bodyHeight, desiredBodyHeight) + GROUP_HEADER_HEIGHT + 20);

    const nextGroup = {
      ...group,
      h: groupHeight,
      title: typeof group.title === 'string' ? group.title : `信息分组 ${groupIndex + 1}`,
      w: normalizedPreviewWidth,
      x: 24,
      y: nextGroupY,
    };
    (nextGroup as DetailLayoutItem & { rows?: number }).rows = desiredRowCount;

    nextItems.push(nextGroup);
    nextItems.push(...childItems);
    nextGroupY += groupHeight + GROUP_GAP;
  });

  return createEmptyDetailLayoutDocument({
    gridSize: document.gridSize,
    items: nextItems,
  });
}

function buildGroupViewModels(document: DetailLayoutDocument): ArchiveLayoutGroupViewModel[] {
  const childrenByParent = new Map<string, FlowDraft[]>();
  document.items.filter((item) => item.type !== 'groupbox' && item.field).forEach((item) => {
    const parentId = String(item.parentId || '');
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push({ ...item, panelOrder: 1, panelRow: 1 });
    childrenByParent.set(parentId, siblings);
  });

  return sortItems(document.items.filter((item) => item.type === 'groupbox')).map((group) => {
    return {
      fields: buildDrafts(childrenByParent.get(group.id) ?? []),
      group,
    };
  });
}

function buildArchiveLayoutWorkbenchGroupRenderModels(
  groups: ArchiveLayoutGroupViewModel[],
): ArchiveLayoutWorkbenchGroupRenderModel[] {
  return groups.map((group) => {
    const actualRowCount = Math.max(1, group.fields.reduce((max, item) => Math.max(max, item.panelRow), 1));
    const desiredRowCount = Math.max(actualRowCount, Number((group.group as DetailLayoutItem & { rows?: number }).rows) || 0);
    const fieldsByRow = new Map<number, FlowDraft[]>();

    group.fields.forEach((field) => {
      const rowNumber = Math.max(1, field.panelRow);
      const rowFields = fieldsByRow.get(rowNumber) ?? [];
      rowFields.push(field);
      fieldsByRow.set(rowNumber, rowFields);
    });

    const rows = Array.from({ length: desiredRowCount }, (_, index) => {
      const rowNumber = index + 1;
      const fields = (fieldsByRow.get(rowNumber) ?? [])
        .slice()
        .sort((left, right) => left.panelOrder - right.panelOrder || left.x - right.x);
      return {
        fields,
        rowNumber,
      } satisfies ArchiveLayoutGroupRowViewModel;
    });

    const laneMinHeight = group.fields.length > 0
      ? Math.max(...group.fields.map((item) => getBillHeaderFieldShellHeight({
          controlHeight: getBillHeaderFieldHeight({ controlHeight: item.h }),
          width: getBillHeaderFieldWidth({ width: item.w, name: String(item.title || item.field || '') }),
        })))
      : BILL_FORM_WORKBENCH_MIN_ROW_HEIGHT;

    return {
      group,
      laneMinHeight,
      rows,
    } satisfies ArchiveLayoutWorkbenchGroupRenderModel;
  });
}

type ArchiveLayoutWorkbenchToolbarProps = {
  fieldCount: number;
  groupCount: number;
  onAddGroup: () => void;
  onOpenSchemeModal: () => void;
  onPreviewWorkbenchWidthInputBlur: () => void;
  onPreviewWorkbenchWidthInputChange: (value: string) => void;
  onPreviewWorkbenchWidthInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPreviewWorkbenchWidthPresetSelect: (preset: WidthPreset) => void;
  onPreviewWorkbenchWidthSliderChange: (nextWidth: number) => void;
  onPreviewWorkbenchWidthSliderCommit: () => void;
  previewWorkbenchWidthDraft: number;
  previewWorkbenchWidthInput: string;
};

const ArchiveLayoutWorkbenchToolbar = React.memo(function ArchiveLayoutWorkbenchToolbar({
  fieldCount,
  groupCount,
  onAddGroup,
  onOpenSchemeModal,
  onPreviewWorkbenchWidthInputBlur,
  onPreviewWorkbenchWidthInputChange,
  onPreviewWorkbenchWidthInputKeyDown,
  onPreviewWorkbenchWidthPresetSelect,
  onPreviewWorkbenchWidthSliderChange,
  onPreviewWorkbenchWidthSliderCommit,
  previewWorkbenchWidthDraft,
  previewWorkbenchWidthInput,
}: ArchiveLayoutWorkbenchToolbarProps) {
  return (
    <div className="border-b border-[#e4ecf5] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,255,0.92))] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Workbench</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <div className="text-[15px] font-semibold text-slate-900">详情布局工作台</div>
            <span className="rounded-full border border-[#dbe5ef] bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
              {groupCount} 组
            </span>
            <span className="rounded-full border border-[#dbe5ef] bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
              {fieldCount} 字段
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenSchemeModal}
            className="inline-flex h-9 items-center justify-center rounded-[11px] border border-[#dbe5ef] bg-white px-3 text-[11px] font-semibold text-slate-600 transition-[background-color,color,border-color,box-shadow,transform] hover:-translate-y-[1px] hover:border-[#cddaea] hover:bg-[#f8fbff] hover:text-slate-800 hover:shadow-[0_12px_24px_-22px_rgba(15,23,42,0.18)]"
          >
            方案设置
          </button>
          <button
            type="button"
            onClick={onAddGroup}
            className="inline-flex h-9 items-center justify-center rounded-[11px] border border-primary/20 bg-primary px-3 text-[11px] font-semibold text-white transition-[background-color,border-color,box-shadow,transform] hover:-translate-y-[1px] hover:bg-primary/90 hover:shadow-[0_14px_28px_-24px_rgba(59,130,246,0.35)]"
          >
            新增分组
          </button>
          <div className="rounded-[14px] border border-[#dbe5ef] bg-white px-3 py-2 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500">预览宽度</span>
              <div className="inline-flex rounded-[10px] border border-[#dbe5ef] bg-[#f8fbff] p-1">
                {PREVIEW_WIDTH_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => onPreviewWorkbenchWidthPresetSelect(preset.key)}
                    className={cn(
                      'rounded-[8px] px-2.5 py-1 text-[10px] font-semibold transition-colors',
                      normalizePreviewWorkbenchWidth(previewWorkbenchWidthDraft) === preset.value
                        ? 'bg-primary text-white shadow-[0_10px_24px_-24px_rgba(59,130,246,0.45)]'
                        : 'text-slate-500 hover:bg-white',
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="range"
                min={PREVIEW_WIDTH_MIN}
                max={PREVIEW_WIDTH_MAX}
                step={20}
                value={previewWorkbenchWidthDraft}
                onChange={(event) => onPreviewWorkbenchWidthSliderChange(Number(event.target.value))}
                onPointerUp={onPreviewWorkbenchWidthSliderCommit}
                onKeyUp={onPreviewWorkbenchWidthSliderCommit}
                onBlur={onPreviewWorkbenchWidthSliderCommit}
                className="h-4 w-28 accent-primary"
              />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={previewWorkbenchWidthInput}
                onChange={(event) => onPreviewWorkbenchWidthInputChange(event.target.value)}
                onBlur={onPreviewWorkbenchWidthInputBlur}
                onKeyDown={onPreviewWorkbenchWidthInputKeyDown}
                className="h-8 w-[72px] rounded-[10px] border border-[#d8e3ef] px-2 text-center text-[11px] text-slate-700 outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

type ArchiveLayoutSidebarProps = {
  groupedPlacedFields: GroupedPlacedField[];
  groupTitleById: Map<string, string>;
  hasPlacedFields: boolean;
  keyword: string;
  onAddGroup: () => void;
  placedFieldItemIdByValue: Map<string, string>;
  onAddFieldToGroup: (fieldId: string) => void;
  onApplySpecificScheme: (scheme: ArchiveLayoutScheme) => void;
  onCreateNewSchemeDraft: () => void;
  onCreateSchemeFromCurrentLayout: () => void;
  onDuplicateScheme: (scheme: ArchiveLayoutScheme) => void;
  onKeywordChange: (value: string) => void;
  onOpenSchemeModal: (schemeId?: string | null, draft?: ArchiveLayoutScheme | null) => void;
  onSelectGroup: (groupId: string) => void;
  onSidebarTabChange: (tab: SidebarTabKey) => void;
  onSelectPlacedField: (groupId: string, fieldId: string | null) => void;
  onSelectScheme: (scheme: ArchiveLayoutScheme) => void;
  pendingOptions: DetailLayoutFieldOption[];
  schemes: ArchiveLayoutScheme[];
  schemeSourceId: string | null;
  selectedFieldId: string | null;
  selectedGroupId: string | null;
  sidebarTab: SidebarTabKey;
  staticWorkbenchMotionStyle: React.CSSProperties;
  suggestedScheme: ArchiveLayoutScheme;
};

const ArchiveLayoutSidebar = React.memo(function ArchiveLayoutSidebar({
  groupedPlacedFields,
  groupTitleById,
  hasPlacedFields,
  keyword,
  onAddGroup,
  placedFieldItemIdByValue,
  onAddFieldToGroup,
  onApplySpecificScheme,
  onCreateNewSchemeDraft,
  onCreateSchemeFromCurrentLayout,
  onDuplicateScheme,
  onKeywordChange,
  onOpenSchemeModal,
  onSelectGroup,
  onSidebarTabChange,
  onSelectPlacedField,
  onSelectScheme,
  pendingOptions,
  schemes,
  schemeSourceId,
  selectedFieldId,
  selectedGroupId,
  sidebarTab,
  staticWorkbenchMotionStyle,
  suggestedScheme,
}: ArchiveLayoutSidebarProps) {
  const structureSections = React.useMemo(() => {
    const sectionMap = new Map<string, { fieldIds: string[]; labels: string[]; title: string }>();

    groupedPlacedFields.forEach(({ groupId, option }) => {
      const current = sectionMap.get(groupId) ?? {
        fieldIds: [],
        labels: [],
        title: groupTitleById.get(groupId) || DEFAULT_GROUP_TITLE,
      };
      current.fieldIds.push(String(option.value));
      current.labels.push(String(option.title || option.label || option.value));
      sectionMap.set(groupId, current);
    });

    return Array.from(sectionMap.entries()).map(([groupId, entry]) => ({
      fieldCount: entry.fieldIds.length,
      fieldIds: entry.fieldIds,
      groupId,
      previewText: entry.labels.slice(0, 3).join(' / '),
      title: entry.title,
    }));
  }, [groupTitleById, groupedPlacedFields]);

  return (
    <aside className={cn(SURFACE_CLASS, 'flex min-h-0 flex-col overflow-hidden')}>
      <div className="border-b border-[#e4ecf5] px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Selector</div>
            <div className="mt-1 text-[15px] font-semibold text-slate-900">资源与结构</div>
          </div>
          <div className="grid w-[140px] shrink-0 grid-cols-2 gap-1 rounded-[12px] border border-[#dbe5ef] bg-white/88 p-1 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.22)]">
            <button
              type="button"
              onClick={() => onOpenSchemeModal()}
              className="inline-flex h-8 items-center justify-center rounded-[9px] bg-[#f8fbff] px-2 text-center text-[11px] font-semibold leading-tight text-slate-600 transition-[background-color,color,box-shadow,transform] hover:bg-[#eef5ff] hover:text-primary hover:shadow-[0_10px_24px_-24px_rgba(15,23,42,0.2)]"
              style={staticWorkbenchMotionStyle}
            >
              方案
            </button>
            <button
              type="button"
              onClick={onAddGroup}
              className="inline-flex h-8 items-center justify-center rounded-[9px] bg-[#f8fbff] px-2 text-center text-[11px] font-semibold leading-tight text-slate-600 transition-[background-color,color,box-shadow,transform] hover:bg-[#eef5ff] hover:text-primary hover:shadow-[0_10px_24px_-24px_rgba(15,23,42,0.2)]"
              style={staticWorkbenchMotionStyle}
            >
              建组
            </button>
          </div>
        </div>
        <input
          value={keyword}
          placeholder="搜索字段名、编码或描述"
          onChange={(event) => onKeywordChange(event.target.value)}
          className="mt-2 h-8.5 w-full rounded-[10px] border border-[#d8e3ef] bg-white px-3 text-[12px] text-slate-700 outline-none placeholder:text-slate-400 transition-[border-color,box-shadow,background-color] focus:border-primary/35 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
          style={staticWorkbenchMotionStyle}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
          <span className="rounded-full border border-[#dbe5ef] bg-white px-2 py-1">{pendingOptions.length} 待放入</span>
          <span className="rounded-full border border-[#dbe5ef] bg-white px-2 py-1">{groupedPlacedFields.length} 已编排</span>
          <span className="rounded-full border border-[#dbe5ef] bg-white px-2 py-1">{schemes.length} 方案</span>
        </div>
        <div className="mt-2 inline-flex rounded-[10px] border border-[#dbe5ef] bg-white p-1">
          {SIDEBAR_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSidebarTabChange(tab.key)}
              className={cn(
                'rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold transition-[background-color,color,box-shadow,transform]',
                sidebarTab === tab.key ? 'bg-primary text-white shadow-[0_10px_24px_-24px_rgba(59,130,246,0.45)]' : 'text-slate-500 hover:bg-[#f8fbff]',
              )}
              style={staticWorkbenchMotionStyle}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 p-2">
        {sidebarTab === 'fields' ? (
          <section className="flex h-full min-h-0 flex-col rounded-[14px] border border-[#e0e8f2] bg-white/82">
            <div className="flex items-center justify-between border-b border-[#edf2f7] px-3 py-2">
              <div className="text-[12px] font-semibold text-slate-700">字段池</div>
              <div className="text-[11px] text-slate-400">{pendingOptions.length}</div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {pendingOptions.length > 0 ? pendingOptions.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => onAddFieldToGroup(String(option.value))}
                  className="mb-2 flex w-full items-center justify-between rounded-[14px] border border-dashed border-[#d8e3ef] bg-[#f8fbff] px-3 py-3 text-left transition-[border-color,background-color,box-shadow,transform] hover:border-primary/40 hover:bg-white hover:shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)]"
                  style={staticWorkbenchMotionStyle}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-slate-800">{option.title || option.label}</div>
                    <div className="mt-1 truncate text-[11px] text-slate-400">{option.label}</div>
                  </div>
                  <span className="ml-2 shrink-0 text-[11px] font-semibold text-primary">放入</span>
                </button>
              )) : (
                <div className="px-2 py-6 text-center text-[12px] text-slate-400">所有字段都已放入布局</div>
              )}
            </div>
          </section>
        ) : null}
        {sidebarTab === 'structure' ? (
          <section className="flex h-full min-h-0 flex-col rounded-[14px] border border-[#e0e8f2] bg-white/82">
            <div className="flex items-center justify-between border-b border-[#edf2f7] px-3 py-2">
              <div className="text-[12px] font-semibold text-slate-700">当前结构</div>
              <div className="text-[11px] text-slate-400">{structureSections.length} 个分组</div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {structureSections.length > 0 ? structureSections.map((section) => (
                <div
                  key={section.groupId}
                  className={cn(
                    'mb-2 rounded-[14px] border px-3 py-3 transition-[border-color,background-color,box-shadow,transform]',
                    selectedGroupId === section.groupId
                      ? 'border-primary/35 bg-primary/5 shadow-[0_12px_24px_-24px_rgba(59,130,246,0.32)]'
                      : 'border-[#edf2f7] bg-[#fbfdff] hover:border-[#d7e5f4] hover:bg-white hover:shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)]',
                  )}
                  style={staticWorkbenchMotionStyle}
                >
                  <button
                    type="button"
                    onClick={() => onSelectGroup(section.groupId)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-[12px] font-semibold text-slate-800">{section.title}</div>
                      <span className="rounded-full border border-[#e5ecf5] bg-white px-2 py-1 text-[10px] font-medium text-slate-500">
                        {section.fieldCount}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[11px] text-slate-400">
                      {section.previewText || '当前分组还没有字段'}
                    </div>
                  </button>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {section.fieldIds.slice(0, 4).map((fieldId) => {
                      const itemId = placedFieldItemIdByValue.get(fieldId) ?? null;
                      return (
                        <button
                          key={fieldId}
                          type="button"
                          onClick={() => onSelectPlacedField(section.groupId, itemId)}
                          className={cn(
                            'rounded-[9px] border px-2 py-1 text-[10px] font-medium transition-[background-color,color,border-color]',
                            itemId === selectedFieldId
                              ? 'border-primary/28 bg-primary/10 text-primary'
                              : 'border-[#dbe5ef] bg-white text-slate-500 hover:border-[#cddaea] hover:text-slate-700',
                          )}
                        >
                          定位
                        </button>
                      );
                    })}
                  </div>
                </div>
              )) : (
                <div className="px-2 py-6 text-center text-[12px] text-slate-400">当前没有匹配结构</div>
              )}
            </div>
          </section>
        ) : null}
        {sidebarTab === 'schemes' ? (
          <section className="flex h-full min-h-0 flex-col rounded-[14px] border border-[#e0e8f2] bg-white/82">
            <div className="flex items-center justify-between border-b border-[#edf2f7] px-3 py-2">
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-slate-700">已有方案</div>
              </div>
              <div className="ml-3 rounded-full border border-[#e5ecf5] bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
                {schemes.length} 个方案
              </div>
            </div>
            <div className="border-b border-[#edf2f7] px-3 py-2">
              <div className="grid gap-1 rounded-[12px] border border-[#dbe5ef] bg-white/90 p-1 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.22)]">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={onCreateSchemeFromCurrentLayout}
                    disabled={!hasPlacedFields}
                    className={cn(
                      'inline-flex h-8 items-center justify-center rounded-[9px] px-2 text-center text-[10px] font-semibold leading-tight transition-[background-color,color,box-shadow,transform]',
                      hasPlacedFields
                        ? 'bg-[#f8fbff] text-slate-600 hover:bg-[#eef5ff] hover:text-primary hover:shadow-[0_10px_24px_-24px_rgba(15,23,42,0.2)]'
                        : 'cursor-not-allowed bg-[#f8fafc] text-slate-300',
                    )}
                    style={staticWorkbenchMotionStyle}
                  >
                    从布局生成
                  </button>
                  <button
                    type="button"
                    onClick={onCreateNewSchemeDraft}
                    className="inline-flex h-8 items-center justify-center rounded-[9px] bg-[#f8fbff] px-2 text-center text-[10px] font-semibold leading-tight text-slate-600 transition-[background-color,color,box-shadow,transform] hover:bg-[#eef5ff] hover:text-primary hover:shadow-[0_10px_24px_-24px_rgba(15,23,42,0.2)]"
                    style={staticWorkbenchMotionStyle}
                  >
                    新建方案
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenSchemeModal()}
                  className="inline-flex h-8 items-center justify-center rounded-[9px] bg-primary px-2 text-center text-[10px] font-semibold leading-tight text-white transition-[background-color,box-shadow,transform] hover:bg-primary/90 hover:shadow-[0_12px_24px_-24px_rgba(59,130,246,0.45)]"
                  style={staticWorkbenchMotionStyle}
                >
                  打开方案设置
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {schemes.length > 0 ? schemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className={cn(
                    'mb-1.5 rounded-[12px] border px-2.5 py-2.5 transition-[border-color,background-color,box-shadow,transform]',
                    schemeSourceId === scheme.id ? 'border-primary/35 bg-primary/5 shadow-[0_12px_24px_-24px_rgba(59,130,246,0.3)]' : 'border-[#edf2f7] bg-[#fbfdff] hover:border-[#d7e5f4] hover:bg-white hover:shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)]',
                  )}
                  style={staticWorkbenchMotionStyle}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold text-slate-800">{scheme.name}</div>
                      <div className="mt-1 text-[11px] text-slate-400">{scheme.groups.length} 个分组 · {countSchemeFields(scheme)} 个字段</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectScheme(scheme)}
                      className="rounded-[9px] border border-[#dbe5ef] bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 transition-[background-color,color,box-shadow,transform] hover:bg-[#f8fbff] hover:text-slate-700 hover:shadow-[0_10px_24px_-24px_rgba(15,23,42,0.18)]"
                      style={staticWorkbenchMotionStyle}
                    >
                      选中
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onApplySpecificScheme(scheme)}
                      className="rounded-[9px] border border-primary/20 bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-white transition-[background-color,box-shadow,transform] hover:bg-primary/90 hover:shadow-[0_12px_24px_-24px_rgba(59,130,246,0.45)]"
                      style={staticWorkbenchMotionStyle}
                    >
                      应用
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenSchemeModal(scheme.id)}
                      className="rounded-[9px] border border-[#dbe5ef] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition-[background-color,color,box-shadow,transform] hover:bg-[#f8fbff] hover:text-slate-700 hover:shadow-[0_10px_24px_-24px_rgba(15,23,42,0.18)]"
                      style={staticWorkbenchMotionStyle}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateScheme(scheme)}
                      className="rounded-[9px] border border-[#dbe5ef] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition-[background-color,color,box-shadow,transform] hover:bg-[#f8fbff] hover:text-slate-700 hover:shadow-[0_10px_24px_-24px_rgba(15,23,42,0.18)]"
                      style={staticWorkbenchMotionStyle}
                    >
                      复制
                    </button>
                  </div>
                </div>
              )) : (
                <div className="grid gap-3 rounded-[14px] border border-dashed border-[#d8e3ef] bg-[#f8fbff] px-4 py-6 text-center">
                  <div className="text-[13px] font-semibold text-slate-700">还没有保存的方案</div>
                  <div className="text-[12px] leading-5 text-slate-500">先设置分组并勾选字段，再保存为方案或一键放入布局。</div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={onCreateNewSchemeDraft}
                      className="rounded-[10px] border border-[#dbe5ef] bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 transition-[background-color,color,box-shadow,transform] hover:bg-[#f8fbff] hover:shadow-[0_10px_24px_-24px_rgba(15,23,42,0.18)]"
                      style={staticWorkbenchMotionStyle}
                    >
                      新建方案
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenSchemeModal(null, suggestedScheme)}
                      className="rounded-[10px] border border-primary/20 bg-primary/8 px-3 py-2 text-[12px] font-semibold text-primary transition-[background-color,box-shadow,transform] hover:bg-primary/12 hover:shadow-[0_10px_24px_-24px_rgba(59,130,246,0.28)]"
                      style={staticWorkbenchMotionStyle}
                    >
                      使用默认建议
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </aside>
  );
});

type ArchiveLayoutSchemeFieldRowProps = {
  assignedGroupName: string;
  canMoveToNextGroup: boolean;
  canMoveToPreviousGroup: boolean;
  checked: boolean;
  fieldId: string;
  heightInput: string;
  isExpanded: boolean;
  label: string;
  onHandleFieldSizeInputKeyDown: (
    event: React.KeyboardEvent<HTMLInputElement>,
    commit: () => void,
    reset: () => void,
  ) => void;
  onCommitSizeDraft: (fieldId: string, dimension: 'w' | 'h', rawValue: string, fallback: number, resolvedWidth: number, resolvedHeight: number) => void;
  onNudgeSizeDraft: (fieldId: string, dimension: 'w' | 'h', currentValue: number, delta: number, resolvedWidth: number, resolvedHeight: number) => void;
  onResetSizeDraft: (fieldId: string, resolvedWidth: number, resolvedHeight: number) => void;
  onMoveField: (fieldId: string, target: 'down' | 'up' | 'unassigned') => void;
  onToggleChecked: (fieldId: string, checked: boolean) => void;
  onToggleExpanded: (fieldId: string) => void;
  onUpdateSizeDraft: (fieldId: string, patch: { h?: string; w?: string }, resolvedWidth: number, resolvedHeight: number) => void;
  resolvedHeight: number;
  resolvedWidth: number;
  schemeModalCardClass: string;
  schemeModalInputClass: string;
  schemeModalSelectedCardClass: string;
  schemeModalSurfaceButtonClass: string;
  showAssignedGroupName: boolean;
  staticWorkbenchMotionStyle: React.CSSProperties;
  title: string;
  widthInput: string;
};

const ArchiveLayoutSchemeFieldRow = React.memo(function ArchiveLayoutSchemeFieldRow({
  assignedGroupName,
  canMoveToNextGroup,
  canMoveToPreviousGroup,
  checked,
  fieldId,
  heightInput,
  isExpanded,
  label,
  onHandleFieldSizeInputKeyDown,
  onCommitSizeDraft,
  onNudgeSizeDraft,
  onResetSizeDraft,
  onMoveField,
  onToggleChecked,
  onToggleExpanded,
  onUpdateSizeDraft,
  resolvedHeight,
  resolvedWidth,
  schemeModalCardClass,
  schemeModalInputClass,
  schemeModalSelectedCardClass,
  schemeModalSurfaceButtonClass,
  showAssignedGroupName,
  staticWorkbenchMotionStyle,
  title,
  widthInput,
}: ArchiveLayoutSchemeFieldRowProps) {
  return (
    <label
      className={cn(
        'mb-2 flex cursor-pointer items-start gap-3 rounded-[14px] border px-3 py-2.5',
        checked
          ? `border-primary/35 bg-primary/5 ${schemeModalSelectedCardClass}`
          : 'border-[#edf2f7] bg-[#fbfdff] hover:border-[#d7e5f4] hover:bg-white',
        schemeModalCardClass,
      )}
      style={staticWorkbenchMotionStyle}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onToggleChecked(fieldId, event.target.checked)}
        className="mt-0.5 size-4 rounded border-[#c7d4e4]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-800">{title}</div>
          {checked ? (
            <span className="rounded-full border border-[#dbe5ef] bg-white px-2 py-1 text-[10px] font-medium text-slate-500">
              {resolvedWidth} × {resolvedHeight}
            </span>
          ) : null}
        </div>
          <div className="mt-1 truncate text-[11px] text-slate-400">{label}</div>
        {checked ? (
          <div className="mt-1.5 space-y-2" onClick={(event) => event.stopPropagation()}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary/15 bg-white px-2 py-1 text-[10px] font-semibold text-primary">
                已加入当前分组
              </span>
              <button
                type="button"
                disabled={!canMoveToPreviousGroup}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onMoveField(fieldId, 'up');
                }}
                className={cn(
                  'rounded-[8px] border px-2.5 py-1 text-[10px] font-semibold',
                  canMoveToPreviousGroup
                    ? `border-[#d8e3ef] bg-white text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff] ${schemeModalSurfaceButtonClass}`
                    : 'cursor-not-allowed border-[#eef2f7] bg-[#f8fafc] text-slate-300',
                )}
                style={canMoveToPreviousGroup ? staticWorkbenchMotionStyle : undefined}
              >
                上组
              </button>
              <button
                type="button"
                disabled={!canMoveToNextGroup}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onMoveField(fieldId, 'down');
                }}
                className={cn(
                  'rounded-[8px] border px-2.5 py-1 text-[10px] font-semibold',
                  canMoveToNextGroup
                    ? `border-[#d8e3ef] bg-white text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff] ${schemeModalSurfaceButtonClass}`
                    : 'cursor-not-allowed border-[#eef2f7] bg-[#f8fafc] text-slate-300',
                )}
                style={canMoveToNextGroup ? staticWorkbenchMotionStyle : undefined}
              >
                下组
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onMoveField(fieldId, 'unassigned');
                }}
                className={cn(
                  'rounded-[8px] border border-[#d8e3ef] bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                  schemeModalSurfaceButtonClass,
                )}
                style={staticWorkbenchMotionStyle}
              >
                移出分组
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggleExpanded(fieldId);
                }}
                className={cn(
                  'rounded-[8px] border border-[#d8e3ef] bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                  schemeModalSurfaceButtonClass,
                )}
                style={staticWorkbenchMotionStyle}
              >
                {isExpanded ? '收起尺寸' : '尺寸设置'}
              </button>
            </div>
            {isExpanded ? (
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-[10px] font-medium text-slate-500">
                  <span>默认宽度</span>
                  <div className="grid grid-cols-[24px_minmax(0,1fr)_24px] items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onNudgeSizeDraft(fieldId, 'w', resolvedWidth, -20, resolvedWidth, resolvedHeight)}
                      className={cn(
                        'h-7 rounded-[8px] border border-[#d8e3ef] bg-white text-[12px] font-semibold text-slate-500 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                        schemeModalSurfaceButtonClass,
                      )}
                      style={staticWorkbenchMotionStyle}
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={widthInput}
                      onChange={(event) => onUpdateSizeDraft(fieldId, { w: event.target.value.replace(/[^\d]/g, '') }, resolvedWidth, resolvedHeight)}
                      onBlur={() => onCommitSizeDraft(fieldId, 'w', widthInput, resolvedWidth, resolvedWidth, resolvedHeight)}
                      onKeyDown={(event) => onHandleFieldSizeInputKeyDown(
                        event,
                        () => onCommitSizeDraft(fieldId, 'w', widthInput, resolvedWidth, resolvedWidth, resolvedHeight),
                        () => onResetSizeDraft(fieldId, resolvedWidth, resolvedHeight),
                      )}
                      className={cn(
                        'h-7 min-w-0 rounded-[8px] border border-[#d8e3ef] bg-white px-2 text-center text-[11px] text-slate-700 outline-none',
                        schemeModalInputClass,
                      )}
                      style={staticWorkbenchMotionStyle}
                    />
                    <button
                      type="button"
                      onClick={() => onNudgeSizeDraft(fieldId, 'w', resolvedWidth, 20, resolvedWidth, resolvedHeight)}
                      className={cn(
                        'h-7 rounded-[8px] border border-[#d8e3ef] bg-white text-[12px] font-semibold text-slate-500 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                        schemeModalSurfaceButtonClass,
                      )}
                      style={staticWorkbenchMotionStyle}
                    >
                      +
                    </button>
                  </div>
                </label>
                <label className="grid gap-1 text-[10px] font-medium text-slate-500">
                  <span>默认高度</span>
                  <div className="grid grid-cols-[24px_minmax(0,1fr)_24px] items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onNudgeSizeDraft(fieldId, 'h', resolvedHeight, -4, resolvedWidth, resolvedHeight)}
                      className={cn(
                        'h-7 rounded-[8px] border border-[#d8e3ef] bg-white text-[12px] font-semibold text-slate-500 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                        schemeModalSurfaceButtonClass,
                      )}
                      style={staticWorkbenchMotionStyle}
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={heightInput}
                      onChange={(event) => onUpdateSizeDraft(fieldId, { h: event.target.value.replace(/[^\d]/g, '') }, resolvedWidth, resolvedHeight)}
                      onBlur={() => onCommitSizeDraft(fieldId, 'h', heightInput, resolvedHeight, resolvedWidth, resolvedHeight)}
                      onKeyDown={(event) => onHandleFieldSizeInputKeyDown(
                        event,
                        () => onCommitSizeDraft(fieldId, 'h', heightInput, resolvedHeight, resolvedWidth, resolvedHeight),
                        () => onResetSizeDraft(fieldId, resolvedWidth, resolvedHeight),
                      )}
                      className={cn(
                        'h-7 min-w-0 rounded-[8px] border border-[#d8e3ef] bg-white px-2 text-center text-[11px] text-slate-700 outline-none',
                        schemeModalInputClass,
                      )}
                      style={staticWorkbenchMotionStyle}
                    />
                    <button
                      type="button"
                      onClick={() => onNudgeSizeDraft(fieldId, 'h', resolvedHeight, 4, resolvedWidth, resolvedHeight)}
                      className={cn(
                        'h-7 rounded-[8px] border border-[#d8e3ef] bg-white text-[12px] font-semibold text-slate-500 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                        schemeModalSurfaceButtonClass,
                      )}
                      style={staticWorkbenchMotionStyle}
                    >
                      +
                    </button>
                  </div>
                </label>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {showAssignedGroupName ? (
        <span
          className="shrink-0 rounded-full border border-[#e5ecf5] bg-white px-2 py-1 text-[10px] font-medium text-slate-500 transition-[border-color,background-color,box-shadow]"
          style={staticWorkbenchMotionStyle}
        >
          {assignedGroupName}
        </span>
      ) : null}
    </label>
  );
});

type ArchiveLayoutWorkbenchRowProps = {
  activeDragFieldId: string | null;
  density: 'comfortable' | 'compact';
  dragFeedbackIndicatorOpacity: number;
  dragFeedbackTransitionMs: number;
  fieldResizePreview: FieldResizePreview | null;
  groupId: string;
  hasActiveDrag: boolean;
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  onDeleteGroupRow: (groupId: string) => void;
  onRemoveField: (fieldId: string) => void;
  onOpenFieldEditor: (fieldId: string) => void;
  onSelectField: (groupId: string, fieldId: string) => void;
  onStartFieldResize: (
    event: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>,
    field: FlowDraft,
    dimension: 'h' | 'w',
  ) => void;
  openFieldEditorId: string | null;
  optionMap: Map<string, DetailLayoutFieldOption>;
  renderBillStyleFieldPreview: (rawField: any, previewHeight?: number) => React.ReactNode;
  row: ArchiveLayoutGroupRowViewModel;
  rowDropTarget: FieldDropTarget | null;
  selectedFieldId: string | null;
};

type ArchiveLayoutWorkbenchFieldCardProps = {
  displayTitle: string;
  dragFeedbackIndicatorOpacity: number;
  dragFeedbackTransitionMs: number;
  field: FlowDraft;
  fieldIsDragging: boolean;
  isInsertTarget: boolean;
  isNeighborAfterInsert: boolean;
  isNeighborBeforeInsert: boolean;
  isSelected: boolean;
  normalizedField: Record<string, any>;
  onRemoveField: (fieldId: string) => void;
  onOpenFieldEditor: (fieldId: string) => void;
  onSelectField: (groupId: string, fieldId: string) => void;
  onStartFieldResize: (
    event: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>,
    field: FlowDraft,
    dimension: 'h' | 'w',
  ) => void;
  previewHeight: number;
  renderBillStyleFieldPreview: (rawField: any, previewHeight?: number) => React.ReactNode;
  shellHeight: number;
  transitionTimingFunction: string;
  width: number;
  groupId: string;
};

const ArchiveLayoutWorkbenchFieldCard = React.memo(function ArchiveLayoutWorkbenchFieldCard({
  displayTitle,
  dragFeedbackIndicatorOpacity,
  dragFeedbackTransitionMs,
  field,
  fieldIsDragging,
  groupId,
  isInsertTarget,
  isNeighborAfterInsert,
  isNeighborBeforeInsert,
  isSelected,
  normalizedField,
  onRemoveField,
  onOpenFieldEditor,
  onSelectField,
  onStartFieldResize,
  previewHeight,
  renderBillStyleFieldPreview,
  shellHeight,
  transitionTimingFunction,
  width,
}: ArchiveLayoutWorkbenchFieldCardProps) {
  const insertSpacerWidth = isInsertTarget ? 22 : 0;

  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none relative block shrink-0 overflow-visible transition-[width,opacity,transform] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isInsertTarget ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          opacity: isInsertTarget ? dragFeedbackIndicatorOpacity : 0,
          transitionDuration: `${dragFeedbackTransitionMs}ms`,
          width: insertSpacerWidth,
        }}
      >
        <span className="absolute inset-y-1 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-primary shadow-[0_0_0_3px_rgba(59,130,246,0.10)]" />
      </span>
      <DesignerWorkbenchDraggableItem
        dragId={`archive-field:${field.id}`}
        dropId={`archive-drop:${field.id}`}
        data={{ fieldId: field.id, groupId, type: 'archive-field' } as FieldDragData}
        sortable
        itemAttributes={{ 'data-archive-field-card': 'true', title: `${displayTitle} · 拖动调整顺序，双击设置` }}
        className={cn(
          'group relative flex shrink-0 select-none rounded-[10px] text-left transition-[transform,background-color,box-shadow,opacity] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)]',
          fieldIsDragging ? 'cursor-grabbing opacity-0' : 'cursor-grab active:cursor-grabbing',
          !fieldIsDragging && isSelected ? 'bg-[color:var(--workspace-accent)]/[0.028] ring-2 ring-[color:var(--workspace-accent)]/10 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.05),0_12px_24px_-24px_rgba(15,23,42,0.24)]' : null,
          !fieldIsDragging && !isSelected ? 'hover:bg-slate-50/60 hover:shadow-[0_10px_24px_-24px_rgba(15,23,42,0.18)]' : null,
          isInsertTarget ? 'translate-x-1.5' : null,
          isNeighborBeforeInsert ? '-translate-x-0.5' : null,
          isNeighborAfterInsert ? 'translate-x-0.5' : null,
        )}
        style={{
          height: shellHeight,
          width,
          willChange: 'transform',
          transitionDuration: `${dragFeedbackTransitionMs}ms`,
          transitionTimingFunction,
        }}
        onClick={(event: React.MouseEvent<HTMLDivElement>) => {
          event.stopPropagation();
          onSelectField(groupId, field.id);
        }}
        onDoubleClick={(event: React.MouseEvent<HTMLDivElement>) => {
          event.stopPropagation();
          onOpenFieldEditor(field.id);
        }}
      >
        {isInsertTarget ? (
          <span className="pointer-events-none absolute inset-[2px] rounded-[10px] bg-primary/[0.045] shadow-[inset_0_0_0_1px_rgba(59,130,246,0.08)]" />
        ) : null}
        <div
          data-workbench-no-drag="true"
          className={cn(
            'absolute right-2 top-2 z-10 flex items-center gap-1 transition-opacity duration-180 ease-[cubic-bezier(0.22,1,0.36,1)]',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          style={{
            transitionDuration: `${dragFeedbackTransitionMs}ms`,
            transitionTimingFunction,
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenFieldEditor(field.id);
            }}
            className="rounded-[8px] border border-[#dbe5ef] bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 shadow-[0_8px_18px_-16px_rgba(15,23,42,0.22)] hover:border-[#cddaea] hover:text-slate-700"
          >
            快编
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemoveField(field.id);
            }}
            className="rounded-[8px] border border-[#f1d4d8] bg-white px-2 py-0.5 text-[10px] font-semibold text-rose-600 shadow-[0_8px_18px_-16px_rgba(15,23,42,0.22)] hover:border-[#edc2ca] hover:bg-[#fff7f7]"
          >
            移除
          </button>
        </div>
        <div
          data-workbench-no-drag="true"
          className={cn(
            'absolute inset-y-1 right-0 z-10 flex w-3 cursor-col-resize items-center justify-center rounded-full transition-[opacity,background-color,transform] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/8',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          style={{
            transitionDuration: `${dragFeedbackTransitionMs}ms`,
            transitionTimingFunction,
          }}
          onPointerDown={(event) => onStartFieldResize(event, field, 'w')}
        >
          <span className="h-7 w-px rounded-full bg-slate-300/70" />
        </div>
        <div
          data-workbench-no-drag="true"
          className={cn(
            'absolute inset-x-3 bottom-0 z-10 flex h-3 cursor-row-resize items-center justify-center rounded-full transition-[opacity,background-color,transform] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/8',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
          style={{
            transitionDuration: `${dragFeedbackTransitionMs}ms`,
            transitionTimingFunction,
          }}
          onPointerDown={(event) => onStartFieldResize(event, field, 'h')}
        >
          <span className="h-px w-7 rounded-full bg-slate-300/70" />
        </div>
        <div
          className={cn(
            'pointer-events-none flex h-full min-w-0 flex-1 items-center gap-1.5 px-1 transition-[padding-left,transform,opacity] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)]',
            isInsertTarget ? 'pl-2 translate-x-0.5 opacity-95' : '',
            isNeighborBeforeInsert ? '-translate-x-0.5 opacity-[0.98]' : '',
            isNeighborAfterInsert ? 'translate-x-0.5 opacity-[0.98]' : '',
          )}
          style={{
            transitionDuration: `${dragFeedbackTransitionMs}ms`,
            transitionTimingFunction,
          }}
        >
          <div className="flex h-full max-w-[42%] shrink-0 items-center text-[12px] font-medium tracking-[-0.01em] text-slate-800" title={displayTitle}>
            <span className="truncate">{displayTitle}</span>
          </div>
          <div className="min-w-0 flex-1">
            {renderBillStyleFieldPreview(normalizedField, previewHeight)}
          </div>
        </div>
      </DesignerWorkbenchDraggableItem>
    </>
  );
}, (prevProps, nextProps) => (
  prevProps.field === nextProps.field
  && prevProps.displayTitle === nextProps.displayTitle
  && prevProps.normalizedField === nextProps.normalizedField
  && prevProps.previewHeight === nextProps.previewHeight
  && prevProps.shellHeight === nextProps.shellHeight
  && prevProps.width === nextProps.width
  && prevProps.groupId === nextProps.groupId
  && prevProps.fieldIsDragging === nextProps.fieldIsDragging
  && prevProps.isInsertTarget === nextProps.isInsertTarget
  && prevProps.isNeighborBeforeInsert === nextProps.isNeighborBeforeInsert
  && prevProps.isNeighborAfterInsert === nextProps.isNeighborAfterInsert
  && prevProps.isSelected === nextProps.isSelected
  && prevProps.dragFeedbackTransitionMs === nextProps.dragFeedbackTransitionMs
  && prevProps.dragFeedbackIndicatorOpacity === nextProps.dragFeedbackIndicatorOpacity
));

const ArchiveLayoutWorkbenchRow = React.memo(function ArchiveLayoutWorkbenchRow({
  activeDragFieldId,
  density,
  dragFeedbackIndicatorOpacity,
  dragFeedbackTransitionMs,
  fieldResizePreview,
  groupId,
  hasActiveDrag,
  normalizeColumn,
  onDeleteGroupRow,
  onRemoveField,
  onOpenFieldEditor,
  onSelectField,
  onStartFieldResize,
  openFieldEditorId,
  optionMap,
  renderBillStyleFieldPreview,
  row,
  rowDropTarget,
  selectedFieldId,
}: ArchiveLayoutWorkbenchRowProps) {
  const rowNumber = row.rowNumber;
  const rowFields = row.fields;
  const isRowTarget = Boolean(
    hasActiveDrag
    && rowDropTarget
    && rowDropTarget.rowNumber === rowNumber
    && rowDropTarget.mode === 'row',
  );
  const isRowWarm = Boolean(
    hasActiveDrag
    && rowDropTarget
    && rowDropTarget.rowNumber === rowNumber,
  );
  const isEmptyRow = rowFields.length === 0;
  const isRowEndTarget = Boolean(isRowTarget && rowDropTarget?.beforeId == null && rowFields.length > 0);
  const isRowStartWarm = Boolean(
    isRowWarm
    && !isEmptyRow
    && rowDropTarget?.beforeId != null
    && rowDropTarget.beforeId === rowFields[0]?.id,
  );
  const isRowEndWarm = Boolean(
    isRowWarm
    && !isEmptyRow
    && rowDropTarget?.beforeId == null,
  );
  const rowInsertIndex = hasActiveDrag && rowDropTarget?.beforeId
    ? rowFields.findIndex((candidate) => candidate.id === rowDropTarget.beforeId)
    : -1;
  const fieldRenderModels = React.useMemo(() => rowFields.map((field) => {
    const fieldOption = optionMap.get(String(field.field ?? ''));
    const rawField = (fieldOption?.rawField ?? {}) as Record<string, any>;
    const displayTitle = getDisplayTitle(field, fieldOption, rawField);
    const normalizedField = normalizeColumn({ ...rawField, name: displayTitle });
    const previewFieldWidth = fieldResizePreview?.fieldId === field.id ? fieldResizePreview.w : field.w;
    const previewFieldHeight = fieldResizePreview?.fieldId === field.id ? fieldResizePreview.h : field.h;
    const liveWidth = getBillHeaderFieldWidth({ width: previewFieldWidth, name: displayTitle });
    const liveHeight = getBillHeaderFieldHeight({ controlHeight: previewFieldHeight });
    return {
      displayTitle,
      field,
      normalizedField,
      previewHeight: clampNumber(liveHeight - 24, 18, 24),
      shellHeight: Math.max(28, getBillHeaderFieldShellHeight({ controlHeight: liveHeight, width: liveWidth }) - 24),
      width: liveWidth,
    } satisfies ArchiveLayoutWorkbenchFieldRenderModel;
  }), [fieldResizePreview, normalizeColumn, optionMap, rowFields]);

  return (
    <DesignerWorkbenchDropLane
      dropId={`archive-row:${groupId}:${rowNumber}`}
      data={{ beforeId: null, groupId, rowNumber, type: 'archive-field-row' } as FieldRowDropData}
      className={cn(
        'group/row relative -mx-1.5 rounded-[12px] px-2.5 py-1 transition-[background-color,border-color,box-shadow,transform] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)]',
        isRowTarget ? 'bg-primary/6 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.14)]' : 'hover:bg-slate-50/70',
        isRowWarm && !isRowTarget && !isEmptyRow ? 'bg-primary/[0.028] shadow-[inset_0_0_0_1px_rgba(59,130,246,0.08)]' : '',
        isEmptyRow ? 'border border-dashed border-[#dbe5ef] bg-white/78 px-3 py-2.5 hover:border-primary/28 hover:bg-primary/[0.025]' : '',
        isEmptyRow && isRowTarget ? 'translate-y-[-1px] border-primary/40 bg-primary/[0.06] shadow-[inset_0_0_0_1px_rgba(59,130,246,0.18),0_10px_24px_-22px_rgba(59,130,246,0.35)]' : '',
      )}
      style={{ transitionDuration: `${dragFeedbackTransitionMs}ms` }}
    >
      {isRowWarm && !isEmptyRow ? (
        <>
          <span className={cn(
            'pointer-events-none absolute inset-x-3 top-0 h-px transition-colors duration-180',
            isRowTarget ? 'bg-primary/45' : 'bg-primary/20',
          )} style={{ opacity: dragFeedbackIndicatorOpacity, transitionDuration: `${dragFeedbackTransitionMs}ms` }} />
          <span className={cn(
            'pointer-events-none absolute inset-x-3 bottom-0 h-px transition-colors duration-180',
            isRowTarget ? 'bg-primary/20' : 'bg-primary/12',
          )} style={{ opacity: dragFeedbackIndicatorOpacity, transitionDuration: `${dragFeedbackTransitionMs}ms` }} />
          {isRowStartWarm ? (
            <span className="pointer-events-none absolute inset-y-1 left-0 flex w-4 items-center justify-center">
              <span className={cn(
                'w-[3px] rounded-full transition-[height,background-color,box-shadow] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)]',
                isRowTarget ? 'h-full bg-primary shadow-[0_0_0_3px_rgba(59,130,246,0.10)]' : 'h-[72%] bg-primary/45 shadow-[0_0_0_2px_rgba(59,130,246,0.07)]',
              )} style={{ opacity: dragFeedbackIndicatorOpacity, transitionDuration: `${dragFeedbackTransitionMs}ms` }} />
            </span>
          ) : null}
          {isRowEndWarm ? (
            <span className="pointer-events-none absolute inset-y-1 right-0 flex w-4 items-center justify-center">
              <span className={cn(
                'w-[3px] rounded-full transition-[height,background-color,box-shadow] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)]',
                isRowTarget ? 'h-full bg-primary shadow-[0_0_0_3px_rgba(59,130,246,0.10)]' : 'h-[72%] bg-primary/45 shadow-[0_0_0_2px_rgba(59,130,246,0.07)]',
              )} style={{ opacity: dragFeedbackIndicatorOpacity, transitionDuration: `${dragFeedbackTransitionMs}ms` }} />
            </span>
          ) : null}
        </>
      ) : null}
      {isRowTarget ? (
        <>
          {isEmptyRow ? (
            <span className="pointer-events-none absolute inset-[3px] rounded-[10px] bg-primary/[0.045]" />
          ) : null}
          {isRowEndTarget ? (
            <span className="pointer-events-none absolute inset-y-1 right-0 flex w-4 items-center justify-center">
              <span className="h-full w-[3px] rounded-full bg-primary shadow-[0_0_0_3px_rgba(59,130,246,0.10)]" />
            </span>
          ) : null}
        </>
      ) : null}
      {isEmptyRow ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] flex -translate-y-1/2 justify-center px-5">
          <span
            className={cn(
              'inline-flex min-w-[116px] items-center justify-center rounded-full border px-3.5 py-1 text-[10px] font-semibold tracking-[0.01em] transition-[border-color,background-color,color,transform,box-shadow] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)]',
              isRowTarget
                ? 'scale-[1.02] border-primary/26 bg-primary/[0.075] text-primary shadow-[0_8px_20px_-18px_rgba(59,130,246,0.42)]'
                : 'border-[#e2eaf3] bg-white/96 text-slate-400 group-hover/row:border-primary/16 group-hover/row:text-slate-500',
            )}
          >
            拖入新增行
          </span>
        </div>
      ) : null}
      <SortableContext items={rowFields.map((field) => `archive-field:${field.id}`)} strategy={rectSortingStrategy}>
        <div className={cn(
          'flex min-w-full items-start',
          density === 'compact' ? 'gap-x-3.5' : 'gap-x-4.5',
          isEmptyRow ? 'opacity-0' : '',
        )}>
          {fieldRenderModels.length > 0 ? fieldRenderModels.map((fieldModel, fieldIndex) => {
            const { displayTitle, field, normalizedField, previewHeight, shellHeight, width } = fieldModel;
            const isInsertTarget = hasActiveDrag && rowDropTarget?.beforeId === field.id && activeDragFieldId !== field.id;
            const fieldIsDragging = activeDragFieldId === field.id;
            const isSelected = selectedFieldId === field.id || isInsertTarget || openFieldEditorId === field.id;
            const isNeighborBeforeInsert = rowInsertIndex > 0 && fieldIndex === rowInsertIndex - 1;
            const isNeighborAfterInsert = rowInsertIndex >= 0 && fieldIndex === rowInsertIndex + 1;

            return (
              <ArchiveLayoutWorkbenchFieldCard
                key={field.id}
                displayTitle={displayTitle}
                dragFeedbackIndicatorOpacity={dragFeedbackIndicatorOpacity}
                dragFeedbackTransitionMs={dragFeedbackTransitionMs}
                field={field}
                fieldIsDragging={fieldIsDragging}
                groupId={groupId}
                isInsertTarget={isInsertTarget}
                isNeighborAfterInsert={isNeighborAfterInsert}
                isNeighborBeforeInsert={isNeighborBeforeInsert}
                isSelected={isSelected}
                normalizedField={normalizedField}
                onRemoveField={onRemoveField}
                onOpenFieldEditor={onOpenFieldEditor}
                onSelectField={onSelectField}
                onStartFieldResize={onStartFieldResize}
                previewHeight={previewHeight}
                renderBillStyleFieldPreview={renderBillStyleFieldPreview}
                shellHeight={shellHeight}
                transitionTimingFunction={DASHBOARD_DRAG_MOTION_EASING}
                width={width}
              />
            );
          }) : (
            <>
              <span className="h-px flex-1 self-center bg-[#dbe6f2]" />
              <span className="shrink-0 text-[11px] font-medium text-slate-400">拖到这一行</span>
              <span className="h-px flex-1 self-center bg-[#dbe6f2]" />
            </>
          )}
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none relative block shrink-0 overflow-visible transition-[width,opacity] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)]',
              isRowEndTarget ? 'opacity-100' : 'opacity-0',
            )}
            style={{
              opacity: isRowEndTarget ? dragFeedbackIndicatorOpacity : 0,
              transitionDuration: `${dragFeedbackTransitionMs}ms`,
              width: isRowEndTarget ? 22 : 0,
            }}
          >
            <span className="absolute inset-y-1 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-primary shadow-[0_0_0_3px_rgba(59,130,246,0.10)]" />
          </span>
        </div>
      </SortableContext>
      {rowFields.length === 0 ? (
        <button
          type="button"
          data-workbench-no-drag="true"
          onClick={(event) => {
            event.stopPropagation();
            onDeleteGroupRow(groupId);
          }}
          className="absolute right-2 top-1/2 inline-flex h-6 -translate-y-1/2 items-center rounded-[8px] border border-[#f1d4d8] bg-white/96 px-2 text-[10px] font-semibold text-rose-600 opacity-0 shadow-sm transition-all pointer-events-none group-hover/row:pointer-events-auto group-hover/row:opacity-100 hover:bg-[#fff5f5]"
        >
          删除行
        </button>
      ) : null}
    </DesignerWorkbenchDropLane>
  );
}, (prevProps, nextProps) => (
  prevProps.row === nextProps.row
  && prevProps.activeDragFieldId === nextProps.activeDragFieldId
  && prevProps.groupId === nextProps.groupId
  && prevProps.density === nextProps.density
  && prevProps.hasActiveDrag === nextProps.hasActiveDrag
  && prevProps.selectedFieldId === nextProps.selectedFieldId
  && prevProps.openFieldEditorId === nextProps.openFieldEditorId
  && prevProps.fieldResizePreview === nextProps.fieldResizePreview
  && areFieldDropTargetsEqual(prevProps.rowDropTarget, nextProps.rowDropTarget)
  && prevProps.dragFeedbackTransitionMs === nextProps.dragFeedbackTransitionMs
  && prevProps.dragFeedbackIndicatorOpacity === nextProps.dragFeedbackIndicatorOpacity
));

type ArchiveLayoutWorkbenchGroupProps = {
  canMoveDown: boolean;
  canMoveUp: boolean;
  currentGroupDropTarget: FieldDropTarget | null;
  density: 'comfortable' | 'compact';
  dragFeedbackIndicatorOpacity: number;
  dragFeedbackTransitionMs: number;
  dragFieldId: string | null;
  fieldResizePreview: FieldResizePreview | null;
  groupRenderModel: ArchiveLayoutWorkbenchGroupRenderModel;
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  onAddGroupRow: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onDeleteGroupRow: (groupId: string) => void;
  onMoveGroup: (groupId: string, direction: 'down' | 'up') => void;
  onRemoveField: (fieldId: string) => void;
  onOpenFieldEditor: (fieldId: string) => void;
  onRenameGroup: (groupId: string, title: string) => void;
  onSelectField: (groupId: string, fieldId: string) => void;
  onSelectGroup: (groupId: string) => void;
  onStartFieldResize: (
    event: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>,
    field: FlowDraft,
    dimension: 'h' | 'w',
  ) => void;
  openFieldEditorId: string | null;
  optionMap: Map<string, DetailLayoutFieldOption>;
  renderBillStyleFieldPreview: (rawField: any, previewHeight?: number) => React.ReactNode;
  selectedFieldId: string | null;
  selectedGroupId: string | null;
};

const ArchiveLayoutWorkbenchGroup = React.memo(function ArchiveLayoutWorkbenchGroup({
  canMoveDown,
  canMoveUp,
  currentGroupDropTarget,
  density,
  dragFeedbackIndicatorOpacity,
  dragFeedbackTransitionMs,
  dragFieldId,
  fieldResizePreview,
  groupRenderModel,
  normalizeColumn,
  onAddGroupRow,
  onDeleteGroup,
  onDeleteGroupRow,
  onMoveGroup,
  onRemoveField,
  onOpenFieldEditor,
  onRenameGroup,
  onSelectField,
  onSelectGroup,
  onStartFieldResize,
  openFieldEditorId,
  optionMap,
  renderBillStyleFieldPreview,
  selectedFieldId,
  selectedGroupId,
}: ArchiveLayoutWorkbenchGroupProps) {
  const { group, laneMinHeight, rows } = groupRenderModel;
  const groupId = group.group.id;
  const isSelectedGroup = selectedGroupId === groupId;
  const activeDropTarget = currentGroupDropTarget?.groupId === groupId ? currentGroupDropTarget : null;
  const activeResizePreview = fieldResizePreview && group.fields.some((field) => field.id === fieldResizePreview.fieldId)
    ? fieldResizePreview
    : null;
  const activeOpenFieldEditorId = openFieldEditorId && group.fields.some((field) => field.id === openFieldEditorId)
    ? openFieldEditorId
    : null;
  const activeSelectedFieldId = selectedFieldId && group.fields.some((field) => field.id === selectedFieldId)
    ? selectedFieldId
    : null;

  return (
    <div
      className={cn(
        'group border-t border-[#edf2f7] pt-4 transition-colors first:border-t-0 first:pt-0',
        isSelectedGroup && 'border-primary/20',
      )}
      style={{ width: group.group.w }}
      onClick={() => onSelectGroup(groupId)}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
        <div className="min-w-0 flex flex-1 items-center gap-2">
          <input
            value={String(group.group.title || '')}
            onChange={(event) => onRenameGroup(groupId, event.target.value)}
            onClick={(event) => event.stopPropagation()}
            className="h-8 min-w-0 flex-1 rounded-[10px] border border-transparent bg-transparent px-2 text-[15px] font-semibold tracking-[-0.01em] text-slate-800 outline-none transition-colors focus:border-[#d8e3ef] focus:bg-white"
            placeholder={DEFAULT_GROUP_TITLE}
          />
          <span className="rounded-full border border-[#dbe5ef] bg-white px-2 py-1 text-[10px] font-medium text-slate-500">
            {group.fields.length} 字段 / {rows.length} 行
          </span>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onMoveGroup(groupId, 'up');
          }}
          disabled={!canMoveUp}
          className={cn(
            'h-8 w-8 shrink-0 rounded-[10px] border text-[12px] font-semibold transition-colors',
            canMoveUp
              ? 'border-[#dbe5ef] bg-white text-slate-600 hover:border-primary/35 hover:text-primary'
              : 'cursor-not-allowed border-[#eef2f7] bg-[#f8fafc] text-slate-300',
          )}
          aria-label="上移分组"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onMoveGroup(groupId, 'down');
          }}
          disabled={!canMoveDown}
          className={cn(
            'h-8 w-8 shrink-0 rounded-[10px] border text-[12px] font-semibold transition-colors',
            canMoveDown
              ? 'border-[#dbe5ef] bg-white text-slate-600 hover:border-primary/35 hover:text-primary'
              : 'cursor-not-allowed border-[#eef2f7] bg-[#f8fafc] text-slate-300',
          )}
          aria-label="下移分组"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAddGroupRow(groupId);
          }}
          className="h-8 shrink-0 rounded-[10px] border border-[#dbe5ef] bg-white px-3 text-[11px] font-semibold text-slate-600 transition-colors hover:border-primary/35 hover:text-primary"
        >
          新增行
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDeleteGroup(groupId);
          }}
          className="h-8 shrink-0 rounded-[10px] border border-[#f1d4d8] bg-[#fff7f7] px-3 text-[11px] font-semibold text-rose-600 transition-colors hover:bg-[#fff1f1]"
        >
          删除分组
        </button>
      </div>

      <DesignerWorkbenchDropLane
        dropId={`archive-group:${groupId}`}
        data={{ groupId, type: 'archive-group' } as GroupDragData}
        className={cn(
          'scrollbar-none relative -mx-1 rounded-[16px] px-2 py-1.5 transition-colors',
          dragFieldId && activeDropTarget && !activeDropTarget.beforeId ? 'bg-primary/5' : '',
          group.fields.length === 0 && 'rounded-[14px] border border-dashed border-[#dfe7f1]/80 bg-white/40 px-3 py-4',
        )}
        style={{
          transitionDuration: `${dragFeedbackTransitionMs}ms`,
          minHeight: laneMinHeight,
        }}
      >
        <div className="grid gap-y-0.5">
          {rows.map((row) => {
            const rowDropTarget = activeDropTarget?.rowNumber === row.rowNumber ? activeDropTarget : null;
            return (
              <ArchiveLayoutWorkbenchRow
                activeDragFieldId={dragFieldId}
                key={`archive-row:${groupId}:${row.rowNumber}`}
                density={density}
                dragFeedbackIndicatorOpacity={dragFeedbackIndicatorOpacity}
                dragFeedbackTransitionMs={dragFeedbackTransitionMs}
                fieldResizePreview={activeResizePreview}
                groupId={groupId}
                hasActiveDrag={Boolean(dragFieldId)}
                normalizeColumn={normalizeColumn}
                onDeleteGroupRow={onDeleteGroupRow}
                onRemoveField={onRemoveField}
                onOpenFieldEditor={onOpenFieldEditor}
                onSelectField={onSelectField}
                onStartFieldResize={onStartFieldResize}
                openFieldEditorId={activeOpenFieldEditorId}
                optionMap={optionMap}
                renderBillStyleFieldPreview={renderBillStyleFieldPreview}
                row={row}
                rowDropTarget={rowDropTarget}
                selectedFieldId={activeSelectedFieldId}
              />
            );
          })}
        </div>
      </DesignerWorkbenchDropLane>
    </div>
  );
}, (prevProps, nextProps) => (
  prevProps.groupRenderModel === nextProps.groupRenderModel
  && prevProps.density === nextProps.density
  && prevProps.dragFieldId === nextProps.dragFieldId
  && prevProps.selectedGroupId === nextProps.selectedGroupId
  && prevProps.selectedFieldId === nextProps.selectedFieldId
  && prevProps.openFieldEditorId === nextProps.openFieldEditorId
  && prevProps.fieldResizePreview === nextProps.fieldResizePreview
  && areFieldDropTargetsEqual(prevProps.currentGroupDropTarget, nextProps.currentGroupDropTarget)
  && prevProps.dragFeedbackTransitionMs === nextProps.dragFeedbackTransitionMs
  && prevProps.dragFeedbackIndicatorOpacity === nextProps.dragFeedbackIndicatorOpacity
));

function useArchiveLayoutDragFeedbackState() {
  const [dragFieldId, setDragFieldId] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<FieldDropTarget | null>(null);
  const [visualDropTarget, setVisualDropTarget] = React.useState<FieldDropTarget | null>(null);
  const [isDragFeedbackSettling, setIsDragFeedbackSettling] = React.useState(false);
  const [dragOverlayOffset, setDragOverlayOffset] = React.useState<{ x: number; y: number } | null>(null);
  const [dragOverlayMotionIntensity, setDragOverlayMotionIntensity] = React.useState(0);
  const lastDragOverIdRef = React.useRef<string | null>(null);
  const dropTargetCommittedAtRef = React.useRef(0);
  const visualDropTargetRef = React.useRef<FieldDropTarget | null>(null);
  const visualDropTargetTimerRef = React.useRef<number | null>(null);
  const visualDropTargetLockedUntilRef = React.useRef(0);
  const dragFeedbackSettlingTimerRef = React.useRef<number | null>(null);
  const dragOverlayVisualPositionRef = React.useRef<{ x: number; y: number } | null>(null);
  const dragOverlayLastTickRef = React.useRef<number | null>(null);
  const dragOverlayMotionIntensityRef = React.useRef(0);
  const dragOverlayMotionFrameRef = React.useRef<number | null>(null);

  const getDragNow = React.useCallback(
    () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now()),
    [],
  );
  const setDropTargetIfChanged = React.useCallback((nextTarget: FieldDropTarget | null) => {
    setDropTarget((current) => {
      if (areFieldDropTargetsEqual(current, nextTarget)) {
        return current;
      }
      dropTargetCommittedAtRef.current = nextTarget ? getDragNow() : 0;
      return nextTarget;
    });
  }, [getDragNow]);
  const setDropTargetWithHysteresis = React.useCallback((nextTarget: FieldDropTarget | null) => {
    setDropTarget((current) => {
      if (areFieldDropTargetsEqual(current, nextTarget)) {
        return current;
      }
      if (!nextTarget) {
        dropTargetCommittedAtRef.current = 0;
        return null;
      }
      const now = getDragNow();
      const isWithinSameRow =
        current?.groupId === nextTarget.groupId
        && current?.rowNumber === nextTarget.rowNumber
        && current?.mode === nextTarget.mode;
      const changedInsertAnchor = current?.beforeId !== nextTarget.beforeId;
      const changedRowWithinSameGroup =
        current?.groupId === nextTarget.groupId
        && current?.rowNumber != null
        && nextTarget.rowNumber != null
        && current.rowNumber !== nextTarget.rowNumber;
      if (
        isWithinSameRow
        && changedInsertAnchor
        && now - dropTargetCommittedAtRef.current < DASHBOARD_DRAG_FEEDBACK_SAME_ROW_HYSTERESIS_MS
      ) {
        return current;
      }
      if (
        changedRowWithinSameGroup
        && now - dropTargetCommittedAtRef.current < DASHBOARD_DRAG_FEEDBACK_CROSS_ROW_HYSTERESIS_MS
      ) {
        return current;
      }
      dropTargetCommittedAtRef.current = now;
      return nextTarget;
    });
  }, [getDragNow]);
  const updateDragOverlayMotionIntensity = React.useCallback((nextIntensity: number) => {
    const normalizedIntensity = clampNumber(nextIntensity, 0, 1);
    dragOverlayMotionIntensityRef.current = normalizedIntensity;
    if (typeof window === 'undefined') {
      setDragOverlayMotionIntensity(normalizedIntensity);
      return;
    }
    if (dragOverlayMotionFrameRef.current !== null) {
      return;
    }
    dragOverlayMotionFrameRef.current = window.requestAnimationFrame(() => {
      dragOverlayMotionFrameRef.current = null;
      setDragOverlayMotionIntensity(dragOverlayMotionIntensityRef.current);
    });
  }, []);
  const commitVisualDropTarget = React.useCallback((nextTarget: FieldDropTarget | null, lockMs?: number) => {
    const resolvedLockMs = lockMs ?? (
      nextTarget
        ? Math.round(
            DASHBOARD_DRAG_FEEDBACK_LOCK_MS
            + dragOverlayMotionIntensityRef.current * DASHBOARD_DRAG_FEEDBACK_LOCK_MOTION_EXTRA_MS,
          )
        : 0
    );
    visualDropTargetRef.current = nextTarget;
    visualDropTargetLockedUntilRef.current = nextTarget ? getDragNow() + resolvedLockMs : 0;
    setVisualDropTarget(nextTarget);
  }, [getDragNow]);
  const clearDragFeedbackSettling = React.useCallback(() => {
    if (typeof window !== 'undefined' && dragFeedbackSettlingTimerRef.current !== null) {
      window.clearTimeout(dragFeedbackSettlingTimerRef.current);
      dragFeedbackSettlingTimerRef.current = null;
    }
    setIsDragFeedbackSettling(false);
  }, []);
  const startDragFeedbackSettling = React.useCallback((holdMs = DASHBOARD_DRAG_FEEDBACK_SETTLE_MS) => {
    if (!visualDropTargetRef.current) {
      clearDragFeedbackSettling();
      return;
    }
    if (typeof window === 'undefined') {
      setIsDragFeedbackSettling(false);
      return;
    }
    if (dragFeedbackSettlingTimerRef.current !== null) {
      window.clearTimeout(dragFeedbackSettlingTimerRef.current);
      dragFeedbackSettlingTimerRef.current = null;
    }
    setIsDragFeedbackSettling(true);
    dragFeedbackSettlingTimerRef.current = window.setTimeout(() => {
      dragFeedbackSettlingTimerRef.current = null;
      setIsDragFeedbackSettling(false);
      commitVisualDropTarget(null, 0);
    }, holdMs);
  }, [clearDragFeedbackSettling, commitVisualDropTarget]);


  React.useEffect(() => {
    visualDropTargetRef.current = visualDropTarget;
  }, [visualDropTarget]);
  React.useEffect(() => {
    if (typeof window === 'undefined') {
      commitVisualDropTarget(dropTarget, 0);
      return;
    }
    if (visualDropTargetTimerRef.current !== null) {
      window.clearTimeout(visualDropTargetTimerRef.current);
      visualDropTargetTimerRef.current = null;
    }
    if (!dragFieldId) {
      if (isDragFeedbackSettling) {
        return;
      }
      commitVisualDropTarget(null, 0);
      return;
    }
    const currentVisual = visualDropTargetRef.current;
    if (areFieldDropTargetsEqual(currentVisual, dropTarget)) {
      return;
    }
    if (!currentVisual) {
      commitVisualDropTarget(dropTarget);
      return;
    }
    const now = getDragNow();
    const visualLockRemaining = Math.max(0, visualDropTargetLockedUntilRef.current - now);
    const visualSwapDelay = Math.max(
      Math.round(
        (dropTarget ? DASHBOARD_DRAG_FEEDBACK_VISUAL_ENTER_MS : DASHBOARD_DRAG_FEEDBACK_VISUAL_EXIT_MS)
        + dragOverlayMotionIntensityRef.current * DASHBOARD_DRAG_FEEDBACK_VISUAL_DELAY_MOTION_EXTRA_MS,
      ),
      visualLockRemaining,
    );
    visualDropTargetTimerRef.current = window.setTimeout(() => {
      commitVisualDropTarget(dropTarget);
      visualDropTargetTimerRef.current = null;
    }, visualSwapDelay);
    return () => {
      if (visualDropTargetTimerRef.current !== null) {
        window.clearTimeout(visualDropTargetTimerRef.current);
        visualDropTargetTimerRef.current = null;
      }
    };
  }, [commitVisualDropTarget, dragFieldId, dropTarget, getDragNow, isDragFeedbackSettling, visualDropTarget]);
  React.useEffect(() => () => {
    if (typeof window !== 'undefined' && dragOverlayMotionFrameRef.current !== null) {
      window.cancelAnimationFrame(dragOverlayMotionFrameRef.current);
      dragOverlayMotionFrameRef.current = null;
    }
    if (typeof window !== 'undefined' && dragFeedbackSettlingTimerRef.current !== null) {
      window.clearTimeout(dragFeedbackSettlingTimerRef.current);
      dragFeedbackSettlingTimerRef.current = null;
    }
  }, []);

  const dragOverlayModifiers = React.useMemo<Modifier[]>(() => {
    if (!dragOverlayOffset) {
      return [];
    }
    return [
      ({ transform }) => {
        const targetX = transform.x - dragOverlayOffset.x + 18;
        const targetY = transform.y - dragOverlayOffset.y + 12;
        const now = getDragNow();
        const previousVisualPosition = dragOverlayVisualPositionRef.current;
        if (!previousVisualPosition) {
          dragOverlayVisualPositionRef.current = { x: targetX, y: targetY };
          dragOverlayLastTickRef.current = now;
          updateDragOverlayMotionIntensity(0);
          return { ...transform, x: targetX, y: targetY };
        }
        const previousTick = dragOverlayLastTickRef.current ?? now;
        const delta = Math.max(8, Math.min(28, now - previousTick));
        const blend = Math.min(0.58, 0.24 + delta / 52);
        const nextX = previousVisualPosition.x + (targetX - previousVisualPosition.x) * blend;
        const nextY = previousVisualPosition.y + (targetY - previousVisualPosition.y) * blend;
        const lagDistance = Math.hypot(targetX - nextX, targetY - nextY);
        dragOverlayVisualPositionRef.current = { x: nextX, y: nextY };
        dragOverlayLastTickRef.current = now;
        updateDragOverlayMotionIntensity(lagDistance / 30);
        return { ...transform, x: nextX, y: nextY };
      },
    ];
  }, [dragOverlayOffset, getDragNow, updateDragOverlayMotionIntensity]);
  const collisionDetection = React.useCallback<CollisionDetection>((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      const nextId = getFirstCollision(pointerCollisions, 'id');
      lastDragOverIdRef.current = nextId == null ? null : String(nextId);
      return pointerCollisions;
    }
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      const nextId = getFirstCollision(rectCollisions, 'id');
      lastDragOverIdRef.current = nextId == null ? null : String(nextId);
      return rectCollisions;
    }
    const centerCollisions = closestCenter(args);
    if (centerCollisions.length > 0) {
      const nextId = getFirstCollision(centerCollisions, 'id');
      lastDragOverIdRef.current = nextId == null ? null : String(nextId);
      return centerCollisions;
    }
    if (lastDragOverIdRef.current) {
      const fallbackContainer = args.droppableContainers.find(
        (container) => String(container.id) === lastDragOverIdRef.current,
      );
      if (fallbackContainer) {
        return [{
          id: fallbackContainer.id,
          data: { droppableContainer: fallbackContainer, value: 1 },
        }];
      }
    }
    return [];
  }, []);
  const beginFieldDrag = React.useCallback((event: DragStartEvent, resolvedFieldId: string | null) => {
    const activatorPoint = getClientPointFromActivatorEvent(event.activatorEvent);
    const initialRect = event.active.rect.current.initial;
    lastDragOverIdRef.current = null;
    dragOverlayVisualPositionRef.current = null;
    dragOverlayLastTickRef.current = null;
    dragOverlayMotionIntensityRef.current = 0;
    clearDragFeedbackSettling();
    if (typeof window !== 'undefined' && dragOverlayMotionFrameRef.current !== null) {
      window.cancelAnimationFrame(dragOverlayMotionFrameRef.current);
      dragOverlayMotionFrameRef.current = null;
    }
    setDragOverlayMotionIntensity(0);
    setDragFieldId(resolvedFieldId);
    setDropTargetIfChanged(null);
    setDragOverlayOffset(
      activatorPoint && initialRect
        ? { x: activatorPoint.x - initialRect.left, y: activatorPoint.y - initialRect.top }
        : null,
    );
  }, [clearDragFeedbackSettling, setDropTargetIfChanged]);
  const settleAfterDrag = React.useCallback((holdMs: number) => {
    lastDragOverIdRef.current = null;
    dragOverlayVisualPositionRef.current = null;
    dragOverlayLastTickRef.current = null;
    dragOverlayMotionIntensityRef.current = 0;
    if (typeof window !== 'undefined' && dragOverlayMotionFrameRef.current !== null) {
      window.cancelAnimationFrame(dragOverlayMotionFrameRef.current);
      dragOverlayMotionFrameRef.current = null;
    }
    setDragOverlayMotionIntensity(0);
    setDragFieldId(null);
    setDropTargetIfChanged(null);
    setDragOverlayOffset(null);
    startDragFeedbackSettling(holdMs);
  }, [setDropTargetIfChanged, startDragFeedbackSettling]);

  return {
    beginFieldDrag,
    collisionDetection,
    dragFieldId,
    dragFeedbackMotion: dragFieldId ? clampNumber(dragOverlayMotionIntensity, 0, 1) : 0,
    dragOverlayModifiers,
    dragOverlayMotionIntensity,
    dropTarget,
    isDragFeedbackSettling,
    renderDropTarget: dragFieldId || isDragFeedbackSettling ? visualDropTarget : null,
    settleAfterDrag,
    setDropTargetIfChanged,
    setDropTargetWithHysteresis,
  };
}

export const ArchiveLayoutFieldLayoutEditor = React.memo(function ArchiveLayoutFieldLayoutEditor({
  buildSchemeDocument,
  document,
  fieldOptions,
  getDefaultSize,
  normalizeColumn,
  onDocumentChange,
  onSchemesChange,
  schemes,
  suggestedScheme,
}: ArchiveLayoutFieldLayoutEditorProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const documentPreviewWorkbenchWidth = React.useMemo(
    () => getPreviewWorkbenchWidthFromDocument(document),
    [document],
  );
  const [previewWorkbenchWidth, setPreviewWorkbenchWidth] = React.useState(documentPreviewWorkbenchWidth);
  const [previewWorkbenchWidthDraft, setPreviewWorkbenchWidthDraft] = React.useState(documentPreviewWorkbenchWidth);
  const [previewWorkbenchWidthInput, setPreviewWorkbenchWidthInput] = React.useState(String(documentPreviewWorkbenchWidth));
  const stabilizedDocument = React.useMemo(
    () => stabilizeDocument(document, fieldOptions, getDefaultSize, undefined, undefined, previewWorkbenchWidth),
    [document, fieldOptions, getDefaultSize, previewWorkbenchWidth],
  );
  const optionMap = React.useMemo(() => getFieldOptionMap(fieldOptions), [fieldOptions]);
  const groups = React.useMemo(() => buildGroupViewModels(stabilizedDocument), [stabilizedDocument]);
  const usablePreviewWorkbenchWidth = React.useMemo(
    () => getGroupFlowUsableWidth(previewWorkbenchWidth),
    [previewWorkbenchWidth],
  );
  const [keyword, setKeyword] = React.useState('');
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(groups[0]?.group.id ?? null);
  const [selectedFieldId, setSelectedFieldId] = React.useState<string | null>(null);
  const [openFieldEditorId, setOpenFieldEditorId] = React.useState<string | null>(null);
  const [density] = React.useState<'comfortable' | 'compact'>('comfortable');
  const [fieldResizeState, setFieldResizeState] = React.useState<FieldResizeState | null>(null);
  const [fieldResizePreview, setFieldResizePreview] = React.useState<FieldResizePreview | null>(null);
  const [quickEditorSizeInput, setQuickEditorSizeInput] = React.useState<FieldSizeInputDraft>({ fieldId: null, h: '', w: '' });
  const [sidebarTab, setSidebarTab] = React.useState<SidebarTabKey>('fields');
  const outsideCloseBlockedUntilRef = React.useRef(0);
  const fieldResizePreviewRef = React.useRef<FieldResizePreview | null>(null);
  const fieldResizeFrameRef = React.useRef<number | null>(null);
  const {
    beginFieldDrag,
    collisionDetection,
    dragFieldId,
    dragFeedbackMotion,
    dragOverlayModifiers,
    dragOverlayMotionIntensity,
    dropTarget,
    renderDropTarget,
    settleAfterDrag,
    setDropTargetIfChanged,
    setDropTargetWithHysteresis,
  } = useArchiveLayoutDragFeedbackState();
  React.useEffect(() => {
    setPreviewWorkbenchWidth(documentPreviewWorkbenchWidth);
    setPreviewWorkbenchWidthDraft(documentPreviewWorkbenchWidth);
    setPreviewWorkbenchWidthInput(String(documentPreviewWorkbenchWidth));
  }, [documentPreviewWorkbenchWidth]);

  React.useEffect(() => {
    if (!selectedGroupId || !groups.some((group) => group.group.id === selectedGroupId)) {
      setSelectedGroupId(groups[0]?.group.id ?? null);
    }
  }, [groups, selectedGroupId]);

  React.useEffect(() => {
    if (!selectedFieldId || stabilizedDocument.items.some((item) => item.id === selectedFieldId)) {
      return;
    }
    setSelectedFieldId(null);
  }, [selectedFieldId, stabilizedDocument.items]);

  const placedFieldIds = React.useMemo(
    () => new Set(stabilizedDocument.items.filter((item) => item.type !== 'groupbox' && item.field).map((item) => String(item.field))),
    [stabilizedDocument.items],
  );
  const hasSourcePlacedFields = React.useMemo(
    () => document.items.some((item) => item.type !== 'groupbox' && item.field),
    [document.items],
  );
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredOptions = React.useMemo(() => fieldOptions.filter((option) => {
    const text = `${option.title || ''} ${option.label || ''} ${option.description || ''}`.toLowerCase();
    return !normalizedKeyword || text.includes(normalizedKeyword);
  }), [fieldOptions, normalizedKeyword]);
  const placedOptions = React.useMemo(
    () => filteredOptions.filter((option) => placedFieldIds.has(String(option.value))),
    [filteredOptions, placedFieldIds],
  );
  const pendingOptions = React.useMemo(
    () => filteredOptions.filter((option) => !placedFieldIds.has(String(option.value))),
    [filteredOptions, placedFieldIds],
  );
  const hasPlacedFields = placedFieldIds.size > 0;
  const dragFeedbackTransitionMs = DASHBOARD_DRAG_MOTION_BASE_MS + Math.round(dragFeedbackMotion * DASHBOARD_DRAG_FEEDBACK_MOTION_EXTRA_MS);
  const dragFeedbackIndicatorOpacity = 1 - dragFeedbackMotion * 0.18;
  const staticWorkbenchMotionStyle = React.useMemo(
    () => ({
      transitionDuration: `${DASHBOARD_DRAG_MOTION_BASE_MS}ms`,
      transitionTimingFunction: DASHBOARD_DRAG_MOTION_EASING,
    }),
    [],
  );
  const schemeModalSurfaceButtonClass = 'transition-[background-color,color,border-color,box-shadow,transform] hover:-translate-y-[1px] hover:shadow-[0_12px_24px_-22px_rgba(15,23,42,0.18)] active:translate-y-0';
  const schemeModalInputClass = 'transition-[border-color,background-color,box-shadow] focus:border-primary/35 focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]';
  const schemeModalCardClass = 'transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-[1px] hover:shadow-[0_14px_28px_-26px_rgba(15,23,42,0.18)]';
  const schemeModalSelectedCardClass = 'shadow-[0_16px_30px_-28px_rgba(59,130,246,0.34)]';
  const shouldAutoOpenSchemeModal = !hasPlacedFields && !hasSourcePlacedFields;
  const syncPreviewWorkbenchWidthState = React.useCallback((nextWidth: number) => {
    const normalizedWidth = normalizePreviewWorkbenchWidth(nextWidth);
    setPreviewWorkbenchWidth(normalizedWidth);
    setPreviewWorkbenchWidthDraft(normalizedWidth);
    setPreviewWorkbenchWidthInput(String(normalizedWidth));
    return normalizedWidth;
  }, []);
  const commitDocument = React.useCallback((nextDocument: DetailLayoutDocument, nextPreviewWorkbenchWidth = previewWorkbenchWidth) => {
    const normalizedWidth = syncPreviewWorkbenchWidthState(nextPreviewWorkbenchWidth);
    onDocumentChange(stabilizeDocument(nextDocument, fieldOptions, getDefaultSize, undefined, undefined, normalizedWidth));
  }, [fieldOptions, getDefaultSize, onDocumentChange, previewWorkbenchWidth, syncPreviewWorkbenchWidthState]);
  const commitPreviewWorkbenchWidth = React.useCallback((nextWidth: number) => {
    const normalizedWidth = syncPreviewWorkbenchWidthState(nextWidth);
    onDocumentChange(stabilizeDocument(stabilizedDocument, fieldOptions, getDefaultSize, undefined, undefined, normalizedWidth));
  }, [fieldOptions, getDefaultSize, onDocumentChange, stabilizedDocument, syncPreviewWorkbenchWidthState]);
  const handlePreviewWorkbenchWidthSliderChange = React.useCallback((nextWidth: number) => {
    const normalizedWidth = normalizePreviewWorkbenchWidth(nextWidth);
    setPreviewWorkbenchWidthDraft(normalizedWidth);
    setPreviewWorkbenchWidthInput(String(normalizedWidth));
  }, []);
  const handlePreviewWorkbenchWidthPresetSelect = React.useCallback((preset: WidthPreset) => {
    const nextWidth = PREVIEW_WIDTH_PRESETS.find((item) => item.key === preset)?.value ?? PREVIEW_WIDTH_MAX;
    setPreviewWorkbenchWidthDraft(nextWidth);
    setPreviewWorkbenchWidthInput(String(nextWidth));
    commitPreviewWorkbenchWidth(nextWidth);
  }, [commitPreviewWorkbenchWidth]);
  const handlePreviewWorkbenchWidthSliderCommit = React.useCallback(() => {
    commitPreviewWorkbenchWidth(previewWorkbenchWidthDraft);
  }, [commitPreviewWorkbenchWidth, previewWorkbenchWidthDraft]);

  const handleOpenSchemesView = React.useCallback(() => {
    setSidebarTab('schemes');
  }, []);
  const handleOpenStructureView = React.useCallback(() => {
    setSidebarTab('structure');
  }, []);
  const schemeWorkbench = useArchiveLayoutSchemeWorkbench({
    buildCurrentLayoutScheme: () => buildSchemeFromCurrentLayout(groups),
    buildSchemeDocument,
    commitDocument,
    fieldOptions,
    getDefaultSize,
    hasPlacedFields,
    onOpenSchemesView: handleOpenSchemesView,
    onOpenStructureView: handleOpenStructureView,
    onSchemesChange,
    previewWorkbenchWidth,
    schemes,
    shouldAutoOpen: shouldAutoOpenSchemeModal,
    suggestedScheme,
  });
  const {
    addSchemeGroup,
    applySchemeBatchFieldSize,
    applySchemeDraft,
    applySpecificScheme,
    closeSchemeModal,
    createNewSchemeDraft,
    createSchemeFromCurrentLayout,
    deleteActiveScheme,
    duplicateScheme,
    filteredSelectedSchemeFieldCount,
    filteredUnassignedSchemeFieldCount,
    handleCommitSchemeFieldSizeDraft,
    handleNudgeSchemeFieldSizeDraft,
    handleResetSchemeFieldSizeDraft,
    handleSchemeFieldCheckedChange,
    handleSchemeFieldSizeDraftChange,
    handleSchemeFieldSizeInputKeyDown,
    handleSchemePreviewWorkbenchWidthInputBlur,
    handleSchemePreviewWorkbenchWidthInputChange,
    handleSchemePreviewWorkbenchWidthInputKeyDown,
    handleSchemePreviewWorkbenchWidthPresetSelect,
    handleSchemePreviewWorkbenchWidthSliderChange,
    handleToggleSchemeFieldExpanded,
    isBatchSizePanelOpen,
    isEditingUnsavedScheme,
    isSchemeModalOpen,
    moveCurrentSchemeGroupFields,
    moveSchemeFieldToGroup,
    moveSchemeGroup,
    openSchemeModal,
    removeSchemeGroup,
    renameSchemeGroup,
    saveSchemeDraft,
    saveSchemeDraftAsCopy,
    schemeBatchSizeInput,
    schemeDraft,
    schemeFieldFilterMode,
    schemeFieldKeyword,
    schemeFieldSearchInputRef,
    schemePreviewWorkbenchWidthInput,
    schemeSourceId,
    selectedSchemeBatchFieldIds,
    selectedSchemeFieldCount,
    selectedSchemeGroup,
    selectedSchemeGroupFieldCount,
    selectedSchemeGroupId,
    selectedSchemeGroupIndex,
    setIsBatchSizePanelOpen,
    setSchemeBatchSizeInput,
    setSchemeDraftName,
    setSchemeFieldFilterMode,
    setSchemeFieldKeyword,
    setSelectedSchemeGroupId,
    visibleSchemeFieldRows,
    selectScheme,
  } = schemeWorkbench;

  const fieldIdToGroupId = React.useMemo(() => {
    const nextMap = new Map<string, string>();
    groups.forEach((group) => {
      group.fields.forEach((field) => {
        nextMap.set(field.id, group.group.id);
      });
    });
    return nextMap;
  }, [groups]);
  const groupViewModelById = React.useMemo(() => {
    const nextMap = new Map<string, ArchiveLayoutGroupViewModel>();
    groups.forEach((group) => {
      nextMap.set(group.group.id, group);
    });
    return nextMap;
  }, [groups]);
  const groupTitleById = React.useMemo(() => {
    const nextMap = new Map<string, string>();
    groups.forEach((group) => {
      nextMap.set(group.group.id, String(group.group.title || '未分组'));
    });
    return nextMap;
  }, [groups]);
  const normalizedDraftsByGroupId = React.useMemo(() => {
    const nextMap = new Map<string, FlowDraft[]>();
    groups.forEach((group) => {
      nextMap.set(group.group.id, normalizeDrafts(group.fields));
    });
    return nextMap;
  }, [groups]);
  const groupIdOrder = React.useMemo(
    () => groups.map((group) => group.group.id),
    [groups],
  );
  const firstGroupId = groupIdOrder[0] ?? null;
  const fieldDraftById = React.useMemo(() => {
    const nextMap = new Map<string, FlowDraft>();
    groups.forEach((group) => {
      group.fields.forEach((field) => {
        nextMap.set(field.id, field);
      });
    });
    return nextMap;
  }, [groups]);
  const rowFieldIdsByGroupRow = React.useMemo(() => {
    const nextMap = new Map<string, string[]>();
    groups.forEach((group) => {
      const rowMap = new Map<number, FlowDraft[]>();
      group.fields.forEach((field) => {
        const rowFields = rowMap.get(field.panelRow) ?? [];
        rowFields.push(field);
        rowMap.set(field.panelRow, rowFields);
      });
      rowMap.forEach((rowFields, rowNumber) => {
        nextMap.set(
          `${group.group.id}:${rowNumber}`,
          rowFields
            .slice()
            .sort((left, right) => left.panelOrder - right.panelOrder || left.x - right.x)
            .map((field) => field.id),
        );
      });
    });
    return nextMap;
  }, [groups]);
  const fieldContextById = React.useMemo(() => {
    const nextMap = new Map<string, SelectedFieldContext>();
    groups.forEach((group) => {
      group.fields.forEach((field) => {
        nextMap.set(field.id, { field, group });
      });
    });
    return nextMap;
  }, [groups]);

  const mutateDrafts = React.useCallback((mutator: (draftMap: Map<string, FlowDraft[]>, groupOrder: string[]) => void) => {
    const draftMap = new Map<string, FlowDraft[]>(
      Array.from(normalizedDraftsByGroupId.entries()).map(([groupId, drafts]) => [groupId, drafts.slice()]),
    );
    const groupOrder = groupIdOrder.slice();
    mutator(draftMap, groupOrder);
    commitDocument(stabilizeDocument(stabilizedDocument, fieldOptions, getDefaultSize, draftMap, groupOrder, previewWorkbenchWidth));
  }, [commitDocument, fieldOptions, getDefaultSize, groupIdOrder, normalizedDraftsByGroupId, previewWorkbenchWidth, stabilizedDocument]);

  const addFieldToGroup = React.useCallback((fieldId: string, targetGroupId?: string | null) => {
    const option = optionMap.get(fieldId);
    if (!option) {
      return;
    }

    const groupId = targetGroupId || selectedGroupId || firstGroupId;
    if (placedFieldIds.has(fieldId) && groupId) {
      setSelectedGroupId(groupId);
      return;
    }

    const defaultSize = getDefaultSize(option.rawField as Record<string, any>);
    const nextField: FlowDraft = {
      field: fieldId,
      h: clampNumber(defaultSize.h, BILL_FORM_MIN_CONTROL_HEIGHT, 160),
      id: `archive_layout_field_${fieldId}_${Date.now()}`,
      panelOrder: 999,
      panelRow: 1,
      parentId: groupId,
      readOnly: Boolean(option.readOnly),
      required: Boolean(option.required),
      title: option.title || option.label,
      type: option.itemType,
      w: clampNumber(defaultSize.w, BILL_FORM_MIN_WIDTH, usablePreviewWorkbenchWidth),
      x: 0,
      y: 0,
    };

    if (!groupId) {
      const nextGroupId = `archive_layout_group_${Date.now()}`;
      const nextGroup: DetailLayoutItem = {
        h: GROUP_MIN_HEIGHT,
        id: nextGroupId,
        type: 'groupbox',
        w: previewWorkbenchWidth,
        x: 24,
        y: 24,
        title: DEFAULT_GROUP_TITLE,
      };
      (nextGroup as DetailLayoutItem & { rows?: number }).rows = GROUP_DEFAULT_ROWS;
      commitDocument(createEmptyDetailLayoutDocument({
        gridSize: stabilizedDocument.gridSize,
        items: [
          ...stabilizedDocument.items,
          nextGroup,
          {
            ...nextField,
            parentId: nextGroupId,
          },
        ],
      }));
      setSelectedGroupId(nextGroupId);
      setSelectedFieldId(nextField.id);
      return;
    }

    mutateDrafts((draftMap) => {
      const current = draftMap.get(groupId) ?? [];
      draftMap.set(groupId, [...current, nextField]);
    });
    setSelectedGroupId(groupId);
    setSelectedFieldId(nextField.id);
  }, [commitDocument, firstGroupId, getDefaultSize, mutateDrafts, optionMap, placedFieldIds, previewWorkbenchWidth, selectedGroupId, stabilizedDocument.gridSize, stabilizedDocument.items, usablePreviewWorkbenchWidth]);

  const updateField = React.useCallback((fieldId: string, patch: Partial<FlowDraft>) => {
    mutateDrafts((draftMap) => {
      draftMap.forEach((drafts, groupId) => {
        const index = drafts.findIndex((item) => item.id === fieldId);
        if (index === -1) {
          return;
        }

        const nextItem = { ...drafts[index], ...patch };
        if (patch.parentId && patch.parentId !== groupId) {
          draftMap.set(groupId, drafts.filter((item) => item.id !== fieldId));
          draftMap.set(String(patch.parentId), [...(draftMap.get(String(patch.parentId)) ?? []), nextItem]);
          return;
        }

        const nextDrafts = drafts.slice();
        nextDrafts[index] = nextItem;
        draftMap.set(groupId, nextDrafts);
      });
    });
  }, [mutateDrafts]);

  const startFieldResize = React.useCallback((
    event: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>,
    field: FlowDraft,
    dimension: 'h' | 'w',
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedFieldId(field.id);
    const initialPreview = {
      fieldId: field.id,
      h: field.h,
      w: field.w,
    } satisfies FieldResizePreview;
    fieldResizePreviewRef.current = initialPreview;
    setFieldResizePreview(initialPreview);
    setFieldResizeState({
      dimension,
      fieldId: field.id,
      startHeight: field.h,
      startMouseX: event.clientX,
      startMouseY: event.clientY,
      startWidth: field.w,
    });
  }, []);

  const removeField = React.useCallback((fieldId: string) => {
    mutateDrafts((draftMap) => {
      draftMap.forEach((drafts, groupId) => {
        draftMap.set(groupId, drafts.filter((item) => item.id !== fieldId));
      });
    });
    if (openFieldEditorId === fieldId) {
      setOpenFieldEditorId(null);
    }
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  }, [mutateDrafts, openFieldEditorId, selectedFieldId]);

  React.useEffect(() => {
    if (!fieldResizeState) {
      return undefined;
    }

    const bodyStyle = globalThis.document?.body?.style;
    if (bodyStyle) {
      bodyStyle.cursor = fieldResizeState.dimension === 'w' ? 'col-resize' : 'row-resize';
      bodyStyle.userSelect = 'none';
    }

    const applyPreview = (nextPreview: FieldResizePreview) => {
      fieldResizePreviewRef.current = nextPreview;
      if (fieldResizeFrameRef.current !== null) {
        cancelAnimationFrame(fieldResizeFrameRef.current);
      }
      fieldResizeFrameRef.current = requestAnimationFrame(() => {
        setFieldResizePreview(nextPreview);
        fieldResizeFrameRef.current = null;
      });
    };

    const finishResize = () => {
      if (fieldResizeFrameRef.current !== null) {
        cancelAnimationFrame(fieldResizeFrameRef.current);
        fieldResizeFrameRef.current = null;
      }
      const finalPreview = fieldResizePreviewRef.current;
      if (finalPreview && finalPreview.fieldId === fieldResizeState.fieldId) {
        updateField(fieldResizeState.fieldId, { h: finalPreview.h, w: finalPreview.w });
      }
      fieldResizePreviewRef.current = null;
      setFieldResizePreview(null);
      setFieldResizeState(null);
      if (bodyStyle) {
        bodyStyle.cursor = '';
        bodyStyle.userSelect = '';
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (fieldResizeState.dimension === 'w') {
        applyPreview({
          fieldId: fieldResizeState.fieldId,
          h: fieldResizePreviewRef.current?.h ?? fieldResizeState.startHeight,
          w: clampNumber(
            Math.round(fieldResizeState.startWidth + (event.clientX - fieldResizeState.startMouseX)),
            BILL_FORM_MIN_WIDTH,
            usablePreviewWorkbenchWidth,
          ),
        });
        return;
      }

      applyPreview({
        fieldId: fieldResizeState.fieldId,
        h: clampNumber(
          Math.round(fieldResizeState.startHeight + (event.clientY - fieldResizeState.startMouseY)),
          BILL_FORM_MIN_CONTROL_HEIGHT,
          160,
        ),
        w: fieldResizePreviewRef.current?.w ?? fieldResizeState.startWidth,
      });
    };

    const handlePointerUp = () => {
      finishResize();
    };

    const handleWindowBlur = () => {
      finishResize();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
    window.addEventListener('pointercancel', handlePointerUp, { once: true });
    window.addEventListener('blur', handleWindowBlur, { once: true });

    return () => {
      if (fieldResizeFrameRef.current !== null) {
        cancelAnimationFrame(fieldResizeFrameRef.current);
        fieldResizeFrameRef.current = null;
      }
      if (bodyStyle) {
        bodyStyle.cursor = '';
        bodyStyle.userSelect = '';
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [fieldResizeState, updateField, usablePreviewWorkbenchWidth]);

  const renameGroup = React.useCallback((groupId: string, title: string) => {
    const nextDocument = createEmptyDetailLayoutDocument({
      gridSize: stabilizedDocument.gridSize,
      items: stabilizedDocument.items.map((item) => (
        item.id === groupId ? { ...item, title } : item
      )),
    });
    commitDocument(nextDocument);
  }, [commitDocument, stabilizedDocument.gridSize, stabilizedDocument.items]);

  const addGroupRow = React.useCallback((groupId: string) => {
    const groupContext = groupViewModelById.get(groupId);
    if (!groupContext) {
      return;
    }

    const actualRowCount = Math.max(1, groupContext.fields.reduce((max, item) => Math.max(max, item.panelRow), 1));
    const currentRowCount = Math.max(actualRowCount, Number((groupContext.group as DetailLayoutItem & { rows?: number }).rows) || 0);
    const nextDocument = createEmptyDetailLayoutDocument({
      gridSize: stabilizedDocument.gridSize,
      items: stabilizedDocument.items.map((item) => (
        item.id === groupId
          ? { ...item, rows: currentRowCount + 1 } as DetailLayoutItem & { rows?: number }
          : item
      )),
    });
    commitDocument(nextDocument);
    setSelectedGroupId(groupId);
  }, [commitDocument, groupViewModelById, stabilizedDocument.gridSize, stabilizedDocument.items]);

  const deleteGroupRow = React.useCallback((groupId: string) => {
    const groupContext = groupViewModelById.get(groupId);
    if (!groupContext) {
      return;
    }

    const actualRowCount = Math.max(1, groupContext.fields.reduce((max, item) => Math.max(max, item.panelRow), 1));
    const currentRowCount = Math.max(actualRowCount, Number((groupContext.group as DetailLayoutItem & { rows?: number }).rows) || 0);
    const nextRowCount = Math.max(actualRowCount, currentRowCount - 1);
    if (nextRowCount === currentRowCount) {
      return;
    }

    const nextDocument = createEmptyDetailLayoutDocument({
      gridSize: stabilizedDocument.gridSize,
      items: stabilizedDocument.items.map((item) => (
        item.id === groupId
          ? { ...item, rows: nextRowCount } as DetailLayoutItem & { rows?: number }
          : item
      )),
    });
    commitDocument(nextDocument);
    setSelectedGroupId(groupId);
  }, [commitDocument, groupViewModelById, stabilizedDocument.gridSize, stabilizedDocument.items]);

  const deleteGroup = React.useCallback((groupId: string) => {
    const nextItems = stabilizedDocument.items.filter((item) => item.id !== groupId && item.parentId !== groupId);
    const nextDocument = createEmptyDetailLayoutDocument({
      gridSize: stabilizedDocument.gridSize,
      items: nextItems,
    });
    commitDocument(nextDocument);
    if (selectedGroupId === groupId) {
      const fallbackGroup = nextItems.find((item) => item.type === 'groupbox');
      setSelectedGroupId(fallbackGroup?.id ?? null);
    }
    if (openFieldEditorId && stabilizedDocument.items.some((item) => item.parentId === groupId && item.id === openFieldEditorId)) {
      setOpenFieldEditorId(null);
    }
    if (selectedFieldId && stabilizedDocument.items.some((item) => item.parentId === groupId && item.id === selectedFieldId)) {
      setSelectedFieldId(null);
    }
  }, [commitDocument, openFieldEditorId, selectedFieldId, selectedGroupId, stabilizedDocument.gridSize, stabilizedDocument.items]);
  const moveGroup = React.useCallback((groupId: string, direction: 'down' | 'up') => {
    mutateDrafts((draftMap, groupOrder) => {
      const currentIndex = groupOrder.findIndex((id) => id === groupId);
      if (currentIndex < 0) {
        return;
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= groupOrder.length) {
        return;
      }

      const [targetGroupId] = groupOrder.splice(currentIndex, 1);
      groupOrder.splice(targetIndex, 0, targetGroupId);
      if (!draftMap.has(targetGroupId)) {
        draftMap.set(targetGroupId, []);
      }
    });
    setSelectedGroupId(groupId);
  }, [mutateDrafts]);

  const moveField = React.useCallback((
    fieldId: string,
    targetGroupId: string,
    targetRowNumber: number = 1,
    beforeId: string | null = null,
  ) => {
    mutateDrafts((draftMap) => {
      let movingField: FlowDraft | null = null;
      draftMap.forEach((drafts, groupId) => {
        const index = drafts.findIndex((item) => item.id === fieldId);
        if (index === -1) {
          return;
        }
        movingField = {
          ...drafts[index],
          panelRow: Math.max(1, targetRowNumber),
          parentId: targetGroupId,
        };
        draftMap.set(groupId, reindexDrafts(drafts.filter((item) => item.id !== fieldId)));
      });

      if (!movingField) {
        return;
      }

      const targetDrafts: FlowDraft[] = reindexDrafts(draftMap.get(targetGroupId) ?? []).map((item) => ({
        ...item,
        parentId: targetGroupId,
      }));
      let insertIndex = -1;

      if (beforeId) {
        insertIndex = targetDrafts.findIndex((item) => item.id === beforeId);
      } else {
        const rowItems = targetDrafts.filter((item) => item.panelRow === Math.max(1, targetRowNumber));
        const lastRowItemId = rowItems[rowItems.length - 1]?.id;
        if (lastRowItemId) {
          const lastRowItemIndex = targetDrafts.findIndex((item) => item.id === lastRowItemId);
          insertIndex = lastRowItemIndex + 1;
        } else {
          insertIndex = targetDrafts.findIndex((item) => item.panelRow > Math.max(1, targetRowNumber));
        }
      }

      if (insertIndex >= 0) {
        targetDrafts.splice(insertIndex, 0, movingField);
      } else {
        targetDrafts.push(movingField);
      }

      draftMap.set(targetGroupId, reindexDrafts(targetDrafts));
    });
    setSelectedGroupId(targetGroupId);
    setSelectedFieldId(fieldId);
  }, [mutateDrafts]);

  const addGroup = React.useCallback(() => {
    const nextGroupId = `archive_layout_group_${Date.now()}`;
    const nextDocument = createEmptyDetailLayoutDocument({
      gridSize: stabilizedDocument.gridSize,
      items: [
        ...stabilizedDocument.items,
        (() => {
          const nextGroup: DetailLayoutItem = {
            h: GROUP_MIN_HEIGHT,
            id: nextGroupId,
            type: 'groupbox',
            w: previewWorkbenchWidth,
            x: 24,
            y: 24,
            title: `信息分组 ${groups.length + 1}`,
          };
          (nextGroup as DetailLayoutItem & { rows?: number }).rows = GROUP_DEFAULT_ROWS;
          return nextGroup;
        })(),
      ],
    });
    commitDocument(nextDocument);
    setSelectedGroupId(nextGroupId);
    setSelectedFieldId(null);
  }, [commitDocument, groups.length, previewWorkbenchWidth, stabilizedDocument.gridSize, stabilizedDocument.items]);

  const getFieldHeightPresetValue = React.useCallback((preset: HeightPreset, rawField?: Record<string, any>) => {
    const normalizedField = rawField ? normalizeColumn(rawField) : {};
    const typeText = String(
      normalizedField.type
      ?? normalizedField.fieldType
      ?? normalizedField.controlType
      ?? normalizedField.controltypename
      ?? '',
    ).toLowerCase();
    const isLongField = ['textarea', '备注', '说明', '描述', '富文本', 'markdown', '地址', '内容'].some((keyword) => typeText.includes(keyword.toLowerCase()));

    if (preset === 'single') {
      return BILL_FORM_MIN_CONTROL_HEIGHT;
    }
    if (preset === 'expanded') {
      return isLongField ? 124 : 88;
    }
    return isLongField ? 92 : 64;
  }, [normalizeColumn]);
  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const activeFieldId = parseArchiveFieldDragId(event.active.id);
    const activeData = event.active.data.current as FieldDragData | undefined;
    if (!activeFieldId && activeData?.type !== 'archive-field') {
      return;
    }
    beginFieldDrag(event, activeFieldId ?? activeData?.fieldId ?? null);
  }, [beginFieldDrag]);

  const handleDragOver = React.useCallback((event: DragOverEvent) => {
    const activeFieldId = parseArchiveFieldDragId(event.active.id);
    const overFieldId = parseArchiveFieldDragId(event.over?.id);
    const activeData = event.active.data.current as FieldDragData | undefined;
    const overData = event.over?.data.current as FieldDragData | GroupDragData | FieldInsertDropData | FieldRowDropData | undefined;
    const translatedActiveRect = event.active.rect.current.translated ?? event.active.rect.current.initial;
    const activeCenterX = translatedActiveRect
      ? translatedActiveRect.left + translatedActiveRect.width / 2
      : null;
    if (!activeFieldId && activeData?.type !== 'archive-field') {
      return;
    }
    if (overFieldId && overFieldId !== activeFieldId) {
      const targetGroupId = fieldIdToGroupId.get(overFieldId) ?? activeData?.groupId ?? '';
      const targetGroup = groupViewModelById.get(targetGroupId);
      const targetField = fieldDraftById.get(overFieldId);
      const rowFieldIds = targetField
        ? rowFieldIdsByGroupRow.get(`${targetGroup?.group.id}:${targetField.panelRow}`) ?? [overFieldId]
        : [overFieldId];
      const currentIndex = rowFieldIds.indexOf(overFieldId);
      const overRect = event.over?.rect ?? null;
      const leftBoundary = overRect ? overRect.left + overRect.width * 0.44 : null;
      const rightBoundary = overRect ? overRect.left + overRect.width * 0.56 : null;
      if (
        overRect
        && activeCenterX != null
        && leftBoundary != null
        && rightBoundary != null
        && activeCenterX > leftBoundary
        && activeCenterX < rightBoundary
        && dropTarget?.groupId === targetGroupId
        && dropTarget?.rowNumber === (targetField?.panelRow ?? null)
      ) {
        return;
      }
      const insertAfter = Boolean(
        overRect
        && activeCenterX != null
        && rightBoundary != null
        && activeCenterX >= rightBoundary,
      );
      const nextBeforeId = insertAfter
        ? rowFieldIds[currentIndex + 1] ?? null
        : overFieldId;
      setDropTargetWithHysteresis({
        beforeId: nextBeforeId,
        groupId: targetGroupId,
        rowNumber: targetField?.panelRow ?? null,
        mode: 'standard',
      });
      return;
    }
    if (overFieldId === activeFieldId) {
      return;
    }
    if (overData?.type === 'archive-field-row') {
      const rowFieldIds = rowFieldIdsByGroupRow.get(`${overData.groupId}:${overData.rowNumber}`) ?? [];
      const isEmptyRowTarget = rowFieldIds.length === 0;
      const overRect = event.over?.rect ?? null;
      const startHotZone = overRect ? Math.min(124, overRect.width * 0.2) : 0;
      const endHotZone = overRect ? Math.min(124, overRect.width * 0.2) : 0;
      if (isEmptyRowTarget) {
        setDropTargetIfChanged({
          beforeId: null,
          groupId: overData.groupId,
          rowNumber: overData.rowNumber,
          mode: 'row',
        });
        return;
      }
      const preferRowStart = Boolean(
        rowFieldIds.length > 0
        && overRect
        && activeCenterX != null
        && activeCenterX <= overRect.left + startHotZone,
      );
      const preferRowEnd = Boolean(
        rowFieldIds.length > 0
        && overRect
        && activeCenterX != null
        && activeCenterX >= overRect.right - endHotZone,
      );
      if (
        overRect
        && activeCenterX != null
        && !preferRowStart
        && !preferRowEnd
        && dropTarget?.groupId === overData.groupId
        && dropTarget?.rowNumber === overData.rowNumber
        && dropTarget?.mode === 'row'
      ) {
        return;
      }
      setDropTargetWithHysteresis({
        beforeId: preferRowStart ? rowFieldIds[0] ?? null : (preferRowEnd ? null : overData.beforeId),
        groupId: overData.groupId,
        rowNumber: overData.rowNumber,
        mode: 'row',
      });
      return;
    }
    if (overData?.type === 'archive-field-insert') {
      setDropTargetIfChanged({ beforeId: overData.beforeId, groupId: overData.groupId, rowNumber: null, mode: 'standard' });
      return;
    }
    if (overData?.type === 'archive-field' && overData.fieldId !== (activeFieldId ?? activeData?.fieldId)) {
      const targetField = fieldDraftById.get(overData.fieldId);
      setDropTargetWithHysteresis({
        beforeId: overData.fieldId,
        groupId: overData.groupId,
        rowNumber: targetField?.panelRow ?? null,
        mode: 'standard',
      });
      return;
    }
    if (overData?.type === 'archive-group') {
      setDropTargetIfChanged({ beforeId: null, groupId: overData.groupId, rowNumber: null, mode: 'standard' });
      return;
    }
  }, [dropTarget, fieldDraftById, fieldIdToGroupId, groupViewModelById, rowFieldIdsByGroupRow, setDropTargetIfChanged, setDropTargetWithHysteresis]);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const activeFieldId = parseArchiveFieldDragId(event.active.id);
    const overFieldId = parseArchiveFieldDragId(event.over?.id);
    const activeData = event.active.data.current as FieldDragData | undefined;
    const overData = event.over?.data.current as FieldDragData | GroupDragData | FieldInsertDropData | FieldRowDropData | undefined;
    const resolvedActiveFieldId = activeFieldId ?? activeData?.fieldId ?? null;
    const resolvedActiveGroupId = activeData?.groupId ?? (resolvedActiveFieldId ? fieldIdToGroupId.get(resolvedActiveFieldId) ?? '' : '');
    const activeField = resolvedActiveFieldId ? fieldDraftById.get(resolvedActiveFieldId) : undefined;
    const resolvedActiveRowNumber = activeField?.panelRow ?? 1;

    if (resolvedActiveFieldId && dropTarget?.mode === 'row' && (dropTarget.groupId !== resolvedActiveGroupId || (dropTarget.rowNumber ?? resolvedActiveRowNumber) !== resolvedActiveRowNumber)) {
      moveField(resolvedActiveFieldId, dropTarget.groupId, dropTarget.rowNumber ?? resolvedActiveRowNumber, dropTarget.beforeId);
    } else if (resolvedActiveFieldId && overData?.type === 'archive-field-row') {
      moveField(resolvedActiveFieldId, overData.groupId, overData.rowNumber, overData.beforeId);
    } else if (resolvedActiveFieldId && overFieldId && overFieldId !== resolvedActiveFieldId) {
      const targetGroupId = fieldIdToGroupId.get(overFieldId) ?? resolvedActiveGroupId;
      const targetField = fieldDraftById.get(overFieldId);
      moveField(resolvedActiveFieldId, targetGroupId, targetField?.panelRow ?? 1, overFieldId);
    } else if (resolvedActiveFieldId && dropTarget && (dropTarget.groupId !== resolvedActiveGroupId || dropTarget.beforeId !== resolvedActiveFieldId)) {
      moveField(resolvedActiveFieldId, dropTarget.groupId, dropTarget.rowNumber ?? resolvedActiveRowNumber, dropTarget.beforeId);
    } else if (resolvedActiveFieldId && overData?.type === 'archive-field-insert') {
      moveField(resolvedActiveFieldId, overData.groupId, resolvedActiveRowNumber, overData.beforeId);
    } else if (resolvedActiveFieldId && overData?.type === 'archive-field' && overData.fieldId !== resolvedActiveFieldId) {
      const targetField = fieldDraftById.get(overData.fieldId);
      moveField(resolvedActiveFieldId, overData.groupId, targetField?.panelRow ?? 1, overData.fieldId);
    } else if (resolvedActiveFieldId && overData?.type === 'archive-group') {
      moveField(resolvedActiveFieldId, overData.groupId, resolvedActiveRowNumber);
    }
    settleAfterDrag(DASHBOARD_DRAG_FEEDBACK_END_SETTLE_MS);
  }, [dropTarget, fieldDraftById, fieldIdToGroupId, moveField, settleAfterDrag]);

  const handleDragCancel = React.useCallback(() => {
    settleAfterDrag(DASHBOARD_DRAG_FEEDBACK_CANCEL_SETTLE_MS);
  }, [settleAfterDrag]);

  const groupedPlacedFields = React.useMemo(() => {
    const fieldGroupMap = new Map<string, string>();
    stabilizedDocument.items.forEach((item) => {
      if (item.type !== 'groupbox' && item.field) {
        fieldGroupMap.set(String(item.field), String(item.parentId || ''));
      }
    });
    return placedOptions.map((option) => ({ option, groupId: fieldGroupMap.get(String(option.value)) ?? '' }));
  }, [placedOptions, stabilizedDocument.items]);
  const placedFieldItemIdByValue = React.useMemo(() => {
    const nextMap = new Map<string, string>();
    stabilizedDocument.items.forEach((item) => {
      if (item.type !== 'groupbox' && item.field) {
        nextMap.set(String(item.field), item.id);
      }
    });
    return nextMap;
  }, [stabilizedDocument.items]);
  const workbenchGroupRenderModels = React.useMemo(
    () => buildArchiveLayoutWorkbenchGroupRenderModels(groups),
    [groups],
  );

  const activeFieldEditor = React.useMemo(
    () => (openFieldEditorId ? fieldContextById.get(openFieldEditorId) ?? null : null),
    [fieldContextById, openFieldEditorId],
  );
  const activeDragFieldContext = React.useMemo(
    () => (dragFieldId ? fieldContextById.get(dragFieldId) ?? null : null),
    [dragFieldId, fieldContextById],
  );
  const activeFieldEditorId = activeFieldEditor?.field.id ?? null;
  const activeFieldEditorWidth = activeFieldEditor?.field.w ?? null;
  const activeFieldEditorHeight = activeFieldEditor?.field.h ?? null;

  React.useEffect(() => {
    if (!activeFieldEditor) {
      setQuickEditorSizeInput({ fieldId: null, h: '', w: '' });
      return;
    }
    setQuickEditorSizeInput({
      fieldId: activeFieldEditor.field.id,
      h: String(activeFieldEditor.field.h),
      w: String(activeFieldEditor.field.w),
    });
  }, [activeFieldEditor, activeFieldEditorHeight, activeFieldEditorId, activeFieldEditorWidth]);

  const commitFieldSizeValue = React.useCallback((
    fieldId: string,
    dimension: 'w' | 'h',
    rawValue: string,
    fallback: number,
  ) => {
    const nextValue = parseCommittedNumber(
      rawValue,
      fallback,
      dimension === 'w' ? BILL_FORM_MIN_WIDTH : BILL_FORM_MIN_CONTROL_HEIGHT,
      dimension === 'w' ? usablePreviewWorkbenchWidth : 160,
    );
    updateField(fieldId, dimension === 'w' ? { w: nextValue } : { h: nextValue });
    return nextValue;
  }, [updateField, usablePreviewWorkbenchWidth]);

  const nudgeFieldSizeValue = React.useCallback((
    fieldId: string,
    dimension: 'w' | 'h',
    currentValue: number,
    delta: number,
  ) => {
    const nextValue = clampNumber(
      currentValue + delta,
      dimension === 'w' ? BILL_FORM_MIN_WIDTH : BILL_FORM_MIN_CONTROL_HEIGHT,
      dimension === 'w' ? usablePreviewWorkbenchWidth : 160,
    );
    updateField(fieldId, dimension === 'w' ? { w: nextValue } : { h: nextValue });
    return nextValue;
  }, [updateField, usablePreviewWorkbenchWidth]);

  const handleFieldSizeInputKeyDown = React.useCallback((
    event: React.KeyboardEvent<HTMLInputElement>,
    commit: () => void,
    reset: () => void,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      reset();
    }
  }, []);

  const closeFieldEditor = React.useCallback(() => {
    setOpenFieldEditorId(null);
  }, []);

  const openFieldEditor = React.useCallback((fieldId: string) => {
    outsideCloseBlockedUntilRef.current = Date.now() + 220;
    setSelectedFieldId(fieldId);
    setOpenFieldEditorId(fieldId);
  }, []);

  const renderBillStyleFieldPreview = React.useCallback((rawField: any, previewHeight = BILL_FORM_MIN_CONTROL_HEIGHT) => {
    const field = normalizeColumn(rawField);
    const fieldTypeText = String(
      field.type
      ?? field.fieldType
      ?? field.controlType
      ?? field.controltypename
      ?? '',
    ).toLowerCase();
    const previewValue = String(field.defaultValue || field.placeholder || '').trim();
    const previewTextNode = (
      <span className={`min-w-0 flex-1 truncate ${previewValue ? 'text-slate-400' : 'text-transparent'}`}>
        {previewValue || '\u00a0'}
      </span>
    );
    const shellClass = 'pointer-events-none flex w-full min-w-0 items-center gap-1 overflow-hidden rounded-[7px] border border-[#d9e3ee] bg-white px-1.5 text-[10px] text-slate-500 shadow-none';

    if (fieldTypeText.includes('搜索')) {
      return (
        <div className={shellClass} style={{ height: previewHeight }}>
          <Search className="size-3.5 shrink-0 text-slate-300" strokeWidth={1.75} />
          {previewTextNode}
        </div>
      );
    }

    if (fieldTypeText.includes('鏃ユ湡') || fieldTypeText.includes('time') || fieldTypeText.includes('date')) {
      return (
        <div className={shellClass} style={{ height: previewHeight }}>
          {previewTextNode}
          <CalendarDays className="size-3.5 shrink-0 text-slate-300" strokeWidth={1.75} />
        </div>
      );
    }

    if (fieldTypeText.includes('涓嬫媺')
      || fieldTypeText.includes('select')
      || fieldTypeText.includes('多选')) {
      return (
        <div className={shellClass} style={{ height: previewHeight }}>
          {previewTextNode}
          <ChevronDown className="size-3.5 shrink-0 text-slate-300" strokeWidth={1.75} />
        </div>
      );
    }

    if (fieldTypeText.includes('单选') || fieldTypeText.includes('radio')) {
      return (
        <div className={shellClass} style={{ height: previewHeight }}>
          <span className="size-2.5 shrink-0 rounded-full border border-[color:var(--workspace-accent)]/45 bg-[color:var(--workspace-accent)]/12" />
          <span className="size-2.5 shrink-0 rounded-full border border-slate-300/90 bg-white" />
          <span className="min-w-0 flex-1 truncate text-transparent">{'\u00a0'}</span>
        </div>
      );
    }

    return (
      <div className={shellClass} style={{ height: previewHeight }}>
        {previewTextNode}
      </div>
    );
  }, [normalizeColumn]);
  const handleKeywordChange = React.useCallback((value: string) => {
    setKeyword(value);
  }, []);
  const handlePreviewWorkbenchWidthInputChange = React.useCallback((value: string) => {
    const nextValue = value.replace(/[^\d]/g, '');
    setPreviewWorkbenchWidthInput(nextValue);
    if (!nextValue) {
      return;
    }
    setPreviewWorkbenchWidthDraft(normalizePreviewWorkbenchWidth(Number(nextValue)));
  }, []);
  const handlePreviewWorkbenchWidthInputBlur = React.useCallback(() => {
    commitPreviewWorkbenchWidth(
      parseCommittedNumber(previewWorkbenchWidthInput, previewWorkbenchWidth, PREVIEW_WIDTH_MIN, PREVIEW_WIDTH_MAX),
    );
  }, [commitPreviewWorkbenchWidth, previewWorkbenchWidth, previewWorkbenchWidthInput]);
  const handlePreviewWorkbenchWidthInputKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    handleFieldSizeInputKeyDown(
      event,
      () => commitPreviewWorkbenchWidth(
        parseCommittedNumber(previewWorkbenchWidthInput, previewWorkbenchWidth, PREVIEW_WIDTH_MIN, PREVIEW_WIDTH_MAX),
      ),
      () => {
        setPreviewWorkbenchWidthDraft(previewWorkbenchWidth);
        setPreviewWorkbenchWidthInput(String(previewWorkbenchWidth));
      },
    );
  }, [commitPreviewWorkbenchWidth, handleFieldSizeInputKeyDown, previewWorkbenchWidth, previewWorkbenchWidthInput]);
  const handleSelectPlacedField = React.useCallback((groupId: string, fieldId: string | null) => {
    setSelectedGroupId((current) => groupId || current);
    setSelectedFieldId(fieldId);
    setSidebarTab('structure');
  }, []);
  const handleSidebarTabChange = React.useCallback((tab: SidebarTabKey) => {
    setSidebarTab(tab);
  }, []);
  const handleSelectWorkbenchGroup = React.useCallback((groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedFieldId(null);
    setSidebarTab('structure');
  }, []);
  const handleSelectWorkbenchField = React.useCallback((groupId: string, fieldId: string) => {
    setSelectedGroupId(groupId);
    setSelectedFieldId(fieldId);
    setSidebarTab('structure');
  }, []);

  return (
    <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
      <ArchiveLayoutSidebar
        groupedPlacedFields={groupedPlacedFields}
        groupTitleById={groupTitleById}
        hasPlacedFields={hasPlacedFields}
        keyword={keyword}
        placedFieldItemIdByValue={placedFieldItemIdByValue}
        onAddFieldToGroup={addFieldToGroup}
        onAddGroup={addGroup}
        onApplySpecificScheme={applySpecificScheme}
        onCreateNewSchemeDraft={createNewSchemeDraft}
        onCreateSchemeFromCurrentLayout={createSchemeFromCurrentLayout}
        onDuplicateScheme={duplicateScheme}
        onKeywordChange={handleKeywordChange}
        onOpenSchemeModal={openSchemeModal}
        onSelectGroup={handleSelectWorkbenchGroup}
        onSelectPlacedField={handleSelectPlacedField}
        onSelectScheme={selectScheme}
        onSidebarTabChange={handleSidebarTabChange}
        pendingOptions={pendingOptions}
        schemes={schemes}
        schemeSourceId={schemeSourceId}
        selectedFieldId={selectedFieldId}
        selectedGroupId={selectedGroupId}
        sidebarTab={sidebarTab}
        staticWorkbenchMotionStyle={staticWorkbenchMotionStyle}
        suggestedScheme={suggestedScheme}
      />

      <section className={cn(SURFACE_CLASS, 'flex min-h-0 flex-col overflow-hidden')}>
        <ArchiveLayoutWorkbenchToolbar
          fieldCount={placedFieldIds.size}
          groupCount={groups.length}
          onAddGroup={addGroup}
          onOpenSchemeModal={() => openSchemeModal()}
          onPreviewWorkbenchWidthInputBlur={handlePreviewWorkbenchWidthInputBlur}
          onPreviewWorkbenchWidthInputChange={handlePreviewWorkbenchWidthInputChange}
          onPreviewWorkbenchWidthInputKeyDown={handlePreviewWorkbenchWidthInputKeyDown}
          onPreviewWorkbenchWidthPresetSelect={handlePreviewWorkbenchWidthPresetSelect}
          onPreviewWorkbenchWidthSliderChange={handlePreviewWorkbenchWidthSliderChange}
          onPreviewWorkbenchWidthSliderCommit={handlePreviewWorkbenchWidthSliderCommit}
          previewWorkbenchWidthDraft={previewWorkbenchWidthDraft}
          previewWorkbenchWidthInput={previewWorkbenchWidthInput}
        />
        <DndContext
          autoScroll={{
            acceleration: 14,
            activator: AutoScrollActivator.Pointer,
            interval: 8,
            threshold: {
              x: 0.12,
              y: 0.16,
            },
          }}
          collisionDetection={collisionDetection}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <div
              className="mx-auto rounded-[18px] border border-[#d6e2f1] bg-[linear-gradient(180deg,#fcfdff_0%,#f6faff_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
              style={{ minWidth: previewWorkbenchWidth + 32, width: previewWorkbenchWidth + 32 }}
            >
              <div className="flex min-h-full flex-col gap-6">
                {groups.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-[#dbe6f1] bg-white/72 px-4 py-10 text-center text-[12px] text-slate-400">
                    暂无分组，先在左侧点击“新增分组”。
                  </div>
                ) : null}
                {workbenchGroupRenderModels.map((groupRenderModel, groupIndex) => (
                  <ArchiveLayoutWorkbenchGroup
                    key={groupRenderModel.group.group.id}
                    canMoveDown={groupIndex < workbenchGroupRenderModels.length - 1}
                    canMoveUp={groupIndex > 0}
                    currentGroupDropTarget={renderDropTarget?.groupId === groupRenderModel.group.group.id ? renderDropTarget : null}
                    density={density}
                    dragFeedbackIndicatorOpacity={dragFeedbackIndicatorOpacity}
                    dragFeedbackTransitionMs={dragFeedbackTransitionMs}
                    dragFieldId={dragFieldId}
                    fieldResizePreview={fieldResizePreview}
                    groupRenderModel={groupRenderModel}
                    normalizeColumn={normalizeColumn}
                    onAddGroupRow={addGroupRow}
                    onDeleteGroup={deleteGroup}
                    onDeleteGroupRow={deleteGroupRow}
                    onMoveGroup={moveGroup}
                    onRemoveField={removeField}
                    onOpenFieldEditor={openFieldEditor}
                    onRenameGroup={renameGroup}
                    onSelectField={handleSelectWorkbenchField}
                    onSelectGroup={handleSelectWorkbenchGroup}
                    onStartFieldResize={startFieldResize}
                    openFieldEditorId={openFieldEditorId}
                    optionMap={optionMap}
                    renderBillStyleFieldPreview={renderBillStyleFieldPreview}
                    selectedFieldId={selectedFieldId}
                    selectedGroupId={selectedGroupId}
                  />
                ))}
              </div>
            </div>
          </div>
          <DragOverlay
            modifiers={dragOverlayModifiers}
            dropAnimation={{
              duration: DASHBOARD_DRAG_MOTION_BASE_MS,
              easing: DASHBOARD_DRAG_MOTION_EASING,
            }}
          >
            {activeDragFieldContext ? (() => {
              const fieldOption = optionMap.get(String(activeDragFieldContext.field.field ?? ''));
              const rawField = (fieldOption?.rawField ?? {}) as Record<string, any>;
              const displayTitle = getDisplayTitle(activeDragFieldContext.field, fieldOption, rawField);
              const normalizedField = normalizeColumn({ ...rawField, name: displayTitle });
              const liveHeight = getBillHeaderFieldHeight({ controlHeight: activeDragFieldContext.field.h });
              const overlayWidth = clampNumber(
                Math.min(getBillHeaderFieldWidth({ width: activeDragFieldContext.field.w, name: displayTitle }), 220),
                148,
                220,
              );
              const overlayHeight = 32;
              const previewHeight = clampNumber(liveHeight - 28, 14, 18);
              const overlayMotion = clampNumber(dragOverlayMotionIntensity, 0, 1);
              const overlayScale = 1 - overlayMotion * 0.025;
              const overlayOpacity = 0.97 - overlayMotion * 0.12;
              const overlayValueOpacity = 0.82 - overlayMotion * 0.18;
              const overlayShadowOpacity = 0.24 - overlayMotion * 0.08;
              const overlayShadow = `0 16px 30px -24px rgba(15,23,42,${overlayShadowOpacity.toFixed(3)})`;

              return (
                <div
                  className="flex select-none rounded-[10px] border border-[color:var(--workspace-accent)]/18 bg-white/97 text-left transition-[opacity,transform,box-shadow] duration-150 ease-out"
                  style={{
                    height: overlayHeight,
                    width: overlayWidth,
                    opacity: overlayOpacity,
                    transform: `translateZ(0) scale(${overlayScale})`,
                    transformOrigin: 'top left',
                    boxShadow: overlayShadow,
                  }}
                >
                  <div className="pointer-events-none flex h-full min-w-0 flex-1 items-center gap-2 px-2">
                    <div className="flex h-full max-w-[56%] shrink-0 items-center text-[12px] font-semibold tracking-[-0.01em] text-slate-800" title={displayTitle}>
                      <span className="truncate">{displayTitle}</span>
                    </div>
                    <div className="min-w-0 flex-1" style={{ opacity: overlayValueOpacity }}>
                      {renderBillStyleFieldPreview(normalizedField, previewHeight)}
                    </div>
                  </div>
                </div>
              );
            })() : null}
          </DragOverlay>
        </DndContext>
      </section>
      {isSchemeModalOpen && typeof globalThis.document !== 'undefined'
        ? createPortal(
            <>
              <div className="fixed inset-0 z-[118] bg-slate-950/28 backdrop-blur-[3px]" onClick={closeSchemeModal} />
              <div className="fixed inset-0 z-[119] flex items-center justify-center p-4 md:p-5" onClick={closeSchemeModal}>
                <div
                  className="flex h-[min(820px,calc(100vh-32px))] w-[min(1380px,calc(100vw-24px))] flex-col overflow-hidden rounded-[28px] border border-[#d9e3ef] bg-[linear-gradient(180deg,#ffffff_0%,#f6faff_100%)] shadow-[0_34px_90px_-42px_rgba(15,23,42,0.42)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e6edf6] px-5 py-4">
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Scheme Workbench</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <div className="text-[16px] font-semibold text-slate-900">方案设置</div>
                        <span className="rounded-full border border-[#e5ecf5] bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
                          {schemeDraft.groups.length} 组 / {countSchemeFields(schemeDraft)} 字段
                        </span>
                        {isEditingUnsavedScheme ? (
                          <span className="rounded-full border border-primary/18 bg-primary/8 px-2.5 py-1 text-[10px] font-semibold text-primary">
                            未保存草稿
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500">`/` 搜索字段，`Ctrl/Cmd+S` 保存，`Ctrl/Cmd+Enter` 保存并应用。</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={saveSchemeDraft}
                        className={cn(
                          'rounded-[12px] border border-[#dbe5ef] bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                          schemeModalSurfaceButtonClass,
                        )}
                        style={staticWorkbenchMotionStyle}
                      >
                        保存方案
                      </button>
                      <button
                        type="button"
                        onClick={saveSchemeDraftAsCopy}
                        className={cn(
                          'rounded-[12px] border border-[#dbe5ef] bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                          schemeModalSurfaceButtonClass,
                        )}
                        style={staticWorkbenchMotionStyle}
                      >
                        另存为
                      </button>
                      <button
                        type="button"
                        onClick={closeSchemeModal}
                        className={cn(
                          'rounded-[12px] border border-[#dbe5ef] bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                          schemeModalSurfaceButtonClass,
                        )}
                        style={staticWorkbenchMotionStyle}
                      >
                        关闭
                      </button>
                    </div>
                  </div>
                  <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[348px_minmax(0,1fr)]">
                    <aside className="flex min-h-0 flex-col border-r border-[#edf2f7] bg-[linear-gradient(180deg,#fbfdff_0%,#f7fbff_100%)]">
                      <div className="border-b border-[#edf2f7] px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[12px] font-semibold text-slate-800">方案列表</div>
                            <div className="mt-1 text-[11px] text-slate-500">{schemes.length} 个已保存方案</div>
                          </div>
                          <div className="rounded-full border border-[#e5ecf5] bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
                            当前编辑 {selectedSchemeFieldCount} 字段
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={createNewSchemeDraft}
                            className={cn(
                              'rounded-[11px] border border-[#dbe5ef] bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                              schemeModalSurfaceButtonClass,
                            )}
                            style={staticWorkbenchMotionStyle}
                          >
                            新建方案
                          </button>
                          <button
                            type="button"
                            onClick={createSchemeFromCurrentLayout}
                            disabled={!hasPlacedFields}
                            className={cn(
                              'rounded-[11px] border px-3 py-2 text-[11px] font-semibold',
                              hasPlacedFields
                                ? `border-[#dbe5ef] bg-white text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff] ${schemeModalSurfaceButtonClass}`
                                : 'cursor-not-allowed border-[#eef2f7] bg-[#f8fafc] text-slate-300',
                            )}
                            style={hasPlacedFields ? staticWorkbenchMotionStyle : undefined}
                          >
                            从布局生成
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => openSchemeModal(null, suggestedScheme)}
                          className={cn(
                            'mt-2 w-full rounded-[11px] border border-primary/20 bg-primary/8 px-3 py-2 text-[11px] font-semibold text-primary hover:border-primary/28 hover:bg-primary/12',
                            schemeModalSurfaceButtonClass,
                          )}
                          style={staticWorkbenchMotionStyle}
                        >
                          使用默认建议
                        </button>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                        {schemes.length > 0 ? schemes.map((scheme) => (
                          <div
                            key={scheme.id}
                            className={cn(
                              'mb-2 rounded-[16px] border px-3 py-3',
                              schemeSourceId === scheme.id
                                ? `border-primary/35 bg-primary/5 ${schemeModalSelectedCardClass}`
                                : 'border-[#e6edf6] bg-white hover:border-[#d7e5f4]',
                              schemeModalCardClass,
                            )}
                            style={staticWorkbenchMotionStyle}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[12px] font-semibold text-slate-800">{scheme.name}</div>
                                <div className="mt-1 text-[11px] text-slate-400">{scheme.groups.length} 个分组 · {countSchemeFields(scheme)} 个字段</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => selectScheme(scheme)}
                                className={cn(
                                  'rounded-[9px] border border-[#dbe5ef] bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                                  schemeModalSurfaceButtonClass,
                                )}
                                style={staticWorkbenchMotionStyle}
                              >
                                选中
                              </button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => applySpecificScheme(scheme)}
                                className={cn(
                                  'rounded-[9px] border border-primary/20 bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-primary/90',
                                  schemeModalSurfaceButtonClass,
                                )}
                                style={staticWorkbenchMotionStyle}
                              >
                                应用
                              </button>
                              <button
                                type="button"
                                onClick={() => openSchemeModal(scheme.id)}
                                className={cn(
                                  'rounded-[9px] border border-[#dbe5ef] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                                  schemeModalSurfaceButtonClass,
                                )}
                                style={staticWorkbenchMotionStyle}
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicateScheme(scheme)}
                                className={cn(
                                  'rounded-[9px] border border-[#dbe5ef] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                                  schemeModalSurfaceButtonClass,
                                )}
                                style={staticWorkbenchMotionStyle}
                              >
                                复制
                              </button>
                            </div>
                          </div>
                        )) : (
                          <div className="rounded-[16px] border border-dashed border-[#d8e3ef] bg-white px-4 py-6 text-center text-[12px] text-slate-400">
                            还没有保存的方案
                          </div>
                        )}
                      </div>
                      <div className="border-t border-[#edf2f7] px-4 py-4">
                        <label className="grid gap-1.5 text-[12px] text-slate-600">
                          <span>方案名称</span>
                          <input
                            value={schemeDraft.name}
                            onChange={(event) => setSchemeDraftName(event.target.value)}
                            className={cn(
                              'h-10 rounded-[12px] border border-[#d8e3ef] bg-white px-3 text-[12px] text-slate-700 outline-none',
                              schemeModalInputClass,
                            )}
                            style={staticWorkbenchMotionStyle}
                          />
                        </label>
                        {schemeSourceId ? (
                          <button
                            type="button"
                            onClick={deleteActiveScheme}
                            className={cn(
                              'mt-3 w-full rounded-[11px] border border-[#f1d4d8] bg-[#fff7f7] px-3 py-2 text-[11px] font-semibold text-rose-600 hover:border-[#edc2ca] hover:bg-[#fff1f1]',
                              schemeModalSurfaceButtonClass,
                            )}
                            style={staticWorkbenchMotionStyle}
                          >
                            删除当前方案
                          </button>
                        ) : null}
                      </div>
                    </aside>
                    <section className="flex min-h-0 flex-col">
                      <div className="border-b border-[#edf2f7] px-4 py-4">
                        <div className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
                          <div className="grid gap-3">
                            <div className="rounded-[16px] border border-[#e6edf6] bg-white px-3 py-3 shadow-[0_14px_28px_-28px_rgba(15,23,42,0.16)]">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-[12px] font-semibold text-slate-800">当前分组</div>
                                  <div className="mt-1 truncate text-[11px] text-slate-500">
                                    {selectedSchemeGroup?.name || '先选择一个分组'}
                                  </div>
                                </div>
                                <span className="rounded-full border border-[#e5ecf5] bg-[#f8fbff] px-2.5 py-1 text-[10px] font-medium text-slate-500">
                                  {selectedSchemeGroupFieldCount} 项
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={addSchemeGroup}
                                className={cn(
                                  'mt-3 w-full rounded-[11px] border border-[#dbe5ef] bg-[#f8fbff] px-3 py-2 text-[11px] font-semibold text-slate-600 hover:border-[#cddaea] hover:bg-white',
                                  schemeModalSurfaceButtonClass,
                                )}
                                style={staticWorkbenchMotionStyle}
                              >
                                新增分组
                              </button>
                            </div>
                            <div className="rounded-[16px] border border-[#e6edf6] bg-[linear-gradient(180deg,#fbfdff_0%,#f7fbff_100%)] px-3 py-3 shadow-[0_14px_28px_-28px_rgba(15,23,42,0.18)]">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-[12px] font-semibold text-slate-800">分组编排</div>
                                <span className="rounded-full border border-[#e5ecf5] bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
                                  {schemeDraft.groups.length} 组
                                </span>
                              </div>
                              <div className="mt-3 max-h-[240px] overflow-y-auto pr-1">
                                {schemeDraft.groups.map((group, groupIndex) => (
                                  <div
                                    key={group.id}
                                    className={cn(
                                      'mb-2 rounded-[14px] border px-3 py-3',
                                      selectedSchemeGroupId === group.id
                                        ? `border-primary/35 bg-primary/5 ${schemeModalSelectedCardClass}`
                                        : 'border-[#e6edf6] bg-white hover:border-[#d7e5f4]',
                                      schemeModalCardClass,
                                    )}
                                    style={staticWorkbenchMotionStyle}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSchemeGroupId(group.id)}
                                      className="mb-2 flex w-full items-center justify-between gap-2 text-left"
                                    >
                                      <span className="truncate text-[11px] font-semibold text-slate-700">{group.name || `信息分组 ${groupIndex + 1}`}</span>
                                      <span className="rounded-full border border-[#e5ecf5] bg-white px-2 py-1 text-[10px] font-medium text-slate-500">
                                        {group.fieldIds.length}
                                      </span>
                                    </button>
                                    <div className="grid grid-cols-[minmax(0,1fr)_32px_32px] gap-2">
                                      <input
                                        value={group.name}
                                        onChange={(event) => renameSchemeGroup(group.id, event.target.value)}
                                        onFocus={() => setSelectedSchemeGroupId(group.id)}
                                        className={cn(
                                          'h-9 rounded-[10px] border border-[#d8e3ef] bg-white px-3 text-[12px] text-slate-700 outline-none',
                                          schemeModalInputClass,
                                        )}
                                        style={staticWorkbenchMotionStyle}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => moveSchemeGroup(group.id, 'up')}
                                        disabled={groupIndex === 0}
                                        className={cn(
                                          'rounded-[10px] border text-[12px] font-semibold',
                                          groupIndex > 0
                                            ? `border-[#dbe5ef] bg-white text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff] ${schemeModalSurfaceButtonClass}`
                                            : 'cursor-not-allowed border-[#eef2f7] bg-[#f8fafc] text-slate-300',
                                        )}
                                        style={groupIndex > 0 ? staticWorkbenchMotionStyle : undefined}
                                      >
                                        ↑
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => moveSchemeGroup(group.id, 'down')}
                                        disabled={groupIndex === schemeDraft.groups.length - 1}
                                        className={cn(
                                          'rounded-[10px] border text-[12px] font-semibold',
                                          groupIndex < schemeDraft.groups.length - 1
                                            ? `border-[#dbe5ef] bg-white text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff] ${schemeModalSurfaceButtonClass}`
                                            : 'cursor-not-allowed border-[#eef2f7] bg-[#f8fafc] text-slate-300',
                                        )}
                                        style={groupIndex < schemeDraft.groups.length - 1 ? staticWorkbenchMotionStyle : undefined}
                                      >
                                        ↓
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeSchemeGroup(group.id)}
                                      className={cn(
                                        'mt-2 w-full rounded-[10px] border border-[#f1d4d8] bg-[#fff7f7] px-3 py-2 text-[11px] font-semibold text-rose-600 hover:border-[#edc2ca] hover:bg-[#fff1f1]',
                                        schemeModalSurfaceButtonClass,
                                      )}
                                      style={staticWorkbenchMotionStyle}
                                    >
                                      删除分组
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-3">
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                              <div className="rounded-[16px] border border-[#e6edf6] bg-white px-3 py-3 shadow-[0_14px_28px_-28px_rgba(15,23,42,0.16)]">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-semibold text-slate-800">字段筛选</span>
                                    <span className="rounded-full border border-[#e5ecf5] bg-[#f8fbff] px-2 py-1 text-[10px] font-medium text-slate-500">
                                      {visibleSchemeFieldRows.length} 条结果
                                    </span>
                                  </div>
                                  <span className="rounded-full border border-[#e5ecf5] bg-[#f8fbff] px-2 py-1 text-[10px] font-medium text-slate-500">
                                    当前方案 {selectedSchemeFieldCount} 字段
                                  </span>
                                </div>
                                <input
                                  ref={schemeFieldSearchInputRef}
                                  value={schemeFieldKeyword}
                                  onChange={(event) => setSchemeFieldKeyword(event.target.value)}
                                  placeholder="搜索字段，按 / 快速聚焦"
                                  className={cn(
                                    'mt-3 h-10 w-full rounded-[12px] border border-[#d8e3ef] bg-[#fbfdff] px-3 text-[12px] text-slate-700 outline-none placeholder:text-slate-400',
                                    schemeModalInputClass,
                                  )}
                                  style={staticWorkbenchMotionStyle}
                                />
                                <div className="mt-2 inline-flex rounded-[10px] border border-[#dbe5ef] bg-[#fbfdff] p-1">
                                  {([
                                    { key: 'all' as const, label: `全部 ${visibleSchemeFieldRows.length}` },
                                    { key: 'selected' as const, label: `本组已选 ${filteredSelectedSchemeFieldCount}` },
                                    { key: 'unassigned' as const, label: `未分配 ${filteredUnassignedSchemeFieldCount}` },
                                  ]).map((item) => (
                                    <button
                                      key={item.key}
                                      type="button"
                                      onClick={() => setSchemeFieldFilterMode(item.key)}
                                      className={cn(
                                        'rounded-[8px] px-2.5 py-1.5 text-[10px] font-semibold transition-[background-color,color,box-shadow]',
                                        schemeFieldFilterMode === item.key ? 'bg-primary text-white shadow-[0_10px_24px_-24px_rgba(59,130,246,0.45)]' : 'text-slate-500 hover:bg-white',
                                      )}
                                      style={staticWorkbenchMotionStyle}
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="rounded-[16px] border border-[#e6edf6] bg-[linear-gradient(180deg,#fbfdff_0%,#f7fbff_100%)] px-3 py-3 shadow-[0_14px_28px_-28px_rgba(15,23,42,0.16)]">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[12px] font-semibold text-slate-800">预览宽度</span>
                                  <span className="rounded-full border border-[#e5ecf5] bg-white px-2 py-1 text-[10px] font-medium text-slate-500">即时写入方案</span>
                                </div>
                                <div className="mt-3 inline-flex rounded-[10px] border border-[#dbe5ef] bg-white p-1">
                                  {PREVIEW_WIDTH_PRESETS.map((preset) => (
                                    <button
                                      key={preset.key}
                                      type="button"
                                      onClick={() => handleSchemePreviewWorkbenchWidthPresetSelect(preset.value)}
                                      className={cn(
                                        'rounded-[8px] px-2.5 py-1 text-[10px] font-semibold transition-[background-color,color,box-shadow]',
                                        normalizePreviewWorkbenchWidth(Number(schemePreviewWorkbenchWidthInput) || previewWorkbenchWidth) === preset.value
                                          ? 'bg-primary text-white shadow-[0_10px_24px_-24px_rgba(59,130,246,0.45)]'
                                          : 'text-slate-500 hover:bg-[#f8fbff]',
                                      )}
                                      style={staticWorkbenchMotionStyle}
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <input
                                    type="range"
                                    min={PREVIEW_WIDTH_MIN}
                                    max={PREVIEW_WIDTH_MAX}
                                    step={20}
                                    value={Number(schemePreviewWorkbenchWidthInput) || previewWorkbenchWidth}
                                    onChange={(event) => handleSchemePreviewWorkbenchWidthSliderChange(Number(event.target.value))}
                                    className="h-4 min-w-[180px] flex-1 accent-primary"
                                  />
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={schemePreviewWorkbenchWidthInput}
                                    onChange={(event) => handleSchemePreviewWorkbenchWidthInputChange(event.target.value)}
                                    onBlur={handleSchemePreviewWorkbenchWidthInputBlur}
                                    onKeyDown={handleSchemePreviewWorkbenchWidthInputKeyDown}
                                    className={cn(
                                      'h-8 w-[84px] rounded-[10px] border border-[#d8e3ef] bg-white px-2 text-center text-[11px] text-slate-700 outline-none',
                                      schemeModalInputClass,
                                    )}
                                    style={staticWorkbenchMotionStyle}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="rounded-[16px] border border-[#e6edf6] bg-[#fbfdff] px-3 py-3 shadow-[0_14px_28px_-28px_rgba(15,23,42,0.12)]">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="text-[12px] font-semibold text-slate-800">当前分组批量动作</div>
                                  <div className="rounded-full border border-[#e5ecf5] bg-white px-2 py-1 text-[10px] font-medium text-slate-500">
                                    {selectedSchemeBatchFieldIds.length} 项
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={!selectedSchemeGroup || selectedSchemeGroupIndex <= 0 || selectedSchemeBatchFieldIds.length === 0}
                                    onClick={() => moveCurrentSchemeGroupFields('up')}
                                    className={cn(
                                      'rounded-[9px] border px-2.5 py-1.5 text-[10px] font-semibold',
                                      selectedSchemeGroup && selectedSchemeGroupIndex > 0 && selectedSchemeBatchFieldIds.length > 0
                                        ? `border-[#d8e3ef] bg-white text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff] ${schemeModalSurfaceButtonClass}`
                                        : 'cursor-not-allowed border-[#eef2f7] bg-[#f8fafc] text-slate-300',
                                    )}
                                    style={selectedSchemeGroup && selectedSchemeGroupIndex > 0 && selectedSchemeBatchFieldIds.length > 0 ? staticWorkbenchMotionStyle : undefined}
                                  >
                                    整组上移
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!selectedSchemeGroup || selectedSchemeGroupIndex < 0 || selectedSchemeGroupIndex >= schemeDraft.groups.length - 1 || selectedSchemeBatchFieldIds.length === 0}
                                    onClick={() => moveCurrentSchemeGroupFields('down')}
                                    className={cn(
                                      'rounded-[9px] border px-2.5 py-1.5 text-[10px] font-semibold',
                                      selectedSchemeGroup && selectedSchemeGroupIndex >= 0 && selectedSchemeGroupIndex < schemeDraft.groups.length - 1 && selectedSchemeBatchFieldIds.length > 0
                                        ? `border-[#d8e3ef] bg-white text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff] ${schemeModalSurfaceButtonClass}`
                                        : 'cursor-not-allowed border-[#eef2f7] bg-[#f8fafc] text-slate-300',
                                    )}
                                    style={selectedSchemeGroup && selectedSchemeGroupIndex >= 0 && selectedSchemeGroupIndex < schemeDraft.groups.length - 1 && selectedSchemeBatchFieldIds.length > 0 ? staticWorkbenchMotionStyle : undefined}
                                  >
                                    整组下移
                                  </button>
                                  <button
                                    type="button"
                                    disabled={selectedSchemeBatchFieldIds.length === 0}
                                    onClick={() => moveCurrentSchemeGroupFields('unassigned')}
                                    className={cn(
                                      'rounded-[9px] border px-2.5 py-1.5 text-[10px] font-semibold',
                                      selectedSchemeBatchFieldIds.length > 0
                                        ? `border-[#d8e3ef] bg-white text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff] ${schemeModalSurfaceButtonClass}`
                                        : 'cursor-not-allowed border-[#eef2f7] bg-[#f8fafc] text-slate-300',
                                    )}
                                    style={selectedSchemeBatchFieldIds.length > 0 ? staticWorkbenchMotionStyle : undefined}
                                  >
                                    移到未分配
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsBatchSizePanelOpen((current) => !current)}
                                    className={cn(
                                      'rounded-[9px] border border-[#d8e3ef] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                                      schemeModalSurfaceButtonClass,
                                    )}
                                    style={staticWorkbenchMotionStyle}
                                  >
                                    {isBatchSizePanelOpen ? '收起尺寸' : '批量尺寸'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={applySchemeBatchFieldSize}
                                    disabled={selectedSchemeBatchFieldIds.length === 0}
                                    className={cn(
                                      'rounded-[9px] border px-3 py-1.5 text-[10px] font-semibold',
                                      selectedSchemeBatchFieldIds.length > 0
                                        ? `border-primary/20 bg-primary/8 text-primary hover:border-primary/28 hover:bg-primary/12 ${schemeModalSurfaceButtonClass}`
                                        : 'cursor-not-allowed border-[#eef2f7] bg-[#f8fafc] text-slate-300',
                                    )}
                                    style={selectedSchemeBatchFieldIds.length > 0 ? staticWorkbenchMotionStyle : undefined}
                                  >
                                    应用批量值
                                  </button>
                                </div>
                              </div>
                              {isBatchSizePanelOpen ? (
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  <label className="grid gap-1 text-[10px] font-medium text-slate-500">
                                    <span>批量宽度</span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={schemeBatchSizeInput.w}
                                      onChange={(event) => setSchemeBatchSizeInput((current) => ({
                                        ...current,
                                        w: event.target.value.replace(/[^\d]/g, ''),
                                      }))}
                                      onKeyDown={(event) => handleSchemeFieldSizeInputKeyDown(
                                        event,
                                        applySchemeBatchFieldSize,
                                        () => setSchemeBatchSizeInput((current) => ({ ...current, w: '' })),
                                      )}
                                      className={cn(
                                        'h-8 rounded-[10px] border border-[#d8e3ef] bg-white px-3 text-[11px] text-slate-700 outline-none',
                                        schemeModalInputClass,
                                      )}
                                      style={staticWorkbenchMotionStyle}
                                      placeholder="如 280"
                                    />
                                  </label>
                                  <label className="grid gap-1 text-[10px] font-medium text-slate-500">
                                    <span>批量高度</span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={schemeBatchSizeInput.h}
                                      onChange={(event) => setSchemeBatchSizeInput((current) => ({
                                        ...current,
                                        h: event.target.value.replace(/[^\d]/g, ''),
                                      }))}
                                      onKeyDown={(event) => handleSchemeFieldSizeInputKeyDown(
                                        event,
                                        applySchemeBatchFieldSize,
                                        () => setSchemeBatchSizeInput((current) => ({ ...current, h: '' })),
                                      )}
                                      className={cn(
                                        'h-8 rounded-[10px] border border-[#d8e3ef] bg-white px-3 text-[11px] text-slate-700 outline-none',
                                        schemeModalInputClass,
                                      )}
                                      style={staticWorkbenchMotionStyle}
                                      placeholder="如 36"
                                    />
                                  </label>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        {selectedSchemeGroup ? visibleSchemeFieldRows.length > 0 ? visibleSchemeFieldRows.map((row) => (
                          <ArchiveLayoutSchemeFieldRow
                            key={row.fieldId}
                            assignedGroupName={row.assignedGroupName}
                            canMoveToNextGroup={row.canMoveToNextGroup}
                            canMoveToPreviousGroup={row.canMoveToPreviousGroup}
                            checked={row.checked}
                            fieldId={row.fieldId}
                            heightInput={row.heightInput}
                            isExpanded={row.isExpanded}
                            label={row.label}
                            onCommitSizeDraft={handleCommitSchemeFieldSizeDraft}
                            onHandleFieldSizeInputKeyDown={handleSchemeFieldSizeInputKeyDown}
                            onMoveField={moveSchemeFieldToGroup}
                            onNudgeSizeDraft={handleNudgeSchemeFieldSizeDraft}
                            onResetSizeDraft={handleResetSchemeFieldSizeDraft}
                            onToggleChecked={handleSchemeFieldCheckedChange}
                            onToggleExpanded={handleToggleSchemeFieldExpanded}
                            onUpdateSizeDraft={handleSchemeFieldSizeDraftChange}
                            resolvedHeight={row.resolvedHeight}
                            resolvedWidth={row.resolvedWidth}
                            schemeModalCardClass={schemeModalCardClass}
                            schemeModalInputClass={schemeModalInputClass}
                            schemeModalSelectedCardClass={schemeModalSelectedCardClass}
                            schemeModalSurfaceButtonClass={schemeModalSurfaceButtonClass}
                            showAssignedGroupName={row.showAssignedGroupName}
                            staticWorkbenchMotionStyle={staticWorkbenchMotionStyle}
                            title={row.title}
                            widthInput={row.widthInput}
                          />
                        )) : (
                          <div className="rounded-[16px] border border-dashed border-[#d8e3ef] bg-[#f8fbff] px-4 py-8 text-center">
                            <div className="text-[12px] font-semibold text-slate-600">没有匹配字段</div>
                            <div className="mt-1 text-[11px] text-slate-400">换个关键词，或切换到“全部 / 未分配”继续挑选。</div>
                          </div>
                        ) : (
                          <div className="rounded-[16px] border border-dashed border-[#d8e3ef] bg-[#f8fbff] px-4 py-8 text-center text-[12px] text-slate-400">
                            先选择一个分组，再勾选字段
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2f7] px-4 py-3">
                        <div className="text-[12px] text-slate-500">{schemeDraft.groups.length} 个分组 · {countSchemeFields(schemeDraft)} 个已选字段</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={saveSchemeDraft}
                            className={cn(
                              'rounded-[12px] border border-[#dbe5ef] bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 hover:border-[#cddaea] hover:bg-[#f8fbff]',
                              schemeModalSurfaceButtonClass,
                            )}
                            style={staticWorkbenchMotionStyle}
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              saveSchemeDraft();
                              applySchemeDraft(false);
                            }}
                            className="rounded-[12px] border border-primary/20 bg-primary px-4 py-2 text-[12px] font-semibold text-white transition-[background-color,border-color,box-shadow,transform] hover:-translate-y-[1px] hover:bg-primary/90 hover:shadow-[0_16px_28px_-20px_rgba(59,130,246,0.42)] active:translate-y-0"
                            style={staticWorkbenchMotionStyle}
                          >
                            保存并放入布局
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </>,
            globalThis.document.body,
          )
        : null}
      {openFieldEditorId && typeof globalThis.document !== 'undefined'
        ? createPortal(
            <>
              <div className="fixed inset-0 z-[120] bg-slate-950/12" onClick={() => { if (Date.now() >= outsideCloseBlockedUntilRef.current) { closeFieldEditor(); } }} />
              <div className="fixed inset-0 z-[121] flex items-center justify-center p-4" onClick={() => { if (Date.now() >= outsideCloseBlockedUntilRef.current) { closeFieldEditor(); } }}>
                <div className="w-[min(320px,calc(100vw-32px))] rounded-[14px] border border-[#d9e3ef] bg-white p-3 shadow-[0_20px_36px_-24px_rgba(15,23,42,0.24)]" onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
                  {activeFieldEditor ? (() => {
                    const fieldOption = optionMap.get(String(activeFieldEditor.field.field ?? ''));
                    const rawField = (fieldOption?.rawField ?? {}) as Record<string, any>;
                    return (
                      <div className="grid gap-2">
                        <div className="mb-1 flex items-center justify-between">
                          <div className="text-[13px] font-semibold text-slate-800">字段快编</div>
                          <button type="button" onClick={closeFieldEditor} className="rounded-[8px] border border-[#dbe5ef] bg-white px-2 py-1 text-[11px] text-slate-500 hover:bg-[#f8fbff]">关闭</button>
                        </div>
                        <label className="grid gap-1 text-[12px] text-slate-600"><span>标题</span><input value={String(activeFieldEditor.field.title || '')} onChange={(event) => updateField(activeFieldEditor.field.id, { title: event.target.value })} className="h-8 rounded-[10px] border border-[#d8e3ef] px-3 outline-none" /></label>
                        <label className="grid gap-1 text-[12px] text-slate-600">
                          <span>所在分组</span>
                          <select value={String(activeFieldEditor.field.parentId || activeFieldEditor.group.group.id)} onChange={(event) => { updateField(activeFieldEditor.field.id, { parentId: event.target.value }); setSelectedGroupId(event.target.value); }} className="h-8 rounded-[10px] border border-[#d8e3ef] px-3 outline-none">
                            {groups.map((item) => (
                              <option key={item.group.id} value={item.group.id}>{item.group.title || DEFAULT_GROUP_TITLE}</option>
                            ))}
                          </select>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="grid gap-1 text-[12px] text-slate-600">
                            <span>宽度</span>
                            <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextValue = nudgeFieldSizeValue(activeFieldEditor.field.id, 'w', activeFieldEditor.field.w, -20);
                                  setQuickEditorSizeInput((current) => ({ ...current, fieldId: activeFieldEditor.field.id, w: String(nextValue) }));
                                }}
                                className="h-8 rounded-[10px] border border-[#d8e3ef] bg-white text-[13px] font-semibold text-slate-500 hover:bg-[#f8fbff]"
                              >
                                -
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={quickEditorSizeInput.fieldId === activeFieldEditor.field.id ? quickEditorSizeInput.w : String(activeFieldEditor.field.w)}
                                onChange={(event) => setQuickEditorSizeInput((current) => ({
                                  ...current,
                                  fieldId: activeFieldEditor.field.id,
                                  w: event.target.value.replace(/[^\d]/g, ''),
                                }))}
                                onBlur={() => {
                                  const nextValue = commitFieldSizeValue(
                                    activeFieldEditor.field.id,
                                    'w',
                                    quickEditorSizeInput.w,
                                    activeFieldEditor.field.w,
                                  );
                                  setQuickEditorSizeInput((current) => ({ ...current, fieldId: activeFieldEditor.field.id, w: String(nextValue) }));
                                }}
                                onKeyDown={(event) => handleFieldSizeInputKeyDown(
                                  event,
                                  () => {
                                    const nextValue = commitFieldSizeValue(
                                      activeFieldEditor.field.id,
                                      'w',
                                      quickEditorSizeInput.w,
                                      activeFieldEditor.field.w,
                                    );
                                    setQuickEditorSizeInput((current) => ({ ...current, fieldId: activeFieldEditor.field.id, w: String(nextValue) }));
                                  },
                                  () => setQuickEditorSizeInput((current) => ({ ...current, fieldId: activeFieldEditor.field.id, w: String(activeFieldEditor.field.w) })),
                                )}
                                className="h-8 min-w-0 rounded-[10px] border border-[#d8e3ef] px-2 text-center outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const nextValue = nudgeFieldSizeValue(activeFieldEditor.field.id, 'w', activeFieldEditor.field.w, 20);
                                  setQuickEditorSizeInput((current) => ({ ...current, fieldId: activeFieldEditor.field.id, w: String(nextValue) }));
                                }}
                                className="h-8 rounded-[10px] border border-[#d8e3ef] bg-white text-[13px] font-semibold text-slate-500 hover:bg-[#f8fbff]"
                              >
                                +
                              </button>
                            </div>
                          </label>
                          <label className="grid gap-1 text-[12px] text-slate-600">
                            <span>高度</span>
                            <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextValue = nudgeFieldSizeValue(activeFieldEditor.field.id, 'h', activeFieldEditor.field.h, -4);
                                  setQuickEditorSizeInput((current) => ({ ...current, fieldId: activeFieldEditor.field.id, h: String(nextValue) }));
                                }}
                                className="h-8 rounded-[10px] border border-[#d8e3ef] bg-white text-[13px] font-semibold text-slate-500 hover:bg-[#f8fbff]"
                              >
                                -
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={quickEditorSizeInput.fieldId === activeFieldEditor.field.id ? quickEditorSizeInput.h : String(activeFieldEditor.field.h)}
                                onChange={(event) => setQuickEditorSizeInput((current) => ({
                                  ...current,
                                  fieldId: activeFieldEditor.field.id,
                                  h: event.target.value.replace(/[^\d]/g, ''),
                                }))}
                                onBlur={() => {
                                  const nextValue = commitFieldSizeValue(
                                    activeFieldEditor.field.id,
                                    'h',
                                    quickEditorSizeInput.h,
                                    activeFieldEditor.field.h,
                                  );
                                  setQuickEditorSizeInput((current) => ({ ...current, fieldId: activeFieldEditor.field.id, h: String(nextValue) }));
                                }}
                                onKeyDown={(event) => handleFieldSizeInputKeyDown(
                                  event,
                                  () => {
                                    const nextValue = commitFieldSizeValue(
                                      activeFieldEditor.field.id,
                                      'h',
                                      quickEditorSizeInput.h,
                                      activeFieldEditor.field.h,
                                    );
                                    setQuickEditorSizeInput((current) => ({ ...current, fieldId: activeFieldEditor.field.id, h: String(nextValue) }));
                                  },
                                  () => setQuickEditorSizeInput((current) => ({ ...current, fieldId: activeFieldEditor.field.id, h: String(activeFieldEditor.field.h) })),
                                )}
                                className="h-8 min-w-0 rounded-[10px] border border-[#d8e3ef] px-2 text-center outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const nextValue = nudgeFieldSizeValue(activeFieldEditor.field.id, 'h', activeFieldEditor.field.h, 4);
                                  setQuickEditorSizeInput((current) => ({ ...current, fieldId: activeFieldEditor.field.id, h: String(nextValue) }));
                                }}
                                className="h-8 rounded-[10px] border border-[#d8e3ef] bg-white text-[13px] font-semibold text-slate-500 hover:bg-[#f8fbff]"
                              >
                                +
                              </button>
                            </div>
                          </label>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button type="button" onClick={() => updateField(activeFieldEditor.field.id, { w: getFieldWidthPresetValue('compact', usablePreviewWorkbenchWidth) })} className="h-8 rounded-[10px] border border-[#dbe5ef] bg-[#f8fbff] text-[11px] font-medium text-slate-600">半宽</button>
                          <button type="button" onClick={() => updateField(activeFieldEditor.field.id, { w: getFieldWidthPresetValue('standard', usablePreviewWorkbenchWidth) })} className="h-8 rounded-[10px] border border-[#dbe5ef] bg-[#f8fbff] text-[11px] font-medium text-slate-600">标准</button>
                          <button type="button" onClick={() => updateField(activeFieldEditor.field.id, { w: getFieldWidthPresetValue('full', usablePreviewWorkbenchWidth) })} className="h-8 rounded-[10px] border border-[#dbe5ef] bg-[#f8fbff] text-[11px] font-medium text-slate-600">通栏</button>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button type="button" onClick={() => updateField(activeFieldEditor.field.id, { h: getFieldHeightPresetValue('single', rawField) })} className="h-8 rounded-[10px] border border-[#dbe5ef] bg-[#f8fbff] text-[11px] font-medium text-slate-600">单行</button>
                          <button type="button" onClick={() => updateField(activeFieldEditor.field.id, { h: getFieldHeightPresetValue('comfortable', rawField) })} className="h-8 rounded-[10px] border border-[#dbe5ef] bg-[#f8fbff] text-[11px] font-medium text-slate-600">双行</button>
                          <button type="button" onClick={() => updateField(activeFieldEditor.field.id, { h: getFieldHeightPresetValue('expanded', rawField) })} className="h-8 rounded-[10px] border border-[#dbe5ef] bg-[#f8fbff] text-[11px] font-medium text-slate-600">展开</button>
                        </div>
                        <label className="flex items-center gap-2 text-[12px] text-slate-600"><input type="checkbox" checked={Boolean(activeFieldEditor.field.required)} onChange={(event) => updateField(activeFieldEditor.field.id, { required: event.target.checked })} />必填</label>
                        <label className="flex items-center gap-2 text-[12px] text-slate-600"><input type="checkbox" checked={Boolean(activeFieldEditor.field.readOnly)} onChange={(event) => updateField(activeFieldEditor.field.id, { readOnly: event.target.checked })} />只读</label>
                        <button type="button" onClick={() => removeField(activeFieldEditor.field.id)} className="mt-1 h-8 rounded-[12px] border border-[#f1d4d8] bg-[#fff7f7] text-[12px] font-medium text-rose-600 hover:bg-[#fff1f1]">移除该字段控件</button>
                      </div>
                    );
                  })() : (
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[13px] font-semibold text-slate-800">字段快编</div>
                        <button type="button" onClick={closeFieldEditor} className="rounded-[8px] border border-[#dbe5ef] bg-white px-2 py-1 text-[11px] text-slate-500 hover:bg-[#f8fbff]">关闭</button>
                      </div>
                      <div className="rounded-[10px] border border-[#e5ebf3] bg-[#f8fbff] px-3 py-3 text-[12px] text-slate-500">字段设置正在加载，请再双击一次字段。</div>
                    </div>
                  )}
                </div>
              </div>
            </>,
            globalThis.document.body,
          )
        : null}
    </div>
  );
});

