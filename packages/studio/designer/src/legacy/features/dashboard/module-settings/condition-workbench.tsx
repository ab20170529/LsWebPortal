import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Filter, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { getCompactWorkbenchItemClass } from '../designer/control-item-classes';
import {
  createRuntimeClassName,
  createRuntimeDeclarationBlock,
  joinRuntimeDeclarationBlocks,
} from '../designer/runtime-dimension-rules';
import {
  resolveWorkbenchPreviewWidth,
  updateItemWidthById,
  type ActiveWorkbenchResize,
  type WorkbenchResizeMode,
} from '../resize/use-workbench-resize-state';

export type ConditionWorkbenchScope = 'main' | 'left';

type ConditionWorkbenchDragData =
  | {
    type: 'condition-item';
    scope: ConditionWorkbenchScope;
    row: number;
    fieldId: string;
  }
  | {
    type: 'condition-row';
    scope: ConditionWorkbenchScope;
    row: number;
  };

export type DocumentConditionWorkbenchConfig = {
  fields: any[];
  selectedId: string | null;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  setFields: React.Dispatch<React.SetStateAction<any[]>>;
  scope: ConditionWorkbenchScope;
  rowCount: number;
  onActivate: (id: string | null) => void;
  onAdd: () => void;
  onDelete: () => void;
};

type ConditionWorkbenchHelpers = {
  buildResizeSnapCandidates: (
    widths: number[],
    options: {
      minWidth: number;
      maxWidth: number;
      baseWidth: number;
    },
  ) => number[];
  clampValue: (value: number, min: number, max: number) => number;
  resolveResizeWidthWithSnap: (
    rawWidth: number,
    options: {
      minWidth: number;
      maxWidth: number;
      snapCandidates: number[];
      snapThreshold?: number;
    },
  ) => {
    width: number;
    snappedTo: number | null;
  };
};

type ConditionWorkbenchMetrics = {
  controlWidth: number;
  maxRows: number;
  maxWidth: number;
  minRows: number;
  minWidth: number;
  rowGap: number;
  rowHeight: number;
};

type ConditionWorkbenchResizeApi = {
  activeResize: ActiveWorkbenchResize | null;
  autoFitColumnWidth: (
    event: React.MouseEvent,
    colId: string,
    cols: any[],
    setCols: React.Dispatch<React.SetStateAction<any[]>>,
    minWidth?: number,
    maxWidth?: number,
    mode?: WorkbenchResizeMode,
  ) => void;
  clearResizePreview: (target?: { id: string; mode: WorkbenchResizeMode }) => void;
  scheduleResizePreview: (nextResize: ActiveWorkbenchResize) => void;
  setActiveResize: React.Dispatch<React.SetStateAction<ActiveWorkbenchResize | null>>;
};

export type DocumentConditionWorkbenchProps = {
  activeScope: ConditionWorkbenchScope;
  canSwitchScope: boolean;
  mainConfig: DocumentConditionWorkbenchConfig;
  leftConfig?: DocumentConditionWorkbenchConfig | null;
  onScopeSwitch: (scope: ConditionWorkbenchScope) => void;
  onActivatePanel: (scope: ConditionWorkbenchScope) => void;
  onClearBuilderSelectionContextMenu: () => void;
  renderFieldPreview: (rawField: any, rowIndex: number, mode?: 'table' | 'filter' | 'condition') => React.ReactNode;
  resize: ConditionWorkbenchResizeApi;
  helpers: ConditionWorkbenchHelpers;
  metrics: ConditionWorkbenchMetrics;
};

const CONDITION_SCOPE_OPTIONS: readonly ConditionWorkbenchScope[] = ['main', 'left'];

function getConditionDragItemId(scope: ConditionWorkbenchScope, fieldId: string) {
  return `condition-item:${scope}:${fieldId}`;
}

function getConditionDropItemId(scope: ConditionWorkbenchScope, fieldId: string) {
  return `condition-drop:${scope}:${fieldId}`;
}

function getConditionRowDropId(scope: ConditionWorkbenchScope, row: number) {
  return `condition-row:${scope}:${row}`;
}

function isConditionWorkbenchDragData(value: unknown): value is ConditionWorkbenchDragData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'type' in value && 'scope' in value && 'row' in value;
}

function normalizeConditionWorkbenchField(field: any, metrics: ConditionWorkbenchMetrics) {
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
      metrics.maxWidth,
      Math.max(
        metrics.minWidth,
        Number.isFinite(Number(field?.width)) ? Number(field.width) : metrics.controlWidth,
      ),
    ),
    panelRow: Math.min(
      metrics.maxRows,
      Math.max(
        metrics.minRows,
        Number.isFinite(Number(field?.panelRow)) ? Number(field.panelRow) : metrics.minRows,
      ),
    ),
  };
}

function buildConditionWorkbenchRuntimeRules(
  fields: any[],
  rowCount: number,
  scope: ConditionWorkbenchScope,
  activeResizeState: ActiveWorkbenchResize | null,
  metrics: ConditionWorkbenchMetrics,
) {
  const conditionWorkbenchHeight = rowCount * metrics.rowHeight
    + Math.max(0, rowCount - 1) * metrics.rowGap;
  const conditionWorkbenchHeightClass = createRuntimeClassName('condition-workbench-height', scope);

  return joinRuntimeDeclarationBlocks([
    createRuntimeDeclarationBlock(conditionWorkbenchHeightClass, { 'min-height': conditionWorkbenchHeight }),
    ...fields.flatMap((field) => {
      const rawConditionWidth = resolveWorkbenchPreviewWidth(
        field.width,
        metrics.controlWidth,
        metrics.minWidth,
        activeResizeState,
        field.id,
        'filter',
      );
      const labelWidth = Math.max(60, Math.min(132, String(field?.name ?? '').length * 14 + 10));
      const sharedPreviewWidthFloor = 120;
      const compactPreviewWidthFloor = 104;
      const basePreviewWidth = field.type === '数字'
        ? compactPreviewWidthFloor
        : sharedPreviewWidthFloor;
      const conditionChromeWidth = 18;
      const minimumConditionWidth = labelWidth + basePreviewWidth + conditionChromeWidth;
      const conditionWidth = Math.max(
        minimumConditionWidth,
        Math.min(metrics.maxWidth, Math.max(minimumConditionWidth, rawConditionWidth)),
      );
      const previewWidth = Math.max(basePreviewWidth, conditionWidth - labelWidth - conditionChromeWidth);
      const widthClassName = createRuntimeClassName('condition-item-width', field.id);
      const labelClassName = createRuntimeClassName('condition-item-label', field.id);
      const previewClassName = createRuntimeClassName('condition-item-preview', field.id);

      return [
        createRuntimeDeclarationBlock(widthClassName, { width: conditionWidth, 'min-width': conditionWidth }),
        createRuntimeDeclarationBlock(labelClassName, { width: labelWidth, 'min-width': labelWidth }),
        createRuntimeDeclarationBlock(previewClassName, { width: previewWidth, 'min-width': previewWidth }),
      ];
    }),
  ]);
}

class ConditionWorkbenchPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: React.PointerEvent<Element>) => {
        if (!nativeEvent.isPrimary || nativeEvent.button !== 0) {
          return false;
        }

        const target = nativeEvent.target;
        return !(target instanceof HTMLElement && target.closest('[data-condition-resize-handle="true"]'));
      },
    },
  ];
}

type ConditionWorkbenchDropLaneProps = {
  children: React.ReactNode;
  className: string;
  key?: React.Key;
  row: number;
  scope: ConditionWorkbenchScope;
};

function ConditionWorkbenchDropLane({
  children,
  className,
  row,
  scope,
}: ConditionWorkbenchDropLaneProps): React.JSX.Element {
  const { setNodeRef } = useDroppable({
    id: getConditionRowDropId(scope, row),
    data: {
      type: 'condition-row',
      scope,
      row,
    } satisfies ConditionWorkbenchDragData,
  });

  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
}

type ConditionWorkbenchDraggableItemProps = {
  children: React.ReactNode;
  className: string;
  fieldId: string;
  key?: React.Key;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  row: number;
  scope: ConditionWorkbenchScope;
};

function ConditionWorkbenchDraggableItem({
  children,
  className,
  fieldId,
  onClick,
  onKeyDown,
  row,
  scope,
}: ConditionWorkbenchDraggableItemProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef: setDragNodeRef, transform } = useDraggable({
    id: getConditionDragItemId(scope, fieldId),
    data: {
      type: 'condition-item',
      scope,
      row,
      fieldId,
    } satisfies ConditionWorkbenchDragData,
  });
  const { setNodeRef: setDropNodeRef } = useDroppable({
    id: getConditionDropItemId(scope, fieldId),
    data: {
      type: 'condition-item',
      scope,
      row,
      fieldId,
    } satisfies ConditionWorkbenchDragData,
  });
  const setNodeRef = (node: HTMLDivElement | null) => {
    setDragNodeRef(node);
    setDropNodeRef(node);
  };
  const dragStyle = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      data-condition-item-id={fieldId}
      role="button"
      tabIndex={0}
      className={className}
      style={dragStyle}
      onClick={onClick}
      onKeyDown={onKeyDown}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export const MemoDocumentConditionWorkbench = React.memo(function DocumentConditionWorkbench({
  activeScope,
  canSwitchScope,
  mainConfig,
  leftConfig,
  onScopeSwitch,
  onActivatePanel,
  onClearBuilderSelectionContextMenu,
  renderFieldPreview,
  resize,
  helpers,
  metrics,
}: DocumentConditionWorkbenchProps) {
  const currentConfig = activeScope === 'left' && leftConfig ? leftConfig : mainConfig;
  const currentScope = currentConfig.scope;
  const currentScopeLabel = currentScope === 'left' ? '左条件' : '主条件';
  const conditionWorkbenchSensors = useSensors(
    useSensor(ConditionWorkbenchPointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );
  const [conditionWorkbenchDrag, setConditionWorkbenchDrag] = useState<{
    scope: ConditionWorkbenchScope;
    fieldId: string;
  } | null>(null);
  const [conditionWorkbenchDropTarget, setConditionWorkbenchDropTarget] = useState<{
    row: number;
    beforeId: string | null;
  } | null>(null);
  const conditionWorkbenchDropTargetRef = useRef<{ row: number; beforeId: string | null } | null>(null);
  const conditionWorkbenchDropTargetFrameRef = useRef<number | null>(null);

  const currentConditionFields = useMemo(
    () => currentConfig.fields.map((field) => normalizeConditionWorkbenchField(field, metrics)),
    [currentConfig.fields, metrics],
  );
  const selectedConditionIds = useMemo(
    () => new Set(currentConfig.selectedIds),
    [currentConfig.selectedIds],
  );
  const conditionFieldIndexMap = useMemo(
    () => new Map(currentConditionFields.map((field, index) => [field.id, index])),
    [currentConditionFields],
  );
  const conditionRowNumbers = useMemo(
    () => Array.from({ length: currentConfig.rowCount }, (_, index) => index + 1),
    [currentConfig.rowCount],
  );
  const conditionFieldsByRow = useMemo(() => {
    const grouped = new Map<number, typeof currentConditionFields>();

    currentConditionFields.forEach((field) => {
      const rowNumber = helpers.clampValue(
        Number.isFinite(Number(field?.panelRow)) ? Number(field.panelRow) : metrics.minRows,
        metrics.minRows,
        currentConfig.rowCount,
      );
      const rowFields = grouped.get(rowNumber) ?? [];
      rowFields.push(field);
      grouped.set(rowNumber, rowFields);
    });

    return grouped;
  }, [currentConditionFields, currentConfig.rowCount, helpers, metrics.minRows]);
  const conditionWorkbenchHeightClass = createRuntimeClassName('condition-workbench-height', currentScope);
  const conditionRuntimeRules = useMemo(
    () => buildConditionWorkbenchRuntimeRules(
      currentConditionFields,
      currentConfig.rowCount,
      currentScope,
      resize.activeResize,
      metrics,
    ),
    [currentConditionFields, currentConfig.rowCount, currentScope, metrics, resize.activeResize],
  );

  const clearConditionWorkbenchDragState = useCallback(() => {
    if (conditionWorkbenchDropTargetFrameRef.current !== null) {
      window.cancelAnimationFrame(conditionWorkbenchDropTargetFrameRef.current);
      conditionWorkbenchDropTargetFrameRef.current = null;
    }
    conditionWorkbenchDropTargetRef.current = null;
    setConditionWorkbenchDrag(null);
    setConditionWorkbenchDropTarget(null);
  }, []);

  useEffect(() => {
    conditionWorkbenchDropTargetRef.current = conditionWorkbenchDropTarget;
  }, [conditionWorkbenchDropTarget]);

  useEffect(() => () => {
    if (conditionWorkbenchDropTargetFrameRef.current !== null) {
      window.cancelAnimationFrame(conditionWorkbenchDropTargetFrameRef.current);
      conditionWorkbenchDropTargetFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      clearConditionWorkbenchDragState();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [clearConditionWorkbenchDragState, currentScope]);

  const updateConditionWorkbenchDropTarget = useCallback((nextTarget: { row: number; beforeId: string | null } | null) => {
    const currentTarget = conditionWorkbenchDropTargetRef.current;
    if (
      currentTarget?.row === nextTarget?.row
      && currentTarget?.beforeId === nextTarget?.beforeId
    ) {
      return;
    }

    conditionWorkbenchDropTargetRef.current = nextTarget;
    if (conditionWorkbenchDropTargetFrameRef.current !== null) {
      return;
    }

    conditionWorkbenchDropTargetFrameRef.current = window.requestAnimationFrame(() => {
      conditionWorkbenchDropTargetFrameRef.current = null;
      setConditionWorkbenchDropTarget((prev) => {
        const latestTarget = conditionWorkbenchDropTargetRef.current;
        if (
          prev?.row === latestTarget?.row
          && prev?.beforeId === latestTarget?.beforeId
        ) {
          return prev;
        }
        return latestTarget;
      });
    });
  }, []);

  const getConditionResizeCandidates = useCallback((fieldId: string) => helpers.buildResizeSnapCandidates(
    currentConditionFields
      .filter((field) => field.id !== fieldId)
      .map((field) => Number(field.width) || metrics.controlWidth),
    {
      minWidth: metrics.minWidth,
      maxWidth: metrics.maxWidth,
      baseWidth: metrics.controlWidth,
    },
  ), [currentConditionFields, helpers, metrics.controlWidth, metrics.maxWidth, metrics.minWidth]);

  const handleConditionCardSelect = useCallback((fieldId: string, event?: React.MouseEvent | React.KeyboardEvent) => {
    const allowMulti = Boolean(event && ('ctrlKey' in event) && (event.ctrlKey || event.metaKey));

    onClearBuilderSelectionContextMenu();
    if (allowMulti) {
      currentConfig.setSelectedIds((prev) => (
        prev.includes(fieldId) ? prev.filter((item) => item !== fieldId) : [...prev, fieldId]
      ));
    } else {
      currentConfig.setSelectedIds([fieldId]);
    }

    currentConfig.onActivate(fieldId);
  }, [currentConfig, onClearBuilderSelectionContextMenu]);

  const handlePanelKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onActivatePanel(currentScope);
  }, [currentScope, onActivatePanel]);

  const startConditionResize = useCallback((event: React.MouseEvent<HTMLDivElement>, fieldId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const targetIndex = currentConfig.fields.findIndex((item: any) => item.id === fieldId);
    if (targetIndex === -1) return;

    const targetField = normalizeConditionWorkbenchField(currentConfig.fields[targetIndex], metrics);
    const startX = event.pageX;
    const startWidth = targetField.width || metrics.controlWidth;
    const resizeLabel = targetField.name || '未命名字段';
    const snapCandidates = getConditionResizeCandidates(fieldId);
    let latestWidth = startWidth;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    resize.setActiveResize({ id: fieldId, label: resizeLabel, width: startWidth, mode: 'filter' });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const { width } = helpers.resolveResizeWidthWithSnap(startWidth + (moveEvent.pageX - startX), {
        minWidth: metrics.minWidth,
        maxWidth: metrics.maxWidth,
        snapCandidates,
      });
      latestWidth = width;
      resize.scheduleResizePreview({ id: fieldId, label: resizeLabel, width: latestWidth, mode: 'filter' });
    };

    const handleMouseUp = () => {
      resize.clearResizePreview({ id: fieldId, mode: 'filter' });
      currentConfig.setFields((prev: any[]) => updateItemWidthById(prev, fieldId, latestWidth));
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentConfig, getConditionResizeCandidates, helpers, metrics, resize]);

  const moveConditionField = useCallback((fieldId: string, rowNumber: number, beforeId: string | null = null) => {
    currentConfig.setFields((prev: any[]) => {
      const sourceIndex = prev.findIndex((item) => item.id === fieldId);
      if (sourceIndex === -1) return prev;
      if (beforeId && beforeId === fieldId) return prev;
      const nextRow = helpers.clampValue(rowNumber, metrics.minRows, currentConfig.rowCount);
      const currentField = {
        ...normalizeConditionWorkbenchField(prev[sourceIndex], metrics),
        panelRow: nextRow,
      };
      const remaining = prev.filter((_, index) => index !== sourceIndex);

      let insertIndex = beforeId ? remaining.findIndex((item) => item.id === beforeId) : -1;
      if (insertIndex === -1) {
        insertIndex = remaining.findIndex((item) => (
          helpers.clampValue(
            Number.isFinite(Number(item?.panelRow)) ? Number(item.panelRow) : metrics.minRows,
            metrics.minRows,
            currentConfig.rowCount,
          ) > nextRow
        ));
        if (insertIndex === -1) {
          insertIndex = remaining.length;
        }
      }

      return [
        ...remaining.slice(0, insertIndex),
        currentField,
        ...remaining.slice(insertIndex),
      ];
    });
  }, [currentConfig, helpers, metrics]);

  const handleConditionWorkbenchDragStart = useCallback((event: DragStartEvent) => {
    const activeData = event.active.data.current;
    if (!isConditionWorkbenchDragData(activeData) || activeData.type !== 'condition-item' || activeData.scope !== currentScope) {
      return;
    }

    setConditionWorkbenchDrag({ scope: activeData.scope, fieldId: activeData.fieldId });
    conditionWorkbenchDropTargetRef.current = null;
    if (conditionWorkbenchDropTargetFrameRef.current !== null) {
      window.cancelAnimationFrame(conditionWorkbenchDropTargetFrameRef.current);
      conditionWorkbenchDropTargetFrameRef.current = null;
    }
    setConditionWorkbenchDropTarget(null);
  }, [currentScope]);

  const handleConditionWorkbenchDragOver = useCallback((event: DragOverEvent) => {
    const activeData = event.active.data.current;
    const overData = event.over?.data.current;
    if (!isConditionWorkbenchDragData(activeData) || activeData.type !== 'condition-item' || activeData.scope !== currentScope) {
      return;
    }

    if (!isConditionWorkbenchDragData(overData) || overData.scope !== currentScope) {
      updateConditionWorkbenchDropTarget(null);
      return;
    }

    if (overData.type === 'condition-item') {
      if (!('fieldId' in overData) || overData.fieldId === activeData.fieldId) {
        updateConditionWorkbenchDropTarget(null);
        return;
      }

      updateConditionWorkbenchDropTarget({ row: overData.row, beforeId: overData.fieldId });
      return;
    }

    updateConditionWorkbenchDropTarget({ row: overData.row, beforeId: null });
  }, [currentScope, updateConditionWorkbenchDropTarget]);

  const handleConditionWorkbenchDragEnd = useCallback((event: DragEndEvent) => {
    const activeData = event.active.data.current;
    const overData = event.over?.data.current;
    if (!isConditionWorkbenchDragData(activeData) || activeData.type !== 'condition-item' || activeData.scope !== currentScope) {
      clearConditionWorkbenchDragState();
      return;
    }

    if (!isConditionWorkbenchDragData(overData) || overData.scope !== currentScope) {
      clearConditionWorkbenchDragState();
      return;
    }

    if (overData.type === 'condition-item') {
      if ('fieldId' in overData && overData.fieldId !== activeData.fieldId) {
        moveConditionField(activeData.fieldId, overData.row, overData.fieldId);
      }
      clearConditionWorkbenchDragState();
      return;
    }

    moveConditionField(activeData.fieldId, overData.row);
    clearConditionWorkbenchDragState();
  }, [clearConditionWorkbenchDragState, currentScope, moveConditionField]);

  const getConditionItemRuntimeClasses = useCallback((fieldId: string) => ({
    widthClassName: createRuntimeClassName('condition-item-width', fieldId),
    labelClassName: createRuntimeClassName('condition-item-label', fieldId),
    previewClassName: createRuntimeClassName('condition-item-preview', fieldId),
  }), []);

  const getConditionItemClassName = useCallback((
    fieldId: string,
    options: {
      dragging?: boolean;
      insertTarget?: boolean;
      overlay?: boolean;
      selected?: boolean;
    } = {},
  ) => {
    const { widthClassName } = getConditionItemRuntimeClasses(fieldId);

    return cn(
      widthClassName,
      'h-[44px] gap-1 pr-3.5',
      getCompactWorkbenchItemClass(options),
      options.overlay && 'cursor-grabbing',
    );
  }, [getConditionItemRuntimeClasses]);

  const renderConditionItemContent = useCallback((
    field: any,
    fieldIndex: number,
    options: {
      insertTarget?: boolean;
      selected?: boolean;
      showResizeHandle?: boolean;
    } = {},
  ) => {
    const { labelClassName, previewClassName } = getConditionItemRuntimeClasses(field.id);
    const isSelected = options.selected || options.insertTarget;

    return (
      <>
        {options.insertTarget ? (
          <span className="pointer-events-none absolute inset-y-1 left-0 w-[3px] rounded-full bg-primary" />
        ) : null}
        <div
          className={cn(
            labelClassName,
            'pointer-events-none shrink-0 text-left text-[11px] font-medium text-foreground',
          )}
          title={field.name}
        >
          <span className="block truncate">{field.name}</span>
        </div>
        <div
          className={cn(
            previewClassName,
            'pointer-events-none min-w-0 shrink-0',
            isSelected && '[&>div]:border-border/60 [&>div]:bg-background [&>div]:shadow-none',
          )}
        >
          {renderFieldPreview(field, fieldIndex, 'condition')}
        </div>
        {options.showResizeHandle !== false ? (
          <div
            data-condition-resize-handle="true"
            className="absolute inset-y-0 right-0 flex w-2 cursor-col-resize items-stretch justify-end"
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => {
              event.stopPropagation();
              startConditionResize(event, field.id);
            }}
            onDoubleClick={(event) => resize.autoFitColumnWidth(
              event,
              field.id,
              currentConfig.fields,
              currentConfig.setFields,
              metrics.controlWidth,
              metrics.maxWidth,
              'filter',
            )}
            title="拖动调整条件宽度，双击可自动适配"
          >
            <span className="h-full w-px bg-border/80 transition-colors group-hover:bg-primary" />
          </div>
        ) : null}
      </>
    );
  }, [
    currentConfig.fields,
    currentConfig.setFields,
    getConditionItemRuntimeClasses,
    metrics.controlWidth,
    metrics.maxWidth,
    renderFieldPreview,
    resize,
    startConditionResize,
  ]);

  return (
    <div className="shrink-0 px-1 pb-2">
      <div className="px-1 py-1">
        {conditionRuntimeRules ? <style>{conditionRuntimeRules}</style> : null}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onActivatePanel(currentScope)}
          onKeyDown={handlePanelKeyDown}
          className="space-y-2 outline-none"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5 rounded-xl border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground">
                <Filter className="size-3.5 text-primary" />
                顶部条件
              </Badge>
              <span className="text-[11px] font-medium text-muted-foreground">
                {currentScopeLabel} · {currentConditionFields.length} 项
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
              {canSwitchScope ? (
                <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/75 p-1">
                  {CONDITION_SCOPE_OPTIONS.map((scope) => {
                    const isActiveScope = activeScope === scope;
                    return (
                      <Button
                        key={`condition-scope-${scope}`}
                        size="sm"
                        variant={isActiveScope ? 'secondary' : 'ghost'}
                        className={cn(
                          'h-7 rounded-lg px-2.5 text-[11px] font-medium',
                          isActiveScope
                            ? 'bg-primary text-white hover:bg-primary/90 hover:text-white'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                        onClick={() => onScopeSwitch(scope)}
                      >
                        {scope === 'left' ? '左条件' : '主条件'}
                      </Button>
                    );
                  })}
                </div>
              ) : null}
              <Button
                size="sm"
                className="h-8 gap-1.5 rounded-xl bg-primary px-3 text-white shadow-none hover:bg-primary/90 hover:text-white"
                onClick={(event) => {
                  event.stopPropagation();
                  currentConfig.onAdd();
                }}
              >
                <Plus className="size-4" />
                条件
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 rounded-xl border-border/60 bg-background/80 px-3"
                onClick={(event) => {
                  event.stopPropagation();
                  currentConfig.onDelete();
                }}
                disabled={currentConfig.selectedIds.length === 0}
              >
                <Trash2 className="size-4" />
                删除
              </Button>
            </div>
          </div>

          <div className="overflow-auto">
            <DndContext
              sensors={conditionWorkbenchSensors}
              onDragStart={handleConditionWorkbenchDragStart}
              onDragOver={handleConditionWorkbenchDragOver}
              onDragEnd={handleConditionWorkbenchDragEnd}
              onDragCancel={clearConditionWorkbenchDragState}
            >
              <div className={cn(conditionWorkbenchHeightClass, 'flex flex-col gap-1')}>
                {conditionRowNumbers.map((rowNumber) => {
                  const rowFields = conditionFieldsByRow.get(rowNumber) ?? [];
                  const isDropTarget = conditionWorkbenchDrag?.scope === currentScope
                    && conditionWorkbenchDropTarget?.row === rowNumber
                    && conditionWorkbenchDropTarget.beforeId === null;

                  return (
                    <ConditionWorkbenchDropLane
                      key={`condition-row-${rowNumber}`}
                      scope={currentScope}
                      row={rowNumber}
                      className={cn(
                        'scrollbar-none flex min-h-[48px] items-center overflow-visible rounded-lg border border-transparent bg-transparent px-0.5 py-1 transition-colors',
                        isDropTarget && 'border-primary/20 bg-primary/5',
                        rowFields.length === 0 && 'border-dashed border-border/30 bg-transparent text-muted-foreground',
                      )}
                    >
                      <div className="flex min-w-full items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-1">
                          {rowFields.length > 0 ? rowFields.map((field, index) => {
                            const isActive = currentConfig.selectedId === field.id;
                            const isMarked = selectedConditionIds.has(field.id);
                            const fieldIndex = conditionFieldIndexMap.get(field.id) ?? index;
                            const isDragging = conditionWorkbenchDrag?.scope === currentScope
                              && conditionWorkbenchDrag.fieldId === field.id;
                            const isInsertTarget = conditionWorkbenchDrag?.scope === currentScope
                              && conditionWorkbenchDrag.fieldId !== field.id
                              && conditionWorkbenchDropTarget?.row === rowNumber
                              && conditionWorkbenchDropTarget.beforeId === field.id;
                            const isSelected = isActive || isMarked || isInsertTarget;

                            return (
                              <ConditionWorkbenchDraggableItem
                                key={field.id}
                                scope={currentScope}
                                row={rowNumber}
                                fieldId={field.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleConditionCardSelect(field.id, event);
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleConditionCardSelect(field.id, event);
                                  }
                                }}
                                className={getConditionItemClassName(field.id, {
                                  dragging: isDragging,
                                  insertTarget: isInsertTarget,
                                  selected: isSelected,
                                })}
                              >
                                {renderConditionItemContent(field, fieldIndex, {
                                  insertTarget: isInsertTarget,
                                  selected: isSelected,
                                })}
                              </ConditionWorkbenchDraggableItem>
                            );
                          }) : (
                            <div className="text-[11px] font-medium text-muted-foreground">
                              拖入本行
                            </div>
                          )}
                        </div>
                      </div>
                    </ConditionWorkbenchDropLane>
                  );
                })}
              </div>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
});
