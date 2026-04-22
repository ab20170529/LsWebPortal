import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Checkbox, Input, InputNumber, Modal, Select, Spin, Table, type TableColumnsType, type TableProps } from 'antd';
import { flushSync } from 'react-dom';
import { DndContext, PointerSensor, closestCenter, pointerWithin, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Resizable, type ResizeCallbackData } from 'react-resizable';
import {
  fetchGridFieldSettingsPreference,
  resetGridFieldSettingsPreference,
  saveGridFieldSettingsPreference,
  type GridFieldSettingsPreferenceScope,
} from '../../../lib/backend-grid-field-settings-preferences';
import {
  fetchBillTypeFieldNameOptions,
  fetchSingleTableFieldNameOptions,
  fetchSingleTableModuleFields,
} from '../../../lib/backend-module-config';
import { fetchDataFormatOptions, fetchFieldSqlTagOptions } from '../../../lib/backend-system';
import {
  shadcnInspectorActionButtonClass,
  shadcnInspectorDangerActionButtonClass,
  shadcnInspectorPrimaryActionButtonClass,
} from '../../../components/ui/shadcn-inspector';
import { cn } from '../../../lib/utils';
import { mapSingleTableFieldRecordToColumn } from './dashboard-single-table-field-mappers';
import { type GridFieldSettingsModalMode } from './grid-field-settings-modal-types';
import {
  DEFAULT_GRID_FIELD_SETTINGS_PREFERENCE,
  normalizeGridFieldSettingsPreference,
  serializeGridFieldSettingsPreference,
  serializeGridFieldSettingsScope,
} from './grid-field-settings-preference-utils';
import {
  createSingleTableMainFieldDraftRow,
  resolveSingleTableMainFieldSettingValue,
  singleTableMainFieldSettings,
  updateSingleTableMainFieldSettingValue,
} from './single-table-main-field-settings-schema';

type SingleTableMainFieldSettingsModalProps = {
  currentModuleCode: string;
  initialFieldId?: string | null;
  isOpen: boolean;
  mode: GridFieldSettingsModalMode;
  onClose: () => void;
  onPreferenceError?: (message: string) => void;
  onSave: (rows: any[]) => Promise<boolean>;
  preferenceScope?: GridFieldSettingsPreferenceScope | null;
  rows: any[];
  tableLabel: string;
};

type FieldSqlTagOption = {
  label: string;
  value: number;
};

type DataFormatOption = {
  label: string;
  value: string;
};

type FieldNameOption = {
  fieldDec?: unknown;
  fieldLen?: unknown;
  label: string;
  value: string;
};

type TextCellEditorState = {
  draft: string;
  draftKey: string;
  multiline: boolean;
  settingKey: string;
  title: string;
} | null;

const FONT_NAME_OPTIONS = [
  '微软雅黑',
  '宋体',
  '黑体',
  '楷体',
  '仿宋',
  'Arial',
  'Tahoma',
  'Verdana',
  'Times New Roman',
];

function toText(value: unknown) {
  return value == null ? '' : String(value);
}

function sortDraftRows(rows: any[]) {
  return [...rows].sort((left, right) => {
    const leftOrder = Number(resolveSingleTableMainFieldSettingValue(left, 'orderid') || 0);
    const rightOrder = Number(resolveSingleTableMainFieldSettingValue(right, 'orderid') || 0);
    return leftOrder - rightOrder;
  });
}

function ensureDraftKey(row: any, index: number) {
  const persistedKey = String(row?.__draftKey ?? row?.id ?? row?.backendId ?? `draft_${Date.now()}_${index + 1}`).trim();
  return {
    ...row,
    __draftKey: persistedKey.length > 0 ? persistedKey : `draft_${Date.now()}_${index + 1}`,
  };
}

function normalizeLookupKey(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function serializeDraftRowsSnapshot(rows: any[]) {
  return JSON.stringify(sortDraftRows(rows).map((row) => {
    const rest = { ...(row ?? {}) };
    delete rest.__draftKey;
    return rest;
  }));
}

function getDraftRowIdentity(row: any, index: number) {
  const backendId = normalizeLookupKey(row?.backendId ?? row?.id);
  if (backendId) {
    return `id:${backendId}`;
  }

  const fieldKey = normalizeLookupKey(row?.backendFieldKey ?? row?.fieldKey ?? row?.fieldkey);
  if (fieldKey) {
    return `fieldKey:${fieldKey}`;
  }

  const fieldName = normalizeLookupKey(row?.fieldname ?? row?.fieldName ?? row?.sourceField);
  if (fieldName) {
    return `fieldName:${fieldName}`;
  }

  return `fallback:${index}`;
}

function matchesRequestedField(row: any, fieldId: string | null | undefined) {
  const normalizedFieldId = normalizeLookupKey(fieldId);
  if (!normalizedFieldId) {
    return false;
  }

  return [
    row?.__draftKey,
    row?.id,
    row?.backendId,
    row?.backendFieldKey,
    row?.fieldKey,
    row?.fieldkey,
    row?.fieldname,
    row?.fieldName,
    row?.sourceField,
  ].some((candidate) => normalizeLookupKey(candidate) === normalizedFieldId);
}

function mergeFreshRowsWithLocalRows(freshRows: any[], localRows: any[]) {
  const localRowMap = new Map<string, any>();

  localRows.forEach((row, index) => {
    localRowMap.set(getDraftRowIdentity(row, index), row);
  });

  const mergedRows = freshRows.map((row, index) => {
    const localRow = localRowMap.get(getDraftRowIdentity(row, index));
    return localRow ? { ...row, __draftKey: localRow.__draftKey ?? row.__draftKey } : row;
  });

  const freshIdentitySet = new Set(freshRows.map((row, index) => getDraftRowIdentity(row, index)));
  const localOnlyRows = localRows.filter((row, index) => !freshIdentitySet.has(getDraftRowIdentity(row, index)));

  return [...mergedRows, ...localOnlyRows];
}

type SingleTableFieldSettingsHeaderCellProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  columnId?: string;
  resizeWidth?: number;
  resizeMinWidth?: number;
  resizeMaxWidth?: number;
  onResizeWidth?: (width: number) => void;
  onResizeStop?: (width: number) => void;
  sortable?: boolean;
};

type SingleTableFieldSettingsHandleContextValue = {
  listeners?: Record<string, unknown>;
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  sortable: boolean;
};

const singleTableFieldSettingsHandleContext = React.createContext<SingleTableFieldSettingsHandleContextValue>({
  sortable: false,
});

function SingleTableFieldSettingsSortableHeaderCell({
  columnId,
  resizeWidth,
  resizeMinWidth,
  resizeMaxWidth,
  onResizeWidth,
  onResizeStop,
  sortable = false,
  style,
  className,
  children,
  ...rest
}: SingleTableFieldSettingsHeaderCellProps) {
  const staticHeaderId = React.useId();
  const {
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: columnId ?? staticHeaderId,
    disabled: !sortable || !columnId,
  });
  const canResize = typeof resizeWidth === 'number'
    && typeof resizeMinWidth === 'number'
    && typeof resizeMaxWidth === 'number'
    && typeof onResizeWidth === 'function'
    && typeof onResizeStop === 'function';
  const [liveResizeWidth, setLiveResizeWidth] = React.useState<number | null>(
    canResize ? Math.max(resizeMinWidth, Math.min(resizeMaxWidth, Math.round(resizeWidth))) : null,
  );
  const [liveResizing, setLiveResizing] = React.useState(false);
  const normalizedWidth = canResize
    ? Math.max(
      resizeMinWidth,
      Math.min(resizeMaxWidth, Math.round((liveResizing ? liveResizeWidth : resizeWidth) ?? resizeWidth)),
    )
    : undefined;
  const contextValue = React.useMemo<SingleTableFieldSettingsHandleContextValue>(() => ({
    listeners: sortable ? listeners : undefined,
    setActivatorNodeRef: sortable ? setActivatorNodeRef : undefined,
    sortable,
  }), [listeners, setActivatorNodeRef, sortable]);

  const headerCellNode = (
    <th
      {...rest}
      ref={sortable ? setNodeRef : undefined}
      style={{
        ...style,
        ...(typeof normalizedWidth === 'number' ? { width: normalizedWidth, minWidth: normalizedWidth } : null),
        position: 'relative',
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 2 : undefined,
      }}
      className={cn(
        className,
        'group single-table-main-field-settings-header-cell',
        sortable && 'select-none',
        isDragging && 'z-[2] shadow-[0_12px_32px_-18px_rgba(15,23,42,0.28)]',
      )}
    >
      {children}
    </th>
  );

  return (
    <singleTableFieldSettingsHandleContext.Provider value={contextValue}>
      {canResize && typeof normalizedWidth === 'number' ? (
        <Resizable
          width={normalizedWidth}
          height={0}
          axis="x"
          resizeHandles={['e']}
          minConstraints={[resizeMinWidth, 0]}
          maxConstraints={[resizeMaxWidth, 0]}
          draggableOpts={{ enableUserSelectHack: false }}
          onResizeStart={() => {
            flushSync(() => {
              setLiveResizing(true);
              setLiveResizeWidth(normalizedWidth);
            });
          }}
          onResize={(_event, data: ResizeCallbackData) => {
            flushSync(() => {
              setLiveResizeWidth(data.size.width);
            });
            onResizeWidth(data.size.width);
          }}
          onResizeStop={(_event, data) => {
            flushSync(() => {
              setLiveResizeWidth(data.size.width);
              setLiveResizing(false);
            });
            onResizeStop(data.size.width);
          }}
          handle={(_axis, ref) => (
            <span
              ref={ref as React.Ref<HTMLSpanElement>}
              role="separator"
              aria-orientation="vertical"
              tabIndex={-1}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              className="react-resizable-handle react-resizable-handle-e dashboard-table-builder-resize-handle dashboard-table-builder-resize-handle-compact absolute bottom-0 right-0 top-0 z-20 flex cursor-col-resize items-center justify-center border-0 bg-transparent p-0 outline-none"
              title="拖动调整列宽"
            >
              <span className="h-5 w-px rounded-full bg-transparent transition-all group-hover:bg-slate-300" />
            </span>
          )}
        >
          {headerCellNode}
        </Resizable>
      ) : headerCellNode}
    </singleTableFieldSettingsHandleContext.Provider>
  );
}

function SingleTableFieldSettingsSortableHandle({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>) {
  const { listeners, setActivatorNodeRef, sortable } = React.useContext(singleTableFieldSettingsHandleContext);

  return (
    <span
      {...rest}
      ref={sortable ? setActivatorNodeRef : undefined}
      {...(sortable ? listeners : {})}
      className={cn(className, sortable && 'cursor-grab touch-none active:cursor-grabbing')}
    >
      {children}
    </span>
  );
}

export const SingleTableMainFieldSettingsModal = React.memo(function SingleTableMainFieldSettingsModal({
  currentModuleCode,
  initialFieldId = null,
  isOpen,
  mode,
  onClose,
  onPreferenceError,
  onSave,
  preferenceScope = null,
  rows,
  tableLabel,
}: SingleTableMainFieldSettingsModalProps) {
  const [draftRows, setDraftRows] = React.useState<any[]>([]);
  const [selectedDraftKeys, setSelectedDraftKeys] = React.useState<React.Key[]>([]);
  const [searchText, setSearchText] = React.useState('');
  const [isLoadingFields, setIsLoadingFields] = React.useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [fieldSqlTagOptions, setFieldSqlTagOptions] = React.useState<FieldSqlTagOption[]>([]);
  const [dataFormatOptions, setDataFormatOptions] = React.useState<DataFormatOption[]>([]);
  const [fieldNameOptions, setFieldNameOptions] = React.useState<FieldNameOption[]>([]);
  const [orderedSettingKeys, setOrderedSettingKeys] = React.useState<string[]>(() => (
    DEFAULT_GRID_FIELD_SETTINGS_PREFERENCE.orderedSettingKeys
  ));
  const [settingColumnWidths, setSettingColumnWidths] = React.useState<Record<string, number>>(() => (
    DEFAULT_GRID_FIELD_SETTINGS_PREFERENCE.columnWidths
  ));
  const [highlightedDraftKey, setHighlightedDraftKey] = React.useState<string | null>(null);
  const [textCellEditor, setTextCellEditor] = React.useState<TextCellEditorState>(null);
  const [preferenceSaveRevision, setPreferenceSaveRevision] = React.useState(0);
  const tableHostRef = React.useRef<HTMLDivElement | null>(null);
  const hasSavedPreferenceRef = React.useRef(false);
  const hasShownPreferenceErrorRef = React.useRef(false);
  const hasLocalPreferenceInteractionRef = React.useRef(false);
  const initialDraftRowsSnapshotRef = React.useRef('[]');
  const lastSavedPreferenceSnapshotRef = React.useRef(
    serializeGridFieldSettingsPreference(DEFAULT_GRID_FIELD_SETTINGS_PREFERENCE),
  );
  const settingColumnDragSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );
  const serializedPreferenceScope = React.useMemo(
    () => serializeGridFieldSettingsScope(preferenceScope),
    [preferenceScope],
  );
  const normalizedLayoutPreference = React.useMemo(() => normalizeGridFieldSettingsPreference({
    columnWidths: settingColumnWidths,
    orderedSettingKeys,
  }), [orderedSettingKeys, settingColumnWidths]);
  const serializedLayoutPreference = React.useMemo(
    () => serializeGridFieldSettingsPreference(normalizedLayoutPreference),
    [normalizedLayoutPreference],
  );
  const serializedDraftRowsSnapshot = React.useMemo(
    () => serializeDraftRowsSnapshot(draftRows),
    [draftRows],
  );
  const hasUnsavedDraftChanges = serializedDraftRowsSnapshot !== initialDraftRowsSnapshotRef.current;

  const reportPreferenceError = React.useCallback((message: string) => {
    if (hasShownPreferenceErrorRef.current) {
      return;
    }

    hasShownPreferenceErrorRef.current = true;
    onPreferenceError?.(message);
  }, [onPreferenceError]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftRows(sortDraftRows(rows.map((row, index) => ensureDraftKey(row, index))));
    initialDraftRowsSnapshotRef.current = serializeDraftRowsSnapshot(
      rows.map((row, index) => ensureDraftKey(row, index)),
    );
    setSelectedDraftKeys([]);
    setSearchText('');
  }, [isOpen, rows]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!mode.startsWith('single-table')) {
      setIsLoadingFields(false);
      return;
    }

    const normalizedModuleCode = currentModuleCode.trim();
    if (!normalizedModuleCode) {
      return;
    }

    let cancelled = false;

    const loadFreshDraftRows = async () => {
      setIsLoadingFields(true);
      try {
        const fetchedRows = await fetchSingleTableModuleFields(normalizedModuleCode);
        if (cancelled) {
          return;
        }

        const freshRows = fetchedRows.map((field, index) => ensureDraftKey(mapSingleTableFieldRecordToColumn(field, index), index));
        const localRows = rows.map((row, index) => ensureDraftKey(row, index));
        const mergedRows = mergeFreshRowsWithLocalRows(freshRows, localRows);
        setDraftRows(sortDraftRows(mergedRows));
        initialDraftRowsSnapshotRef.current = serializeDraftRowsSnapshot(mergedRows);
      } finally {
        if (!cancelled) {
          setIsLoadingFields(false);
        }
      }
    };

    void loadFreshDraftRows();

    return () => {
      cancelled = true;
    };
  }, [currentModuleCode, isOpen, mode, rows]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const loadOptions = async () => {
      const normalizedModuleCode = currentModuleCode.trim();
      const nextFieldNameOptionsPromise = !normalizedModuleCode
        ? Promise.resolve([])
        : mode === 'bill-main'
          ? fetchBillTypeFieldNameOptions(normalizedModuleCode, 'main')
          : mode === 'bill-detail'
            ? fetchBillTypeFieldNameOptions(normalizedModuleCode, 'detail')
            : fetchSingleTableFieldNameOptions(normalizedModuleCode);

      setIsLoadingOptions(true);
      try {
        const [nextFieldSqlTags, nextDataFormats, nextFieldNames] = await Promise.all([
          fetchFieldSqlTagOptions(),
          fetchDataFormatOptions(),
          nextFieldNameOptionsPromise,
        ]);

        if (cancelled) {
          return;
        }

        setFieldSqlTagOptions(
          (nextFieldSqlTags || []).map((item) => ({
            label: toText(item?.showname),
            value: Number(item?.showid ?? 0),
          })),
        );
        setDataFormatOptions(
          (nextDataFormats || []).map((item) => ({
            label: toText(item?.remark) || toText(item?.formatString),
            value: toText(item?.formatString),
          })),
        );
        setFieldNameOptions(
          (nextFieldNames || []).map((item: any) => {
            const fieldName = toText(item?.fieldName);
            const fieldType = toText(item?.fieldType ?? item?.dataType);
            const fieldLen = toText(item?.fieldLen ?? item?.dataSize);
            const fieldDec = toText(item?.fieldDec ?? item?.dataDec);
            const suffix = [fieldType, fieldLen ? `L${fieldLen}` : '', fieldDec ? `D${fieldDec}` : '']
              .filter(Boolean)
              .join(' · ');

            return {
              fieldDec: item?.fieldDec ?? item?.dataDec,
              fieldLen: item?.fieldLen ?? item?.dataSize,
              label: suffix ? `${fieldName} (${suffix})` : fieldName,
              value: fieldName,
            };
          }),
        );
      } finally {
        if (!cancelled) {
          setIsLoadingOptions(false);
        }
      }
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [currentModuleCode, isOpen, mode]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const defaultPreference = normalizeGridFieldSettingsPreference(DEFAULT_GRID_FIELD_SETTINGS_PREFERENCE);
    setOrderedSettingKeys(defaultPreference.orderedSettingKeys);
    setSettingColumnWidths(defaultPreference.columnWidths);
    setPreferenceSaveRevision(0);
    hasSavedPreferenceRef.current = false;
    hasShownPreferenceErrorRef.current = false;
    hasLocalPreferenceInteractionRef.current = false;
    lastSavedPreferenceSnapshotRef.current = serializeGridFieldSettingsPreference(defaultPreference);

    if (!serializedPreferenceScope || !preferenceScope) {
      return;
    }

    let cancelled = false;

    const loadPreference = async () => {
      try {
        const response = await fetchGridFieldSettingsPreference(preferenceScope);
        if (cancelled || hasLocalPreferenceInteractionRef.current) {
          return;
        }

        const nextPreference = normalizeGridFieldSettingsPreference(response.preference);
        setOrderedSettingKeys(nextPreference.orderedSettingKeys);
        setSettingColumnWidths(nextPreference.columnWidths);
        hasSavedPreferenceRef.current = response.hasUserPreference;
        lastSavedPreferenceSnapshotRef.current = serializeGridFieldSettingsPreference(nextPreference);
      } catch {
        if (!cancelled) {
          reportPreferenceError('字段设置列布局偏好加载失败，已回退到默认布局。');
        }
      }
    };

    void loadPreference();

    return () => {
      cancelled = true;
    };
  }, [isOpen, preferenceScope, reportPreferenceError, serializedPreferenceScope]);

  React.useEffect(() => {
    if (!isOpen || preferenceSaveRevision <= 0 || !serializedPreferenceScope || !preferenceScope) {
      return;
    }

    if (serializedLayoutPreference === lastSavedPreferenceSnapshotRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const defaultSnapshot = serializeGridFieldSettingsPreference(DEFAULT_GRID_FIELD_SETTINGS_PREFERENCE);
        if (serializedLayoutPreference === defaultSnapshot) {
          if (hasSavedPreferenceRef.current) {
            const response = await resetGridFieldSettingsPreference(preferenceScope);
            hasSavedPreferenceRef.current = response.hasUserPreference;
          }
          lastSavedPreferenceSnapshotRef.current = defaultSnapshot;
        } else {
          const response = await saveGridFieldSettingsPreference(preferenceScope, normalizedLayoutPreference);
          const nextPreference = normalizeGridFieldSettingsPreference(response.preference ?? normalizedLayoutPreference);
          hasSavedPreferenceRef.current = true;
          lastSavedPreferenceSnapshotRef.current = serializeGridFieldSettingsPreference(nextPreference);
        }

        hasShownPreferenceErrorRef.current = false;
      } catch {
        reportPreferenceError('字段设置列布局偏好保存失败，当前调整仅保留在本次会话。');
      }
    }, 320);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    isOpen,
    normalizedLayoutPreference,
    preferenceSaveRevision,
    preferenceScope,
    reportPreferenceError,
    serializedLayoutPreference,
    serializedPreferenceScope,
  ]);

  React.useEffect(() => {
    if (!isOpen) {
      setHighlightedDraftKey(null);
      return;
    }

    const matchedRow = draftRows.find((row) => matchesRequestedField(row, initialFieldId)) ?? null;
    const nextDraftKey = matchedRow?.__draftKey ? String(matchedRow.__draftKey) : null;
    setHighlightedDraftKey(nextDraftKey);

    if (!nextDraftKey) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const tableHost = tableHostRef.current;
      if (!tableHost) {
        return;
      }

      const targetRow = Array.from(
        tableHost.querySelectorAll('tr[data-row-key]'),
      ).find((rowElement) => (
        (rowElement as HTMLTableRowElement).getAttribute('data-row-key') === nextDraftKey
      )) as HTMLTableRowElement | undefined;

      if (!targetRow) {
        return;
      }

      targetRow.scrollIntoView({
        block: 'center',
        inline: 'nearest',
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [draftRows, initialFieldId, isOpen]);

  const orderedSettingDefinitions = React.useMemo(() => {
    const definitionLookup = new Map(singleTableMainFieldSettings.map((definition) => [definition.key, definition]));
    const orderedDefinitions = orderedSettingKeys
      .map((key) => definitionLookup.get(key))
      .filter((definition): definition is typeof singleTableMainFieldSettings[number] => Boolean(definition));
    const missingDefinitions = singleTableMainFieldSettings.filter((definition) => !orderedSettingKeys.includes(definition.key));
    return [...orderedDefinitions, ...missingDefinitions];
  }, [orderedSettingKeys]);

  const handleSettingColumnDragEnd = React.useCallback((event: DragEndEvent) => {
    if (!event.over) {
      return;
    }

    const activeId = String(event.active.id);
    const overId = String(event.over.id);

    if (!activeId || !overId || activeId === overId) {
      return;
    }

    setOrderedSettingKeys((prev) => {
      const activeIndex = prev.indexOf(activeId);
      const overIndex = prev.indexOf(overId);
      if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
        return prev;
      }

      return arrayMove(prev, activeIndex, overIndex);
    });
    hasLocalPreferenceInteractionRef.current = true;
    setPreferenceSaveRevision((prev) => prev + 1);
  }, []);

  const filteredRows = React.useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase();
    const sortedRows = sortDraftRows(draftRows);

    if (!normalizedSearchText) {
      return sortedRows;
    }

    return sortedRows.filter((row) => {
      const values = [
        resolveSingleTableMainFieldSettingValue(row, 'fieldname'),
        resolveSingleTableMainFieldSettingValue(row, 'sysname'),
        resolveSingleTableMainFieldSettingValue(row, 'username1'),
        resolveSingleTableMainFieldSettingValue(row, 'fieldsqlid'),
      ];
      return values.some((value) => toText(value).toLowerCase().includes(normalizedSearchText));
    });
  }, [draftRows, searchText]);

  const missingFieldNameCount = React.useMemo(
    () => draftRows.filter((row) => !toText(resolveSingleTableMainFieldSettingValue(row, 'fieldname')).trim()).length,
    [draftRows],
  );

  const updateRow = React.useCallback((draftKey: string, updater: (row: any) => any) => {
    setDraftRows((prev) => prev.map((row) => (
      row.__draftKey === draftKey ? ensureDraftKey(updater(row), 0) : row
    )));
  }, []);

  const handleAddRow = React.useCallback(() => {
    setDraftRows((prev) => {
      const nextOrderId = sortDraftRows(prev).length + 1;
      return [...prev, createSingleTableMainFieldDraftRow(currentModuleCode.trim(), nextOrderId)];
    });
  }, [currentModuleCode]);

  const handleDeleteSelectedRows = React.useCallback(() => {
    if (selectedDraftKeys.length === 0) {
      return;
    }

    setDraftRows((prev) => prev.filter((row) => !selectedDraftKeys.includes(row.__draftKey)));
    setSelectedDraftKeys([]);
  }, [selectedDraftKeys]);

  const handleSave = React.useCallback(async () => {
    if (isSaving || missingFieldNameCount > 0) {
      return false;
    }

    setIsSaving(true);
    try {
      const normalizedRows = sortDraftRows(draftRows).map((row, index) => ({
        ...row,
        orderid: Number(resolveSingleTableMainFieldSettingValue(row, 'orderid') || index + 1),
        orderId: Number(resolveSingleTableMainFieldSettingValue(row, 'orderid') || index + 1),
      }));
      const saved = await onSave(normalizedRows);
      if (saved) {
        initialDraftRowsSnapshotRef.current = serializeDraftRowsSnapshot(normalizedRows);
        onClose();
      }
      return saved;
    } finally {
      setIsSaving(false);
    }
  }, [draftRows, isSaving, missingFieldNameCount, onClose, onSave]);

  const handleMaskClose = React.useCallback(() => {
    if (isSaving) {
      return;
    }

    if (!hasUnsavedDraftChanges) {
      onClose();
      return;
    }

    Modal.confirm({
      cancelText: '继续编辑',
      centered: true,
      content: '当前有未保存的字段配置，是否先保存再关闭？',
      okText: '保存并关闭',
      onOk: async () => {
        const saved = await handleSave();
        if (!saved) {
          throw new Error('field-settings-save-cancelled');
        }
      },
      title: '未保存内容',
    });
  }, [handleSave, hasUnsavedDraftChanges, isSaving, onClose]);

  const handleOpenTextCellEditor = React.useCallback((
    record: any,
    definition: typeof singleTableMainFieldSettings[number],
    multiline: boolean,
  ) => {
    setTextCellEditor({
      draft: toText(resolveSingleTableMainFieldSettingValue(record, definition.key)),
      draftKey: String(record.__draftKey),
      multiline,
      settingKey: definition.key,
      title: definition.title,
    });
  }, []);

  const handleSaveTextCellEditor = React.useCallback(() => {
    if (!textCellEditor) {
      return;
    }

    updateRow(
      textCellEditor.draftKey,
      (currentRow) => updateSingleTableMainFieldSettingValue(
        currentRow,
        textCellEditor.settingKey,
        textCellEditor.draft,
      ),
    );
    setTextCellEditor(null);
  }, [textCellEditor, updateRow]);

  const tableColumns = React.useMemo<TableColumnsType<any>>(() => {
    const renderCellShell = (content: React.ReactNode, align: 'center' | 'left' = 'left') => (
      <div className={`single-table-main-field-settings-cell-content ${align === 'center' ? 'is-center' : ''}`}>
        {content}
      </div>
    );
    const renderTextCellTrigger = (
      value: unknown,
      definition: typeof singleTableMainFieldSettings[number],
      record: any,
      options: { multiline?: boolean; readOnly?: boolean } = {},
    ) => {
      const displayText = toText(value).trim();
      const isReadOnly = options.readOnly === true;
      const isPlaceholder = !displayText && !isReadOnly;
      const triggerNode = (
        <span className={cn(
          'single-table-main-field-settings-text-trigger-label',
          isPlaceholder && 'is-placeholder',
        )}>
          {displayText || (isReadOnly ? '-' : '点击编辑内容')}
        </span>
      );

      if (isReadOnly) {
        return renderCellShell(
          <span
            className="single-table-main-field-settings-text-trigger is-readonly"
            title={displayText || '-'}
          >
            {triggerNode}
          </span>,
        );
      }

      return renderCellShell(
        <button
          type="button"
          className="single-table-main-field-settings-text-trigger"
          title={displayText || definition.title}
          onClick={() => handleOpenTextCellEditor(record, definition, options.multiline === true)}
        >
          {triggerNode}
          <span className="material-symbols-outlined text-[14px] text-slate-400">edit_note</span>
        </button>,
      );
    };

    const renderEditor = (definition: typeof singleTableMainFieldSettings[number], record: any) => {
      const currentValue = resolveSingleTableMainFieldSettingValue(record, definition.key);
      const handleValueChange = (nextValue: unknown, extraOptions?: Record<string, unknown>) => {
        updateRow(
          record.__draftKey,
          (currentRow) => updateSingleTableMainFieldSettingValue(currentRow, definition.key, nextValue, {
            auxiliaryLabel: toText(extraOptions?.auxiliaryLabel),
            fieldDec: extraOptions?.fieldDec,
            fieldLen: extraOptions?.fieldLen,
          }),
        );
      };

      if (definition.readOnly && definition.editor !== 'checkbox') {
        return renderTextCellTrigger(currentValue, definition, record, { readOnly: true });
      }

      switch (definition.editor) {
        case 'number':
          return renderCellShell(
            <InputNumber
              size="small"
              value={currentValue === '' || currentValue == null ? undefined : Number(currentValue)}
              onChange={(value) => handleValueChange(value)}
              className="single-table-main-field-settings-editor w-full"
            />,
          );
        case 'textarea':
          return renderTextCellTrigger(currentValue, definition, record, { multiline: true });
        case 'checkbox':
          return renderCellShell(
            <div className="flex justify-center">
              <Checkbox
                checked={Boolean(currentValue)}
                disabled={definition.readOnly}
                onChange={(event) => handleValueChange(event.target.checked)}
              />
            </div>,
            'center',
          );
        case 'text':
          return renderTextCellTrigger(currentValue, definition, record);
        case 'field-name-select':
          return renderCellShell(
            <Select
              allowClear
              showSearch
              size="small"
              className="single-table-main-field-settings-editor"
              value={toText(currentValue) || undefined}
              options={fieldNameOptions}
              optionFilterProp="label"
              placeholder="选择字段"
              onChange={(value, option) => {
                const resolvedOption = Array.isArray(option) ? option[0] : option;
                handleValueChange(value, {
                  fieldDec: resolvedOption?.fieldDec,
                  fieldLen: resolvedOption?.fieldLen,
                });
              }}
            />,
          );
        case 'field-sql-tag-select':
          return renderCellShell(
            <Select
              showSearch
              size="small"
              className="single-table-main-field-settings-editor"
              value={currentValue == null || currentValue === '' ? undefined : Number(currentValue)}
              options={fieldSqlTagOptions}
              optionFilterProp="label"
              placeholder="选择来源"
              onChange={(value, option) => {
                const resolvedOption = Array.isArray(option) ? option[0] : option;
                handleValueChange(value, {
                  auxiliaryLabel: resolvedOption?.label,
                });
              }}
            />,
          );
        case 'data-format-select':
          return renderCellShell(
            <Select
              allowClear
              showSearch
              size="small"
              className="single-table-main-field-settings-editor"
              value={toText(currentValue) || undefined}
              options={dataFormatOptions}
              optionFilterProp="label"
              placeholder="选择格式"
              onChange={(value) => handleValueChange(value)}
            />,
          );
        case 'font-select':
          return renderCellShell(
            <Select
              allowClear
              showSearch
              size="small"
              className="single-table-main-field-settings-editor"
              value={toText(currentValue) || undefined}
              options={FONT_NAME_OPTIONS.map((fontName) => ({ label: fontName, value: fontName }))}
              optionFilterProp="label"
              placeholder="选择字体"
              onChange={(value) => handleValueChange(value)}
            />,
          );
        default:
          return renderCellShell(
            <Input
              size="small"
              className="single-table-main-field-settings-editor"
              value={toText(currentValue)}
              onChange={(event) => handleValueChange(event.target.value)}
            />,
          );
      }
    };

    return [
      ...orderedSettingDefinitions.map((definition) => ({
        dataIndex: definition.key,
        key: definition.key,
        render: (_value: unknown, record: any) => renderEditor(definition, record),
        title: (
          <span className="single-table-main-field-settings-column-title" title="拖动标题调整列顺序">
            <SingleTableFieldSettingsSortableHandle className="inline-flex min-w-0 items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-slate-400">drag_indicator</span>
              <span className="truncate">{definition.title}</span>
            </SingleTableFieldSettingsSortableHandle>
          </span>
        ),
        width: settingColumnWidths[definition.key] ?? definition.width,
        onHeaderCell: () => ({
          columnId: definition.key,
          sortable: true,
          resizeWidth: settingColumnWidths[definition.key] ?? definition.width,
          resizeMinWidth: Math.max(72, Math.round(definition.width * 0.6)),
          resizeMaxWidth: Math.max(180, Math.round((settingColumnWidths[definition.key] ?? definition.width) * 2.8)),
          onResizeWidth: (width: number) => {
            setSettingColumnWidths((prev) => ({
              ...prev,
              [definition.key]: Math.round(width),
            }));
          },
          onResizeStop: (width: number) => {
            setSettingColumnWidths((prev) => ({
              ...prev,
              [definition.key]: Math.round(width),
            }));
            hasLocalPreferenceInteractionRef.current = true;
            setPreferenceSaveRevision((prev) => prev + 1);
          },
        }),
      })),
    ];
  }, [dataFormatOptions, fieldNameOptions, fieldSqlTagOptions, handleOpenTextCellEditor, orderedSettingDefinitions, settingColumnWidths, updateRow]);

  const rowSelection = React.useMemo<NonNullable<TableProps<any>['rowSelection']>>(() => ({
    selectedRowKeys: selectedDraftKeys,
    onChange: (nextSelectedRowKeys) => {
      setSelectedDraftKeys(nextSelectedRowKeys);
    },
  }), [selectedDraftKeys]);
  const tableComponents = React.useMemo(() => ({
    header: {
      cell: SingleTableFieldSettingsSortableHeaderCell,
    },
  }), []);
  const tableScrollX = React.useMemo(() => (
    orderedSettingDefinitions.reduce((sum, definition) => sum + (settingColumnWidths[definition.key] ?? definition.width), 48)
  ), [orderedSettingDefinitions, settingColumnWidths]);
  const modalTitle = React.useMemo(() => {
    switch (mode) {
      case 'single-table-detail':
        return '明细表字段详细设置';
      case 'bill-main':
        return '单据主表字段详细设置';
      case 'bill-detail':
        return '单据明细字段详细设置';
      case 'single-table-main':
      default:
        return '主表字段详细设置';
    }
  }, [mode]);
  const modalSubtitle = React.useMemo(() => {
    const resolvedTableLabel = tableLabel.trim() || '当前表';
    return `当前正在编辑 ${resolvedTableLabel} 的全部字段配置`;
  }, [tableLabel]);

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleMaskClose}
        className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/26 px-4 py-5 backdrop-blur-md sm:px-6 sm:py-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.985 }}
          transition={{ duration: 0.2 }}
          onClick={(event) => event.stopPropagation()}
          style={{
            width: 'min(1680px, calc(100vw - 32px))',
            height: 'min(920px, calc(100dvh - 40px))',
          }}
          className="flex flex-col overflow-hidden rounded-t-[18px] rounded-b-[10px] border border-white/70 bg-white/96 shadow-[0_40px_120px_-42px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-950/96"
        >
          <div className="border-b border-slate-200/90 bg-white/92 px-6 py-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/92">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl border border-white/70 bg-white/82 text-[color:var(--workspace-accent)] shadow-[0_16px_28px_-24px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-slate-900/58">
                    <span className="material-symbols-outlined text-[18px]">table_view</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[18px] font-bold tracking-[-0.02em] text-slate-900 dark:text-white">{modalTitle}</div>
                    <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-300">{modalSubtitle}</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={`${shadcnInspectorActionButtonClass} h-9 px-4 text-[12px]`}
                  onClick={handleAddRow}
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  新增字段
                </button>
                <button
                  type="button"
                  className={`${shadcnInspectorDangerActionButtonClass} h-9 px-4 text-[12px] disabled:cursor-not-allowed disabled:opacity-50`}
                  onClick={handleDeleteSelectedRows}
                  disabled={isSaving || selectedDraftKeys.length === 0}
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  删除选中{selectedDraftKeys.length > 0 ? ` (${selectedDraftKeys.length})` : ''}
                </button>
                <button
                  type="button"
                  className={`${shadcnInspectorActionButtonClass} h-9 px-4 text-[12px] disabled:cursor-not-allowed disabled:opacity-50`}
                  onClick={handleMaskClose}
                  disabled={isSaving}
                >
                  关闭
                </button>
                <button
                  type="button"
                  className={`${shadcnInspectorPrimaryActionButtonClass} h-9 px-4 text-[12px] disabled:cursor-not-allowed disabled:opacity-50`}
                  onClick={handleSave}
                  disabled={isSaving || missingFieldNameCount > 0}
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200/85 bg-[linear-gradient(180deg,rgba(248,251,255,0.96)_0%,rgba(245,249,255,0.92)_100%)] px-6 py-3 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="w-full max-w-[360px] sm:w-[360px]">
              <Input
                allowClear
                className="single-table-main-field-settings-search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="搜索字段、出厂名称、用户名"
                prefix={<span className="material-symbols-outlined text-[16px]">search</span>}
              />
            </div>
          </div>

          <div ref={tableHostRef} className="min-h-0 flex-1 overflow-hidden">
            <Spin
              spinning={isLoadingFields || isLoadingOptions}
              className="block h-full [&_.ant-spin-container]:flex [&_.ant-spin-container]:h-full [&_.ant-spin-container]:min-h-0 [&_.ant-spin-container]:flex-col"
            >
              <DndContext
                sensors={settingColumnDragSensors}
                collisionDetection={(args) => {
                  const pointerCollisions = pointerWithin(args);
                  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
                }}
                onDragEnd={handleSettingColumnDragEnd}
              >
                <SortableContext items={orderedSettingDefinitions.map((definition) => definition.key)} strategy={horizontalListSortingStrategy}>
                  <Table
                    components={tableComponents}
                    className="single-table-main-field-settings-modal-table dashboard-table-builder-ant-table min-h-0 h-full"
                    style={{ height: '100%' }}
                    rowKey="__draftKey"
                    size="small"
                    columns={tableColumns}
                    dataSource={filteredRows}
                    rowSelection={rowSelection}
                    rowClassName={(record) => (
                      record.__draftKey === highlightedDraftKey
                        ? 'single-table-main-field-settings-row-highlighted'
                        : ''
                    )}
                    pagination={false}
                    scroll={{ x: tableScrollX, y: 'calc(100dvh - 190px)' }}
                  />
                </SortableContext>
              </DndContext>
            </Spin>
          </div>

          <AnimatePresence>
            {textCellEditor ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(event) => {
                  event.stopPropagation();
                  setTextCellEditor(null);
                }}
                className="fixed inset-0 z-[96] flex items-center justify-center bg-slate-950/24 px-6 py-8 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 14, scale: 0.985 }}
                  transition={{ duration: 0.18 }}
                  onClick={(event) => event.stopPropagation()}
                  className="flex w-full max-w-3xl flex-col overflow-hidden rounded-[18px] border border-white/80 bg-white/96 shadow-[0_30px_72px_-34px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-950/96"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200/85 px-5 py-4 dark:border-slate-700">
                    <div className="min-w-0">
                      <div className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{textCellEditor.title}</div>
                      <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-300">编辑完成后保存，会直接回写当前字段设置。</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTextCellEditor(null)}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-2xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                  <div className="px-5 py-4">
                    {textCellEditor.multiline ? (
                      <Input.TextArea
                        autoFocus
                        rows={14}
                        value={textCellEditor.draft}
                        onChange={(event) => setTextCellEditor((prev) => (prev ? { ...prev, draft: event.target.value } : prev))}
                        className="single-table-main-field-settings-text-modal-textarea"
                      />
                    ) : (
                      <Input
                        autoFocus
                        value={textCellEditor.draft}
                        onChange={(event) => setTextCellEditor((prev) => (prev ? { ...prev, draft: event.target.value } : prev))}
                        className="single-table-main-field-settings-text-modal-input"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-3 border-t border-slate-200/85 px-5 py-4 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setTextCellEditor(null)}
                      className={`${shadcnInspectorActionButtonClass} h-10 px-4 text-[12px]`}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTextCellEditor}
                      className={`${shadcnInspectorPrimaryActionButtonClass} h-10 px-4 text-[12px]`}
                    >
                      保存内容
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
