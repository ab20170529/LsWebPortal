import { useEffect, useMemo, useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from 'react';

import {
  buildDetailBoardGroup,
  createSuggestedDetailBoardGroups,
  getDetailBoardGroupColumnRow,
} from './detail-board-config';
import {
  getRecordFieldValue,
  toRecordNumber,
} from './dashboard-field-type-utils';

type LayoutPresetKey = 'balanced' | 'dense' | 'guided';
type FieldPreviewType = 'number' | 'select' | 'text' | 'textarea';

type LayoutPresetDefinition = {
  defaultColumnCount: number;
  defaultRowSpace: number;
  key: LayoutPresetKey;
  label: string;
};

type NormalizedLayoutField = {
  baseHeight: number;
  defaultValue: string;
  id: string;
  label: string;
  type: FieldPreviewType;
};

type PreviewFieldLayout = NormalizedLayoutField & {
  height: number;
  width: number;
  x: number;
  y: number;
};

type PreviewGroupLayout = {
  fields: PreviewFieldLayout[];
  height: number;
  id: string;
  name: string;
  rowSpace: number;
  width: number;
  x: number;
  y: number;
};

type ArchiveLayoutPreviewControl = {
  columnId: string;
  layoutRow?: Record<string, unknown> | null;
  orderId?: number;
};

type LegacyDefinitionLayoutWorkbenchProps = {
  availableColumns: Record<string, any>[];
  currentDetailBoard: Record<string, any>;
  moduleCode?: string;
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  onOpenPreview?: () => void;
  onUpdateDetailBoard: (patch: Record<string, any> | ((current: any) => any)) => void;
  selectedGroupId: string | null;
  setSelectedGroupId: (groupId: string | null) => void;
  title?: string;
};

const STAGE_WIDTH = 760;
const STAGE_OFFSET_X = 24;
const STAGE_TOP_PADDING = 24;
const GROUP_GAP = 22;
const GROUP_HEADER_HEIGHT = 56;
const GROUP_PADDING_X = 18;
const GROUP_PADDING_BOTTOM = 18;
const GROUP_PADDING_TOP = 16;
const FIELD_GAP = 14;
const FIELD_HEIGHT_MIN = 56;
const FIELD_HEIGHT_MAX = 180;
const FIELD_HEIGHT_PRESETS = [
  { label: '标准', value: 68 },
  { label: '加高', value: 96 },
  { label: '大块', value: 132 },
];

const LAYOUT_PRESET_OPTIONS: LayoutPresetDefinition[] = [
  { key: 'balanced', label: '平衡', defaultColumnCount: 2, defaultRowSpace: 14 },
  { key: 'dense', label: '紧凑', defaultColumnCount: 3, defaultRowSpace: 10 },
  { key: 'guided', label: '舒展', defaultColumnCount: 2, defaultRowSpace: 18 },
];

const GENERIC_FIELD_LABEL_PATTERNS = [
  /^field_\d+$/i,
  /^designer_control_\d+$/i,
  /^tree_field_\d+$/i,
  /^tree_grid_\d+$/i,
  /^grid_(field|column)_\d+$/i,
  /^column_\d+$/i,
  /^col_\d+$/i,
  /^字段\s*\d+$/i,
];

const LAYOUT_RECT_LEFT_KEYS = [
  'controlLeft',
  'left',
  'Left',
  'locationLeft',
  'locationX',
  'x',
  'X',
];

const LAYOUT_RECT_TOP_KEYS = [
  'controlTop',
  'top',
  'Top',
  'locationTop',
  'locationY',
  'y',
  'Y',
];

const LAYOUT_RECT_WIDTH_KEYS = [
  'controlWidth',
  'width',
  'Width',
  'layoutWidth',
];

const LAYOUT_RECT_HEIGHT_KEYS = [
  'controlHeight',
  'height',
  'Height',
  'layoutHeight',
];

function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function resolvePreviewLayoutRect(record: Record<string, unknown> | null | undefined) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const left = toRecordNumber(getRecordFieldValue(record, ...LAYOUT_RECT_LEFT_KEYS), Number.NaN);
  const top = toRecordNumber(getRecordFieldValue(record, ...LAYOUT_RECT_TOP_KEYS), Number.NaN);
  const width = toRecordNumber(getRecordFieldValue(record, ...LAYOUT_RECT_WIDTH_KEYS), Number.NaN);
  const height = toRecordNumber(getRecordFieldValue(record, ...LAYOUT_RECT_HEIGHT_KEYS), Number.NaN);

  if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { height, left, top, width };
}

function buildPreviewRowFieldMap(
  group: Record<string, any>,
  groupFieldIds: string[],
  fieldMap: Map<string, NormalizedLayoutField>,
  sourceControlMap: Map<string, ArchiveLayoutPreviewControl>,
) {
  const positionedEntries = groupFieldIds
    .map((fieldId) => {
      const field = fieldMap.get(String(fieldId));
      if (!field) {
        return null;
      }

      const sourceControl = sourceControlMap.get(String(fieldId));
      const rect = resolvePreviewLayoutRect(sourceControl?.layoutRow ?? null);
      if (!rect) {
        return null;
      }

      return {
        field,
        height: rect.height,
        left: rect.left,
        orderId: Number.isFinite(Number(sourceControl?.orderId)) ? Number(sourceControl?.orderId) : Number.MAX_SAFE_INTEGER,
        top: rect.top,
      };
    })
    .filter(Boolean) as Array<{
      field: NormalizedLayoutField;
      height: number;
      left: number;
      orderId: number;
      top: number;
    }>;

  const sortedPositionedEntries = positionedEntries
    .slice()
    .sort((left, right) => (
      left.top - right.top
      || left.left - right.left
      || left.orderId - right.orderId
    ));

  const provisionalRowMap = new Map<number, NormalizedLayoutField[]>();
  let currentRowNumber = 0;
  let currentRowBaselineTop: number | null = null;
  let currentRowBaselineHeight: number | null = null;

  sortedPositionedEntries.forEach((entry) => {
    if (currentRowBaselineTop == null || currentRowBaselineHeight == null) {
      currentRowNumber = 1;
      provisionalRowMap.set(currentRowNumber, [entry.field]);
      currentRowBaselineTop = entry.top;
      currentRowBaselineHeight = entry.height;
      return;
    }

    const rowTolerance = Math.max(12, Math.min(currentRowBaselineHeight, entry.height) * 0.5);
    if (Math.abs(entry.top - currentRowBaselineTop) <= rowTolerance) {
      const currentRow = provisionalRowMap.get(currentRowNumber) ?? [];
      currentRow.push(entry.field);
      provisionalRowMap.set(currentRowNumber, currentRow);
      currentRowBaselineTop = Math.min(currentRowBaselineTop, entry.top);
      currentRowBaselineHeight = Math.max(currentRowBaselineHeight, entry.height);
      return;
    }

    currentRowNumber += 1;
    provisionalRowMap.set(currentRowNumber, [entry.field]);
    currentRowBaselineTop = entry.top;
    currentRowBaselineHeight = entry.height;
  });

  const assignedFieldIds = new Set(sortedPositionedEntries.map((entry) => entry.field.id));
  groupFieldIds.forEach((fieldId) => {
    const normalizedFieldId = String(fieldId);
    if (assignedFieldIds.has(normalizedFieldId)) {
      return;
    }

    const field = fieldMap.get(normalizedFieldId);
    if (!field) {
      return;
    }

    const fallbackRow = Math.max(1, getDetailBoardGroupColumnRow(group, normalizedFieldId));
    const fallbackRowFields = provisionalRowMap.get(fallbackRow) ?? [];
    fallbackRowFields.push(field);
    provisionalRowMap.set(fallbackRow, fallbackRowFields);
  });

  const normalizedRowEntries = [...provisionalRowMap.entries()]
    .sort((left, right) => left[0] - right[0])
    .filter(([, rowFields]) => rowFields.length > 0);

  return new Map(
    normalizedRowEntries.map(([, rowFields], index) => [index + 1, rowFields] as const),
  );
}

function getPresetDefinition(presetKey: LayoutPresetKey) {
  return LAYOUT_PRESET_OPTIONS.find((item) => item.key === presetKey) ?? LAYOUT_PRESET_OPTIONS[0];
}

function resolveGroupNameValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function inferFieldType(column: Record<string, any>) {
  const normalizedName = String(column.name || column.label || '').toLowerCase();
  const rawType = String(column.type || column.fieldType || column.fieldtypeid || '').toLowerCase();

  if (
    rawType.includes('textarea')
    || rawType.includes('memo')
    || rawType.includes('remark')
    || /备注|说明|描述/.test(normalizedName)
  ) {
    return 'textarea' as const;
  }

  if (
    rawType.includes('select')
    || rawType.includes('combo')
    || rawType.includes('drop')
  ) {
    return 'select' as const;
  }

  if (
    rawType.includes('number')
    || rawType.includes('int')
    || rawType.includes('decimal')
    || rawType.includes('money')
    || /数量|金额|单价|价格|比率/.test(normalizedName)
  ) {
    return 'number' as const;
  }

  return 'text' as const;
}

function inferFieldHeight(column: Record<string, any>, fieldType: FieldPreviewType) {
  const explicitHeight = Number(
    column.controlHeight
    ?? column.layoutHeight
    ?? column.height
    ?? column.controlheight
    ?? column.layoutheight,
  );

  if (Number.isFinite(explicitHeight) && explicitHeight > 0) {
    return clampValue(Math.round(explicitHeight), FIELD_HEIGHT_MIN, FIELD_HEIGHT_MAX);
  }

  return fieldType === 'textarea'
    ? FIELD_HEIGHT_PRESETS[0]?.value ?? 68
    : 68;
}

function normalizeCandidateText(value: unknown) {
  return String(value ?? '').trim();
}

function isGenericFieldLabel(value: string, fieldId: string) {
  if (!value) {
    return true;
  }

  if (GENERIC_FIELD_LABEL_PATTERNS.some((pattern) => pattern.test(value))) {
    return true;
  }

  return fieldId.length > 0
    && value.toLowerCase() === fieldId.toLowerCase()
    && GENERIC_FIELD_LABEL_PATTERNS.some((pattern) => pattern.test(fieldId));
}

function resolveFieldLabel(
  normalized: Record<string, any>,
  column: Record<string, any>,
  index: number,
) {
  const fieldId = normalizeCandidateText(normalized.id || column.id || '');
  const labelCandidates = [
    normalized.userName,
    normalized.username,
    normalized.displayName,
    normalized.displayname,
    normalized.caption,
    normalized.title,
    normalized.label,
    normalized.name,
    column.userName,
    column.username,
    column.displayName,
    column.displayname,
    column.caption,
    column.title,
    column.label,
    column.name,
    normalized.sourceField,
    normalized.fieldName,
    column.sourceField,
    column.fieldName,
  ]
    .map(normalizeCandidateText)
    .filter(Boolean);

  return labelCandidates.find((candidate) => !isGenericFieldLabel(candidate, fieldId)) ?? `字段 ${index + 1}`;
}

function buildNormalizedFields(
  availableColumns: Record<string, any>[],
  normalizeColumn: (column: Record<string, any>) => Record<string, any>,
) {
  return availableColumns
    .map((column, index) => {
      const normalized = normalizeColumn(column);
      const id = String(normalized.id || column.id || `field_${index + 1}`);
      const label = resolveFieldLabel(normalized, column, index);
      const fieldType = inferFieldType(normalized);

      return {
        baseHeight: inferFieldHeight(normalized, fieldType),
        defaultValue: String(normalized.defaultValue ?? normalized.value ?? ''),
        id,
        label,
        type: fieldType,
      } satisfies NormalizedLayoutField;
    })
    .filter((field) => field.id.trim().length > 0);
}

function buildPreviewGroups(
  groups: Record<string, any>[],
  fieldMap: Map<string, NormalizedLayoutField>,
  columnCount: number,
  rowSpace: number,
  sourceControlMap: Map<string, ArchiveLayoutPreviewControl>,
) {
  const stageWidth = STAGE_WIDTH - STAGE_OFFSET_X * 2;
  const normalizedColumns = clampValue(columnCount, 1, 3);
  const normalizedRowSpace = clampValue(rowSpace, 8, 24);
  let currentTop = STAGE_TOP_PADDING;

  return groups.map<PreviewGroupLayout>((group, groupIndex) => {
    const groupFieldIds = Array.isArray(group?.columnIds) ? group.columnIds : [];
    const innerWidth = stageWidth - GROUP_PADDING_X * 2;

    const resolvedFieldHeights = new Map<string, number>();
    groupFieldIds.forEach((fieldId: string) => {
      const field = fieldMap.get(String(fieldId));
      if (!field) {
        return;
      }

      const resolvedHeight = clampValue(
        Number(group?.columnHeights?.[field.id]) > 0 ? Number(group.columnHeights[field.id]) : field.baseHeight,
        FIELD_HEIGHT_MIN,
        FIELD_HEIGHT_MAX,
      );
      resolvedFieldHeights.set(field.id, resolvedHeight);
    });

    const rowFieldMap = buildPreviewRowFieldMap(group, groupFieldIds, fieldMap, sourceControlMap);

    const maxRowFieldCount = Math.max(
      1,
      ...Array.from(rowFieldMap.values(), (rowFields) => rowFields.length),
    );
    const previewColumnCount = clampValue(
      Math.max(
        normalizedColumns,
        Number.isFinite(Number(group?.columnsPerRow)) ? Number(group.columnsPerRow) : 0,
        maxRowFieldCount,
      ),
      1,
      3,
    );
    const computedFieldWidth = Math.floor(
      (innerWidth - FIELD_GAP * Math.max(previewColumnCount - 1, 0)) / Math.max(previewColumnCount, 1),
    );

    const resolvedRowCount = Math.max(
      1,
      Number.isFinite(Number(group?.rows)) ? Number(group.rows) : 1,
      ...Array.from(rowFieldMap.keys()),
    );
    const rowHeights = Array.from({ length: resolvedRowCount }, (_, rowIndex) => {
      const rowFields = rowFieldMap.get(rowIndex + 1) ?? [];
      if (rowFields.length === 0) {
        return 0;
      }

      return rowFields.reduce((maxHeight, field) => (
        Math.max(maxHeight, resolvedFieldHeights.get(field.id) ?? field.baseHeight)
      ), 0);
    });

    const rowTops = rowHeights.map((_, rowIndex) => {
      let top = GROUP_HEADER_HEIGHT + GROUP_PADDING_TOP;
      for (let index = 0; index < rowIndex; index += 1) {
        top += rowHeights[index] + normalizedRowSpace;
      }
      return top;
    });

    let groupContentBottom = GROUP_HEADER_HEIGHT + GROUP_PADDING_TOP;
    const fieldLayouts: PreviewFieldLayout[] = [];

    Array.from({ length: resolvedRowCount }, (_, rowIndex) => rowIndex + 1).forEach((rowNumber) => {
      const rowFields = rowFieldMap.get(rowNumber) ?? [];
      const rowTop = rowTops[rowNumber - 1] ?? (GROUP_HEADER_HEIGHT + GROUP_PADDING_TOP);

      rowFields.forEach((field, columnIndex) => {
        const fieldHeight = resolvedFieldHeights.get(field.id) ?? field.baseHeight;
        const x = GROUP_PADDING_X + columnIndex * (computedFieldWidth + FIELD_GAP);
        const y = rowTop;

        groupContentBottom = Math.max(groupContentBottom, y + fieldHeight);
        fieldLayouts.push({
          ...field,
          height: fieldHeight,
          width: computedFieldWidth,
          x,
          y,
        });
      });
    });

    const groupHeight = Math.max(groupContentBottom + GROUP_PADDING_BOTTOM, GROUP_HEADER_HEIGHT + 96);
    const previewGroup: PreviewGroupLayout = {
      fields: fieldLayouts,
      height: groupHeight,
      id: String(group?.id || `group_${groupIndex + 1}`),
      name: resolveGroupNameValue(group?.name, `信息分组 ${groupIndex + 1}`),
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
  switch (field.type) {
    case 'number':
      return (
        <div className="bill-designer-control-shell flex h-full items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 text-[12px] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
          <span className="min-w-0 flex-1 truncate">{field.defaultValue || '0.00'}</span>
          <span className="material-symbols-outlined text-[15px] text-slate-300">calculate</span>
        </div>
      );
    case 'select':
      return (
        <div className="bill-designer-control-shell flex h-full items-center justify-between rounded-[14px] border border-slate-200 bg-white px-3 text-[12px] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
          <span className="truncate">{field.defaultValue || '请选择'}</span>
          <span className="material-symbols-outlined text-[16px] text-slate-300">expand_more</span>
        </div>
      );
    case 'textarea':
      return (
        <div className="bill-designer-control-shell flex h-full items-start rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-[12px] leading-5 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
          <span className="line-clamp-3 overflow-hidden break-all">{field.defaultValue || '请输入内容'}</span>
        </div>
      );
    default:
      return (
        <div className="bill-designer-control-shell flex h-full items-center rounded-[14px] border border-slate-200 bg-white px-3 text-[12px] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
          <span>{field.defaultValue || '请输入内容'}</span>
        </div>
      );
  }
}

function getFieldTypeLabel(type: FieldPreviewType) {
  switch (type) {
    case 'number':
      return '数字控件';
    case 'select':
      return '下拉控件';
    case 'textarea':
      return '备注控件';
    default:
      return '文本控件';
  }
}

function formatPixelValue(value: number) {
  return `${Math.round(value)}px`;
}

function buildFlowRows(columnIds: string[], columnsPerRow: number) {
  const safeColumnsPerRow = Math.max(1, columnsPerRow);

  return {
    columnRows: Object.fromEntries(
      columnIds.map((columnId, index) => [columnId, Math.floor(index / safeColumnsPerRow) + 1]),
    ),
    rows: Math.max(1, Math.ceil(Math.max(columnIds.length, 1) / safeColumnsPerRow)),
  };
}

function isStackedFieldPreview(field: PreviewFieldLayout) {
  return field.height >= (FIELD_HEIGHT_PRESETS[2]?.value ?? 132);
}

function matchesFieldSearch(field: NormalizedLayoutField, keyword: string) {
  if (!keyword) {
    return true;
  }

  const haystack = `${field.label} ${field.id}`.toLowerCase();
  return haystack.includes(keyword);
}

type FieldTokenProps = {
  active?: boolean;
  checked?: boolean;
  compact?: boolean;
  disabled?: boolean;
  label: string;
  meta?: string;
  onClick?: () => void;
  onRemove?: () => void;
  onToggleSelect?: () => void;
  trailingIcon?: string;
};

function FieldToken({
  active = false,
  checked = false,
  compact = false,
  disabled = false,
  label,
  meta,
  onClick,
  onRemove,
  onToggleSelect,
  trailingIcon,
}: FieldTokenProps) {
  if (compact) {
    return (
      <div
        className={`group inline-flex h-8 max-w-full items-center gap-1 rounded-full border px-2.5 transition-all ${
          disabled
            ? 'border-slate-200 bg-slate-100 text-slate-400'
            : active
              ? 'border-primary/30 bg-primary/10 text-primary shadow-[0_12px_20px_-18px_rgba(37,99,235,0.35)]'
              : checked
                ? 'border-slate-300 bg-white text-slate-700 shadow-[0_10px_18px_-20px_rgba(15,23,42,0.26)]'
                : 'border-slate-200/85 bg-slate-50/92 text-slate-600 hover:border-slate-300 hover:bg-white'
        }`}
      >
        {onToggleSelect ? (
          <button
            type="button"
            onClick={onToggleSelect}
            disabled={disabled}
            className={`inline-flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
              checked
                ? 'border-primary bg-primary text-white'
                : 'border-slate-300 bg-white text-transparent hover:border-primary/40'
            }`}
            aria-label={`${checked ? '取消勾选' : '勾选'} ${label}`}
          >
            <span className="material-symbols-outlined text-[11px] leading-none">check</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || !onClick}
          className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold"
        >
          {label}
        </button>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-rose-600"
            aria-label={`移除 ${label}`}
          >
            <span className="material-symbols-outlined text-[13px] leading-none">close</span>
          </button>
        ) : trailingIcon ? (
          <button
            type="button"
            onClick={onClick}
            disabled={disabled || !onClick}
            className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-primary"
            aria-label={`${trailingIcon === 'add' ? '加入' : '操作'} ${label}`}
          >
            <span className="material-symbols-outlined text-[13px] leading-none">{trailingIcon}</span>
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`group flex min-h-[46px] items-center gap-2 rounded-[16px] border px-3 py-2 transition-all ${
        disabled
          ? 'border-slate-200 bg-slate-100 text-slate-400'
          : active
            ? 'border-primary/25 bg-primary/10 shadow-[0_18px_34px_-28px_rgba(37,99,235,0.32)]'
            : 'border-slate-200/80 bg-slate-50/82 text-slate-700 hover:border-slate-300 hover:bg-white'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || !onClick}
        className="min-w-0 flex-1 text-left"
      >
        <div className={`truncate text-[12px] font-semibold ${active ? 'text-primary' : 'text-current'}`}>{label}</div>
        {meta ? (
          <div className={`mt-0.5 truncate text-[10px] ${active ? 'text-primary/70' : 'text-slate-400'}`}>{meta}</div>
        ) : null}
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
            active
              ? 'border-primary/15 bg-white/85 text-primary hover:border-rose-200 hover:text-rose-600'
              : 'border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:text-rose-600'
          }`}
          aria-label={`移除 ${label}`}
        >
          <span className="material-symbols-outlined text-[15px]">close</span>
        </button>
      ) : trailingIcon ? (
        <span
          className={`material-symbols-outlined shrink-0 text-[16px] ${
            disabled ? 'text-slate-300' : active ? 'text-primary/80' : 'text-slate-400'
          }`}
        >
          {trailingIcon}
        </span>
      ) : null}
    </div>
  );
}

type RangeFieldProps = {
  label: string;
  marks?: Array<{ label: string; value: number }>;
  max: number;
  min: number;
  onChange: (nextValue: number) => void;
  step: number;
  value: number;
  valueLabel?: string;
};

function RangeField({
  label,
  marks,
  max,
  min,
  onChange,
  step,
  value,
  valueLabel,
}: RangeFieldProps) {
  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white/88 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] font-semibold text-slate-800">{label}</div>
        <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{valueLabel ?? value}</div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-primary"
      />
      {marks && marks.length > 0 ? (
        <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-slate-400">
          {marks.map((mark) => (
            <span key={`${label}-${mark.value}`}>{mark.label}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LegacyDefinitionLayoutWorkbench({
  availableColumns,
  currentDetailBoard,
  normalizeColumn,
  onOpenPreview,
  onUpdateDetailBoard,
  selectedGroupId,
  setSelectedGroupId,
}: LegacyDefinitionLayoutWorkbenchProps) {
  const defaultPreset = getPresetDefinition('balanced');
  const [selectedPreset, setSelectedPreset] = useState<LayoutPresetKey>(defaultPreset.key);
  const [columnCount, setColumnCount] = useState(defaultPreset.defaultColumnCount);
  const [fieldSearch, setFieldSearch] = useState('');
  const [checkedFieldIds, setCheckedFieldIds] = useState<string[]>([]);
  const [marqueeSelection, setMarqueeSelection] = useState<null | {
    currentX: number;
    currentY: number;
    startX: number;
    startY: number;
  }>(null);
  const [pendingSelectedGroupId, setPendingSelectedGroupId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [rowSpace, setRowSpace] = useState(defaultPreset.defaultRowSpace);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [heightDragState, setHeightDragState] = useState<null | {
    fieldId: string;
    startHeight: number;
    startY: number;
  }>(null);
  const [, startTransition] = useTransition();
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const normalizedFields = useMemo(
    () => buildNormalizedFields(availableColumns, normalizeColumn),
    [availableColumns, normalizeColumn],
  );
  const groups = useMemo(
    () => (Array.isArray(currentDetailBoard?.groups) ? currentDetailBoard.groups : []),
    [currentDetailBoard],
  );
  const hiddenFieldIds = useMemo(
    () => (Array.isArray(currentDetailBoard?.hiddenColumnIds) ? currentDetailBoard.hiddenColumnIds.map(String) : []),
    [currentDetailBoard],
  );
  const hiddenFieldIdSet = useMemo(
    () => new Set(hiddenFieldIds),
    [hiddenFieldIds],
  );
  const visibleFields = useMemo(
    () => normalizedFields.filter((field) => !hiddenFieldIdSet.has(field.id)),
    [hiddenFieldIdSet, normalizedFields],
  );
  const fieldMap = useMemo(
    () => new Map(visibleFields.map((field) => [field.id, field])),
    [visibleFields],
  );
  const groupIds = useMemo(
    () => groups.map((group: any) => String(group?.id || '')).filter(Boolean),
    [groups],
  );
  const groupIdSet = useMemo(
    () => new Set(groupIds),
    [groupIds],
  );
  const activeGroupId = pendingSelectedGroupId && groupIdSet.has(pendingSelectedGroupId)
    ? pendingSelectedGroupId
    : (selectedGroupId && groupIdSet.has(selectedGroupId) ? selectedGroupId : (groupIds[0] ?? null));

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      if (groupIds.length === 0) {
        if (selectedGroupId !== null) {
          setSelectedGroupId(null);
        }
        if (pendingSelectedGroupId !== null) {
          setPendingSelectedGroupId(null);
        }
        return;
      }

      if (pendingSelectedGroupId) {
        if (groupIdSet.has(pendingSelectedGroupId)) {
          if (selectedGroupId !== pendingSelectedGroupId) {
            setSelectedGroupId(pendingSelectedGroupId);
          }
          setPendingSelectedGroupId(null);
        }
        return;
      }

      const firstGroupId = groupIds[0] ?? null;
      if (selectedGroupId && groupIdSet.has(selectedGroupId)) {
        return;
      }
      if (selectedGroupId !== firstGroupId) {
        setSelectedGroupId(firstGroupId);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [groupIdSet, groupIds, pendingSelectedGroupId, selectedGroupId, setSelectedGroupId]);

  const selectedGroup = groups.find((group: any) => group.id === activeGroupId) ?? null;
  const occupiedFieldIds = useMemo(
    () => new Set(groups.flatMap((group: any) => Array.isArray(group?.columnIds) ? group.columnIds.map(String) : [])),
    [groups],
  );
  const unassignedFields = visibleFields.filter((field) => !occupiedFieldIds.has(field.id));
  const unassignedFieldIds = useMemo(
    () => new Set(unassignedFields.map((field) => field.id)),
    [unassignedFields],
  );
  const archiveLayoutSourceControlMap = useMemo(() => {
    const sourceControls = Array.isArray(currentDetailBoard?.archiveLayoutSource?.controls)
      ? currentDetailBoard.archiveLayoutSource.controls
      : [];

    return new Map(
      sourceControls
        .map((control: any) => ({
          columnId: String(control?.columnId || ''),
          layoutRow: control?.layoutRow && typeof control.layoutRow === 'object'
            ? control.layoutRow as Record<string, unknown>
            : null,
          orderId: Number(control?.orderId),
        }))
        .filter((control) => control.columnId),
    );
  }, [currentDetailBoard]);
  const previewGroups = useMemo(
    () => buildPreviewGroups(groups, fieldMap, columnCount, rowSpace, archiveLayoutSourceControlMap),
    [archiveLayoutSourceControlMap, columnCount, fieldMap, groups, rowSpace],
  );
  const previewSelectedGroup = previewGroups.find((group) => group.id === activeGroupId) ?? previewGroups[0] ?? null;
  const lastGroup = previewGroups[previewGroups.length - 1] ?? null;
  const canvasHeight = lastGroup ? lastGroup.y + lastGroup.height + 28 : 420;
  const selectedGroupFieldIds = useMemo(
    () => (Array.isArray(selectedGroup?.columnIds) ? selectedGroup.columnIds.map(String) : []),
    [selectedGroup],
  );
  const selectedGroupFields = selectedGroupFieldIds
    .map((fieldId) => fieldMap.get(fieldId))
    .filter(Boolean) as NormalizedLayoutField[];
  const normalizedFieldSearch = fieldSearch.trim().toLowerCase();
  const filteredSelectedGroupFields = selectedGroupFields.filter((field) => matchesFieldSearch(field, normalizedFieldSearch));
  const filteredUnassignedFields = unassignedFields.filter((field) => matchesFieldSearch(field, normalizedFieldSearch));
  const checkedFieldIdSet = useMemo(
    () => new Set(checkedFieldIds),
    [checkedFieldIds],
  );
  const checkedSelectedGroupFieldIds = selectedGroupFieldIds.filter((fieldId) => checkedFieldIdSet.has(fieldId));
  const checkedUnassignedFieldIds = unassignedFields.map((field) => field.id).filter((fieldId) => checkedFieldIdSet.has(fieldId));
  const activeFieldId = selectedFieldId && selectedGroupFieldIds.includes(selectedFieldId)
    ? selectedFieldId
    : (selectedGroupFieldIds[0] ?? null);
  const selectedField = selectedGroupFields.find((field) => field.id === activeFieldId) ?? null;
  const previewSelectedField = previewSelectedGroup?.fields.find((field) => field.id === activeFieldId) ?? null;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      if (activeFieldId !== selectedFieldId) {
        setSelectedFieldId(activeFieldId);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [activeFieldId, selectedFieldId]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setCheckedFieldIds((current) => {
        const next = current.filter((fieldId) => selectedGroupFieldIds.includes(fieldId) || unassignedFieldIds.has(fieldId));
        return next.length === current.length && next.every((fieldId, index) => fieldId === current[index]) ? current : next;
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [selectedGroupFieldIds, unassignedFieldIds]);

  const selectGroup = (groupId: string | null) => {
    setPendingSelectedGroupId(null);
    setCheckedFieldIds([]);
    setSelectedGroupId(groupId);
  };

  const toggleCheckedField = (fieldId: string) => {
    setCheckedFieldIds((current) => (
      current.includes(fieldId)
        ? current.filter((id) => id !== fieldId)
        : [...current, fieldId]
    ));
  };

  const toggleCheckAll = (fieldIds: string[]) => {
    if (fieldIds.length === 0) {
      return;
    }

    setCheckedFieldIds((current) => {
      const currentSet = new Set(current);
      const isAllChecked = fieldIds.every((fieldId) => currentSet.has(fieldId));

      if (isAllChecked) {
        return current.filter((fieldId) => !fieldIds.includes(fieldId));
      }

      return [...new Set([...current, ...fieldIds])];
    });
  };

  const marqueeBounds = marqueeSelection ? {
    height: Math.abs(marqueeSelection.currentY - marqueeSelection.startY),
    left: Math.min(marqueeSelection.startX, marqueeSelection.currentX),
    top: Math.min(marqueeSelection.startY, marqueeSelection.currentY),
    width: Math.abs(marqueeSelection.currentX - marqueeSelection.startX),
  } : null;

  const getSelectedFieldHeight = (fieldId: string) => clampValue(
    Number(selectedGroup?.columnHeights?.[fieldId]) > 0
      ? Number(selectedGroup?.columnHeights?.[fieldId])
      : (fieldMap.get(fieldId)?.baseHeight ?? 68),
    FIELD_HEIGHT_MIN,
    FIELD_HEIGHT_MAX,
  );
  const selectedFieldHeight = selectedField ? getSelectedFieldHeight(selectedField.id) : FIELD_HEIGHT_PRESETS[0]?.value ?? 68;
  const selectedFieldPreview = selectedField
    ? (previewSelectedField ?? {
        ...selectedField,
        height: selectedFieldHeight,
        width: 0,
        x: 0,
        y: 0,
      })
    : null;
  const selectedFieldPreviewStacked = selectedFieldPreview ? isStackedFieldPreview(selectedFieldPreview) : false;
  const selectedFieldControlHeight = selectedFieldPreview
    ? (
        selectedFieldPreviewStacked
          ? Math.max(52, selectedFieldPreview.height - 40)
          : Math.max(40, selectedFieldPreview.height - 16)
      )
    : 0;
  const selectedGroupStableId = selectedGroup?.id ?? null;

  const handleUpdateFieldHeight = (fieldId: string, nextHeight: number) => {
    if (!selectedGroupStableId) {
      return;
    }

    const normalizedHeight = clampValue(Math.round(nextHeight), FIELD_HEIGHT_MIN, FIELD_HEIGHT_MAX);

    onUpdateDetailBoard((current: any) => ({
      ...current,
      enabled: true,
      groups: (Array.isArray(current?.groups) ? current.groups : []).map((group: any) => {
        if (group.id !== selectedGroupStableId) {
          return group;
        }

        return {
          ...group,
          columnHeights: {
            ...(group?.columnHeights ?? {}),
            [fieldId]: normalizedHeight,
          },
        };
      }),
    }));
  };

  useEffect(() => {
    if (!heightDragState || !selectedGroupStableId) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const deltaY = event.clientY - heightDragState.startY;
      const nextHeight = clampValue(
        Math.round(heightDragState.startHeight + deltaY),
        FIELD_HEIGHT_MIN,
        FIELD_HEIGHT_MAX,
      );

      onUpdateDetailBoard((current: any) => ({
        ...current,
        enabled: true,
        groups: (Array.isArray(current?.groups) ? current.groups : []).map((group: any) => {
          if (group.id !== selectedGroupStableId) {
            return group;
          }

          return {
            ...group,
            columnHeights: {
              ...(group?.columnHeights ?? {}),
              [heightDragState.fieldId]: nextHeight,
            },
          };
        }),
      }));
    };

    const handlePointerUp = () => {
      setHeightDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [heightDragState, onUpdateDetailBoard, selectedGroupStableId]);

  useEffect(() => {
    if (!marqueeSelection || !canvasRef.current || !previewSelectedGroup) {
      return;
    }

    const canvasElement = canvasRef.current;
    const canvasRect = canvasElement.getBoundingClientRect();

    const handlePointerMove = (event: PointerEvent) => {
      setMarqueeSelection((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          currentX: clampValue(event.clientX - canvasRect.left, 0, canvasRect.width),
          currentY: clampValue(event.clientY - canvasRect.top, 0, canvasRect.height),
        };
      });
    };

    const handlePointerUp = () => {
      setMarqueeSelection((current) => {
        if (!current) {
          return current;
        }

        const left = Math.min(current.startX, current.currentX);
        const right = Math.max(current.startX, current.currentX);
        const top = Math.min(current.startY, current.currentY);
        const bottom = Math.max(current.startY, current.currentY);
        const selectedIds = previewSelectedGroup.fields
          .filter((field) => {
            const fieldLeft = previewSelectedGroup.x + field.x;
            const fieldTop = previewSelectedGroup.y + field.y;
            const fieldRight = fieldLeft + field.width;
            const fieldBottom = fieldTop + field.height;

            return !(fieldRight < left || fieldLeft > right || fieldBottom < top || fieldTop > bottom);
          })
          .map((field) => field.id);

        if (selectedIds.length > 0) {
          setCheckedFieldIds((existing) => [...new Set([...existing, ...selectedIds])]);
          setSelectedFieldId(selectedIds[selectedIds.length - 1] ?? null);
        }

        return null;
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [marqueeSelection, previewSelectedGroup]);

  const handlePresetSelect = (presetKey: LayoutPresetKey) => {
    const nextPreset = getPresetDefinition(presetKey);
    startTransition(() => {
      setSelectedPreset(nextPreset.key);
      setColumnCount(nextPreset.defaultColumnCount);
      setRowSpace(nextPreset.defaultRowSpace);
    });
  };

  const handleGenerateLayout = () => {
    startTransition(() => {
      onUpdateDetailBoard((current: any) => {
        const nextGroups = (Array.isArray(current?.groups) ? current.groups : []).map((group: any) => {
          const columnIds = Array.isArray(group?.columnIds) ? group.columnIds.map(String) : [];
          const nextFlow = buildFlowRows(columnIds, columnCount);

          return {
            ...group,
            columnsPerRow: columnCount,
            ...nextFlow,
          };
        });

        return {
          ...current,
          enabled: true,
          groups: nextGroups,
          sortColumnId: current?.sortColumnId ?? normalizedFields[0]?.id ?? null,
        };
      });
    });
  };

  const handleResetLayout = () => {
    const nextPreset = getPresetDefinition('balanced');
    startTransition(() => {
      setSelectedPreset(nextPreset.key);
      setColumnCount(nextPreset.defaultColumnCount);
      setRowSpace(nextPreset.defaultRowSpace);
      setShowCoordinates(false);
      setCheckedFieldIds([]);
      setSelectedFieldId(null);

      const suggestedGroups = createSuggestedDetailBoardGroups(availableColumns);
      setPendingSelectedGroupId(suggestedGroups[0]?.id ?? null);
      onUpdateDetailBoard((current: any) => ({
        ...current,
        enabled: true,
        groups: suggestedGroups,
        hiddenColumnIds: [],
        sortColumnId: availableColumns[0]?.id ?? current?.sortColumnId ?? null,
      }));
    });
  };

  const handleAddGroup = () => {
    const nextGroup = buildDetailBoardGroup(groups.length + 1, [], {
      name: `信息分组 ${groups.length + 1}`,
    });

    setPendingSelectedGroupId(nextGroup.id);
    onUpdateDetailBoard((current: any) => ({
      ...current,
      enabled: true,
      groups: [...(Array.isArray(current?.groups) ? current.groups : []), nextGroup],
      sortColumnId: current?.sortColumnId ?? normalizedFields[0]?.id ?? null,
    }));
  };

  const handleDeleteGroup = () => {
    if (!selectedGroup) {
      return;
    }

    setPendingSelectedGroupId(null);
    setSelectedFieldId(null);
    setCheckedFieldIds((current) => current.filter((fieldId) => !selectedGroupFieldIds.includes(fieldId)));
    onUpdateDetailBoard((current: any) => ({
      ...current,
      enabled: true,
      hiddenColumnIds: (Array.isArray(current?.hiddenColumnIds) ? current.hiddenColumnIds : [])
        .map(String)
        .filter((fieldId: string) => !selectedGroupFieldIds.includes(fieldId)),
      groups: (Array.isArray(current?.groups) ? current.groups : [])
        .filter((group: any) => group.id !== selectedGroup.id)
        .map((group: any) => {
          const nextColumnIds = (Array.isArray(group?.columnIds) ? group.columnIds.map(String) : [])
            .filter((fieldId: string) => !selectedGroupFieldIds.includes(fieldId));
          const nextColumnsPerRow = Math.max(1, Number(group?.columnsPerRow) || columnCount);

          return {
            ...group,
            columnIds: nextColumnIds,
            columnHeights: Object.fromEntries(
              Object.entries(group?.columnHeights ?? {}).filter(([key]) => nextColumnIds.includes(key)),
            ),
            columnsPerRow: nextColumnsPerRow,
            ...buildFlowRows(nextColumnIds, nextColumnsPerRow),
          };
        }),
    }));
    const remainingGroups = groups.filter((group: any) => group.id !== selectedGroup.id);
    setSelectedGroupId(remainingGroups[0]?.id ?? null);
  };

  const handleAssignFields = (fieldIds: string[]) => {
    if (!selectedGroup || fieldIds.length === 0) {
      return;
    }

    const normalizedIds = [...new Set(fieldIds)];
    setSelectedFieldId(normalizedIds[normalizedIds.length - 1] ?? null);
    setCheckedFieldIds((current) => current.filter((fieldId) => !normalizedIds.includes(fieldId)));

    onUpdateDetailBoard((current: any) => ({
      ...current,
      enabled: true,
      hiddenColumnIds: (Array.isArray(current?.hiddenColumnIds) ? current.hiddenColumnIds : [])
        .map(String)
        .filter((fieldId: string) => !normalizedIds.includes(fieldId)),
      groups: (Array.isArray(current?.groups) ? current.groups : []).map((group: any) => {
        const baseColumnIds = (Array.isArray(group?.columnIds) ? group.columnIds.map(String) : [])
          .filter((columnId: string) => !normalizedIds.includes(columnId));
        const nextColumnIds = group.id === selectedGroup.id
          ? [...new Set([...baseColumnIds, ...normalizedIds])]
          : baseColumnIds;
        const nextColumnsPerRow = Math.max(1, Number(group?.columnsPerRow) || columnCount);

        return {
          ...group,
          columnIds: nextColumnIds,
          columnHeights: Object.fromEntries(
            Object.entries(group?.columnHeights ?? {}).filter(([key]) => nextColumnIds.includes(key)),
          ),
          columnsPerRow: nextColumnsPerRow,
          ...buildFlowRows(nextColumnIds, nextColumnsPerRow),
        };
      }),
    }));
  };

  const handleAssignField = (fieldId: string) => {
    handleAssignFields([fieldId]);
  };

  const handleRemoveFields = (fieldIds: string[]) => {
    if (!selectedGroup || fieldIds.length === 0) {
      return;
    }

    const normalizedIds = [...new Set(fieldIds)];
    const remainingFieldIds = selectedGroupFieldIds.filter((fieldId) => !normalizedIds.includes(fieldId));
    setCheckedFieldIds((current) => current.filter((fieldId) => !normalizedIds.includes(fieldId)));
    setSelectedFieldId((current) => (current && normalizedIds.includes(current) ? (remainingFieldIds[0] ?? null) : current));

    onUpdateDetailBoard((current: any) => ({
      ...current,
      enabled: true,
      hiddenColumnIds: (Array.isArray(current?.hiddenColumnIds) ? current.hiddenColumnIds : [])
        .map(String)
        .filter((fieldId: string) => !normalizedIds.includes(fieldId)),
      groups: (Array.isArray(current?.groups) ? current.groups : []).map((group: any) => {
        const nextColumnIds = (Array.isArray(group?.columnIds) ? group.columnIds.map(String) : [])
          .filter((id: string) => !normalizedIds.includes(id));
        const nextColumnsPerRow = Math.max(1, Number(group?.columnsPerRow) || columnCount);
        return {
          ...group,
          columnIds: nextColumnIds,
          columnHeights: Object.fromEntries(
            Object.entries(group?.columnHeights ?? {}).filter(([key]) => !normalizedIds.includes(key)),
          ),
          columnsPerRow: nextColumnsPerRow,
          ...buildFlowRows(nextColumnIds, nextColumnsPerRow),
        };
      }),
    }));
  };

  const handleRemoveField = (fieldId: string) => {
    handleRemoveFields([fieldId]);
  };

  const handleClearCurrentGroup = () => {
    handleRemoveFields(selectedGroupFieldIds);
  };

  const handleCanvasPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.ctrlKey || event.button !== 0 || !canvasRef.current) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('[data-preview-field="true"]')) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    setMarqueeSelection({
      currentX: clampValue(event.clientX - rect.left, 0, rect.width),
      currentY: clampValue(event.clientY - rect.top, 0, rect.height),
      startX: clampValue(event.clientX - rect.left, 0, rect.width),
      startY: clampValue(event.clientY - rect.top, 0, rect.height),
    });
    event.preventDefault();
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[332px_minmax(0,1fr)_320px] xl:items-start xl:justify-center">
      <aside className="min-w-0">
        <section className="flex max-h-[calc(100vh-164px)] min-h-[600px] flex-col overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(245,248,252,0.95))] shadow-[0_28px_60px_-40px_rgba(15,23,42,0.28)]">
          <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,248,252,0.94))] px-4 pb-4 pt-4">
            <div className="rounded-[22px] border border-slate-200/80 bg-white/92 p-3 shadow-[0_16px_32px_-30px_rgba(15,23,42,0.22)]">
              <div className="flex flex-wrap items-center gap-2">
                {selectedGroup ? (
                  resolveGroupNameValue(selectedGroup.name).length > 0 ? (
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold text-white">
                      {selectedGroup.name}
                    </span>
                  ) : null
                ) : (
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold text-white">
                    未选择分组
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                  已放入 {selectedGroupFields.length}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                  待放入 {unassignedFields.length}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-[16px] border border-slate-200 bg-slate-50/90 px-3 focus-within:border-primary/30 focus-within:bg-white">
                <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
                <input
                  value={fieldSearch}
                  onChange={(event) => setFieldSearch(event.target.value)}
                  placeholder="搜索字段"
                  className="h-10 w-full bg-transparent text-[13px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[16px] border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  新增分组
                </button>
                <button
                  type="button"
                  onClick={handleDeleteGroup}
                  disabled={!selectedGroup}
                  className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-[16px] border px-4 text-[12px] font-semibold transition-colors ${
                    selectedGroup
                      ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  删除当前
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-[22px] border border-slate-200/80 bg-white/92 p-3 shadow-[0_16px_32px_-30px_rgba(15,23,42,0.18)]">
              <div className="space-y-2">
                {groups.length > 0 ? (
                  groups.map((group: any, index: number) => {
                    const isActive = group.id === activeGroupId;
                    const fieldCount = Array.isArray(group?.columnIds) ? group.columnIds.length : 0;

                    return (
                      <div
                        key={group.id}
                        onClick={() => selectGroup(group.id)}
                        className={`flex items-center gap-3 rounded-[18px] border px-3 py-2.5 transition-all ${
                          isActive
                            ? 'border-primary/20 bg-primary/10 shadow-[0_14px_26px_-24px_rgba(37,99,235,0.28)]'
                            : 'border-slate-200/80 bg-slate-50/85 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <span className={`inline-flex size-2.5 shrink-0 rounded-full ${isActive ? 'bg-primary' : 'bg-slate-300'}`} />
                        <input
                          value={resolveGroupNameValue(group?.name, `信息分组 ${index + 1}`)}
                          onFocus={() => selectGroup(group.id)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            selectGroup(group.id);
                            onUpdateDetailBoard((current: any) => ({
                              ...current,
                              enabled: true,
                              groups: (Array.isArray(current?.groups) ? current.groups : []).map((currentGroup: any) => (
                                currentGroup.id === group.id
                                  ? { ...currentGroup, name: event.target.value }
                                  : currentGroup
                              )),
                            }));
                          }}
                          className={`h-8 min-w-0 flex-1 rounded-[12px] border border-transparent bg-transparent px-2 text-[13px] font-semibold outline-none transition-colors ${
                            isActive
                              ? 'text-primary focus:border-primary/20 focus:bg-white/90'
                              : 'text-slate-900 focus:border-slate-200 focus:bg-white'
                          }`}
                        />
                        <div className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                          {fieldCount}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-center text-[12px] text-slate-500">
                    还没有分组
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
            <div className="space-y-4">
              <div className="rounded-[22px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_20px_34px_-32px_rgba(15,23,42,0.22)]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-slate-900">已放入字段</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                      {filteredSelectedGroupFields.length}/{selectedGroupFields.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCheckAll(filteredSelectedGroupFields.map((field) => field.id))}
                      disabled={filteredSelectedGroupFields.length === 0}
                      className={`inline-flex h-7 items-center justify-center rounded-full border px-3 text-[10px] font-semibold transition-colors ${
                        filteredSelectedGroupFields.length > 0
                          ? 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800'
                          : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      }`}
                    >
                      全选
                    </button>
                    {selectedGroupFieldIds.length > 0 ? (
                      <button
                        type="button"
                        onClick={handleClearCurrentGroup}
                        className="inline-flex h-7 items-center justify-center rounded-full border border-rose-200 bg-white px-3 text-[10px] font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                      >
                        清空当前
                      </button>
                    ) : null}
                    {checkedSelectedGroupFieldIds.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveFields(checkedSelectedGroupFieldIds)}
                        className="inline-flex h-7 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 text-[10px] font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                      >
                        删除 {checkedSelectedGroupFieldIds.length}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {filteredSelectedGroupFields.length > 0 ? (
                    filteredSelectedGroupFields.map((field) => (
                      <div key={field.id}>
                        {FieldToken({
                          active: activeFieldId === field.id,
                          checked: checkedFieldIdSet.has(field.id),
                          compact: true,
                          label: field.label,
                          onClick: () => setSelectedFieldId(field.id),
                          onRemove: () => handleRemoveField(field.id),
                          onToggleSelect: () => toggleCheckedField(field.id),
                        })}
                      </div>
                    ))
                  ) : (
                    <div className="w-full rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-center text-[12px] text-slate-500">
                      {selectedGroupFields.length > 0 ? '没有匹配字段' : '这个分组还没有字段'}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_20px_34px_-32px_rgba(15,23,42,0.22)]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-slate-900">待放入字段</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                      {filteredUnassignedFields.length}/{unassignedFields.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCheckAll(filteredUnassignedFields.map((field) => field.id))}
                      disabled={filteredUnassignedFields.length === 0}
                      className={`inline-flex h-7 items-center justify-center rounded-full border px-3 text-[10px] font-semibold transition-colors ${
                        filteredUnassignedFields.length > 0
                          ? 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800'
                          : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      }`}
                    >
                      全选
                    </button>
                    {selectedGroup && checkedUnassignedFieldIds.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleAssignFields(checkedUnassignedFieldIds)}
                        className="inline-flex h-7 items-center justify-center rounded-full border border-primary/20 bg-primary/10 px-3 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/15"
                      >
                        加入 {checkedUnassignedFieldIds.length}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {filteredUnassignedFields.length > 0 ? (
                    filteredUnassignedFields.map((field) => (
                      <div key={field.id}>
                        {FieldToken({
                          checked: checkedFieldIdSet.has(field.id),
                          compact: true,
                          disabled: !selectedGroup,
                          label: field.label,
                          onClick: () => handleAssignField(field.id),
                          onToggleSelect: () => toggleCheckedField(field.id),
                          trailingIcon: 'add',
                        })}
                      </div>
                    ))
                  ) : (
                    <div className="w-full rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-center text-[12px] text-slate-500">
                      {unassignedFields.length > 0 ? '没有匹配字段' : '没有待放入字段'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </aside>

      <section className="w-full rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,252,0.92))] p-5 shadow-[0_32px_68px_-44px_rgba(15,23,42,0.32)]">
        <div className="flex flex-col gap-4">
          <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_20px_36px_-34px_rgba(15,23,42,0.24)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {previewSelectedGroup && resolveGroupNameValue(previewSelectedGroup.name).length > 0 ? (
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold text-white">
                    {previewSelectedGroup.name}
                  </span>
                ) : null}
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                  分组 {previewGroups.length}
                </span>
                {previewSelectedGroup ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    字段 {previewSelectedGroup.fields.length}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {onOpenPreview ? (
                  <button
                    type="button"
                    onClick={onOpenPreview}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                  >
                    <span className="material-symbols-outlined text-[16px]">preview</span>
                    预览
                  </button>
                ) : null}
                <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={showCoordinates}
                    onChange={(event) => setShowCoordinates(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  坐标
                </label>
              </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(180px,0.9fr)_minmax(180px,0.9fr)_auto]">
              <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/88 p-2">
                <div className="grid gap-2 sm:grid-cols-3">
                  {LAYOUT_PRESET_OPTIONS.map((option) => {
                    const isActive = option.key === selectedPreset;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handlePresetSelect(option.key)}
                        className={`rounded-[16px] px-3 py-2.5 text-left text-[12px] font-semibold transition-all ${
                          isActive
                            ? 'bg-slate-950 text-white shadow-[0_16px_28px_-22px_rgba(15,23,42,0.5)]'
                            : 'bg-white text-slate-600 hover:bg-white hover:text-slate-900'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <RangeField
                label="每行列数"
                min={1}
                max={3}
                step={1}
                value={columnCount}
                valueLabel={`${columnCount} 列`}
                onChange={(nextValue) => setColumnCount(nextValue)}
                marks={[
                  { label: '1列', value: 1 },
                  { label: '2列', value: 2 },
                  { label: '3列', value: 3 },
                ]}
              />

              <RangeField
                label="组内间距"
                min={8}
                max={24}
                step={2}
                value={rowSpace}
                valueLabel={`${rowSpace}px`}
                onChange={(nextValue) => setRowSpace(nextValue)}
                marks={[
                  { label: '紧凑', value: 8 },
                  { label: '标准', value: 14 },
                  { label: '舒展', value: 24 },
                ]}
              />

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleGenerateLayout}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-slate-950 px-5 text-[12px] font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
                  一键生成
                </button>
                <button
                  type="button"
                  onClick={handleResetLayout}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] border border-slate-200 bg-white px-5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  推荐布局
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(246,249,252,0.98),rgba(255,255,255,0.98))] p-4">
            <div
              ref={canvasRef}
              className="cloudy-cloud-grid relative mx-auto rounded-[28px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.06),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,255,0.96))] shadow-[0_30px_64px_-48px_rgba(15,23,42,0.36)]"
              onPointerDown={handleCanvasPointerDown}
              style={{ height: canvasHeight, minWidth: STAGE_WIDTH, width: STAGE_WIDTH }}
            >
              {marqueeBounds ? (
                <div
                  className="pointer-events-none absolute z-20 rounded-[16px] border border-primary/40 bg-primary/10"
                  style={{
                    height: marqueeBounds.height,
                    left: marqueeBounds.left,
                    top: marqueeBounds.top,
                    width: marqueeBounds.width,
                  }}
                />
              ) : null}
              {previewGroups.map((group) => {
                const isActive = group.id === activeGroupId;

                return (
                  <section
                    key={group.id}
                    className={`absolute overflow-hidden rounded-[22px] border transition-all ${
                      isActive
                        ? 'border-primary/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(243,248,255,0.97))] ring-2 ring-primary/15 shadow-[0_24px_48px_-34px_rgba(37,99,235,0.3)]'
                        : 'border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(247,250,252,0.97))] shadow-[0_18px_34px_-30px_rgba(15,23,42,0.18)]'
                    }`}
                    onClick={() => selectGroup(group.id)}
                    style={{
                      height: group.height,
                      left: group.x,
                      top: group.y,
                      width: group.width,
                    }}
                  >
                    <div className="flex cursor-pointer items-center justify-between border-b border-slate-200/70 px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex size-2.5 rounded-full ${isActive ? 'bg-primary' : 'bg-slate-300'}`} />
                        <div className="text-[14px] font-semibold text-slate-900">{group.name}</div>
                      </div>
                      <div className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                        {group.fields.length} 项
                      </div>
                    </div>

                    {group.fields.map((field) => (
                      (() => {
                        const isStacked = isStackedFieldPreview(field);
                        const isActiveField = activeFieldId === field.id && isActive;
                        const isCheckedField = isActive && checkedFieldIdSet.has(field.id);
                        const controlHeight = isStacked
                          ? Math.max(52, field.height - 40)
                          : Math.max(40, field.height - 16);

                        return (
                          <div
                            key={field.id}
                            className="absolute"
                            data-preview-field="true"
                            onClick={(event) => {
                              event.stopPropagation();
                              selectGroup(group.id);
                              setSelectedFieldId(field.id);
                            }}
                            style={{
                              height: field.height,
                              left: field.x,
                              top: field.y,
                              width: field.width,
                            }}
                          >
                            <div
                              className={`bill-designer-field relative h-full rounded-[18px] border px-2.5 py-2 transition-all ${
                                isActiveField
                                  ? 'border-primary/20 bg-primary/[0.05] shadow-[0_14px_22px_-20px_rgba(37,99,235,0.35)]'
                                  : isCheckedField
                                    ? 'border-primary/15 bg-primary/[0.03]'
                                    : 'border-transparent bg-transparent'
                              }`}
                            >
                              <div className={`flex h-full min-h-0 ${isStacked ? 'flex-col gap-2' : 'items-center gap-3'}`}>
                                <div className={`${isStacked ? 'min-w-0 text-[12px]' : 'w-[34%] max-w-[118px] min-w-0 text-[13px]'} truncate font-semibold text-slate-700`}>
                                  {field.label}
                                </div>

                                <div
                                  className={`${isStacked ? 'min-h-0 flex-1' : 'min-w-0 flex-1 self-stretch'}`}
                                  style={{ height: isStacked ? undefined : controlHeight }}
                                >
                                  <div style={{ height: controlHeight }}>
                                    {renderControlShell(field)}
                                  </div>
                                </div>
                              </div>

                              {showCoordinates ? (
                                <div className="absolute right-2 top-1 text-[10px] font-medium text-slate-400">
                                  {`${formatPixelValue(group.x + field.x)} / ${formatPixelValue(group.y + field.y)}`}
                                </div>
                              ) : null}

                              {isActiveField ? (
                                <button
                                  type="button"
                                  onPointerDown={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setSelectedFieldId(field.id);
                                    setHeightDragState({
                                      fieldId: field.id,
                                      startHeight: field.height,
                                      startY: event.clientY,
                                    });
                                  }}
                                  className="absolute inset-x-8 bottom-1.5 flex h-4 cursor-row-resize items-center justify-center rounded-full bg-slate-950/6 text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary"
                                  aria-label={`调整 ${field.label} 高度`}
                                >
                                  <span className="material-symbols-outlined text-[14px]">drag_handle</span>
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })()
                    ))}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <aside className="min-w-0">
        <section className="flex max-h-[calc(100vh-164px)] min-h-[600px] flex-col overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(245,248,252,0.95))] shadow-[0_28px_60px_-40px_rgba(15,23,42,0.28)]">
          <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,248,252,0.94))] px-4 pb-4 pt-4">
            <div className="rounded-[22px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_16px_32px_-30px_rgba(15,23,42,0.22)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Control Inspector</div>
              <div className="mt-2 text-[18px] font-semibold text-slate-900">右侧控件设置</div>
              <p className="mt-1 text-[12px] leading-5 text-slate-500">
                点击画布里的控件或左侧字段标签，这里只展示当前控件的样式和高度设置。
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
            {selectedField && selectedFieldPreview ? (
              <div className="space-y-4">
                <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,252,0.94))] p-4 shadow-[0_20px_34px_-32px_rgba(15,23,42,0.22)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">当前控件</div>
                      <div className="mt-2 truncate text-[20px] font-semibold text-slate-900">{selectedField.label}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {selectedGroup ? (
                          resolveGroupNameValue(selectedGroup.name).length > 0 ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                              {selectedGroup.name}
                            </span>
                          ) : null
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            未选择分组
                          </span>
                        )}
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                          {getFieldTypeLabel(selectedField.type)}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                      {selectedFieldHeight}px
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {FIELD_HEIGHT_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handleUpdateFieldHeight(selectedField.id, preset.value)}
                        className={`rounded-[16px] border px-3 py-2.5 text-[12px] font-semibold transition-all ${
                          selectedFieldHeight === preset.value
                            ? 'border-primary/20 bg-primary/10 text-primary shadow-[0_16px_28px_-24px_rgba(37,99,235,0.26)]'
                            : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[22px] border border-slate-200/80 bg-white/94 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[12px] font-semibold text-slate-800">控件预览</div>
                      <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                        {selectedFieldPreviewStacked ? '大块展示' : '标准展示'}
                      </div>
                    </div>

                    <div className="mt-3 rounded-[20px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(247,250,252,0.96))] p-3">
                      <div className={`flex min-h-0 ${selectedFieldPreviewStacked ? 'flex-col gap-2' : 'items-center gap-3'}`}>
                        <div className={`${selectedFieldPreviewStacked ? 'min-w-0 text-[12px]' : 'w-[34%] max-w-[110px] min-w-0 text-[13px]'} truncate font-semibold text-slate-700`}>
                          {selectedField.label}
                        </div>

                        <div
                          className={`${selectedFieldPreviewStacked ? 'min-h-0 flex-1' : 'min-w-0 flex-1 self-stretch'}`}
                          style={{ height: selectedFieldPreviewStacked ? undefined : selectedFieldControlHeight }}
                        >
                          <div style={{ height: selectedFieldControlHeight }}>
                            {renderControlShell(selectedFieldPreview)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <RangeField
                  label="控件高度"
                  min={FIELD_HEIGHT_MIN}
                  max={FIELD_HEIGHT_MAX}
                  step={2}
                  value={selectedFieldHeight}
                  valueLabel={`${selectedFieldHeight}px`}
                  onChange={(nextValue) => handleUpdateFieldHeight(selectedField.id, nextValue)}
                  marks={[
                    { label: `${FIELD_HEIGHT_MIN}`, value: FIELD_HEIGHT_MIN },
                    { label: '标准', value: FIELD_HEIGHT_PRESETS[0]?.value ?? 68 },
                    { label: `${FIELD_HEIGHT_MAX}`, value: FIELD_HEIGHT_MAX },
                  ]}
                />

                <div className="rounded-[22px] border border-dashed border-slate-200/80 bg-slate-50/85 px-4 py-4 text-[12px] leading-6 text-slate-500">
                  备注控件现在和其他控件走同一套展示逻辑，不再单独做特殊排布。右侧只跟随当前选中的控件切换，方便集中调样式和高度。
                </div>
              </div>
            ) : (
              <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 bg-slate-50/70 px-6 text-center text-[13px] leading-6 text-slate-500">
                先点击画布里的控件，右侧再展示当前控件的样式和高度设置。
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
