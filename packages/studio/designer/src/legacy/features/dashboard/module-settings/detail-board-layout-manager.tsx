import React from 'react';
import { DndContext } from '@dnd-kit/core';
import {
  shadcnFieldClass,
  shadcnMutedLabelClass,
} from '../../../components/ui/shadcn-inspector';
import {
  designerWorkbenchRowActiveClass,
  designerWorkbenchRowEmptyClass,
  getCompactWorkbenchItemClass,
} from '../designer/control-item-classes';
import {
  DETAIL_BOARD_GROUP_MAX_ROWS,
  DETAIL_BOARD_GROUP_MIN_ROWS,
  getDetailBoardDragItemId,
  getDetailBoardDropItemId,
  getDetailBoardGroupColumnRow,
  getDetailBoardGroupRows,
  getDetailBoardRowDropId,
} from './detail-board-config';
import { cn } from '../../../lib/utils';

type DesignerWorkbenchDropLaneProps = {
  children: React.ReactNode;
  className: string;
  data: Record<string, unknown>;
  dropId: string;
};

type DesignerWorkbenchDraggableItemProps = {
  children: React.ReactNode;
  className: string;
  data: Record<string, unknown>;
  dragId: string;
  dropId: string;
  itemAttributes?: Record<string, string>;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
};

type DetailBoardTheme = {
  groupLabel: string;
  groupShell: string;
};

type DetailBoardResizeState = {
  groupId: string;
  label: string;
  width: number;
} | null;

type DetailBoardWorkbenchDragState = {
  groupId: string;
  columnId: string;
} | null;

type DetailBoardWorkbenchDropTargetState = {
  beforeId: string | null;
  groupId: string;
  row: number;
} | null;

type DetailBoardLayoutManagerProps = {
  DesignerWorkbenchDraggableItem: React.ComponentType<DesignerWorkbenchDraggableItemProps>;
  DesignerWorkbenchDropLane: React.ComponentType<DesignerWorkbenchDropLaneProps>;
  activeDetailBoardResize: DetailBoardResizeState;
  availableGridColumns: Record<string, any>[];
  availableUnassignedDetailColumns: Record<string, any>[];
  designerWorkbenchSensors: any;
  detailBoardClipboardIds: string[];
  detailBoardFieldDefaultWidth: number;
  detailBoardReady: boolean;
  detailBoardTheme: DetailBoardTheme;
  detailBoardWorkbenchDrag: DetailBoardWorkbenchDragState;
  detailBoardWorkbenchDropTarget: DetailBoardWorkbenchDropTargetState;
  emptyFieldsNode: React.ReactNode;
  groups: Record<string, any>[];
  normalizeColumn: (column: Record<string, any>) => Record<string, any>;
  onAddDetailGroup: () => void;
  onApplySuggestedDetailLayout: () => void;
  onClearDetailBoardWorkbenchDragState: () => void;
  onClearDetailGroups: () => void;
  onDeleteSelectedDetailGroup: () => void;
  onHandleDetailGroupPaste: (event: React.ClipboardEvent<HTMLDivElement>, groupId: string) => void;
  onHandleDetailGroupWorkbenchDragEnd: (event: any) => void;
  onHandleDetailGroupWorkbenchDragOver: (event: any) => void;
  onHandleDetailGroupWorkbenchDragStart: (event: any) => void;
  onMergeDetailGroupColumns: (groupId: string, columnIds: string[]) => void;
  onOpenDetailBoardPreview: (rowId: number) => void;
  onRemoveDetailGroupColumn: (groupId: string, columnId: string) => void;
  onResetDetailBoardFieldWidth: (event: React.MouseEvent<HTMLDivElement>, groupId: string, columnId: string) => void;
  onSelectDetailGroup: (groupId: string) => void;
  onStartDetailBoardFieldResize: (event: React.MouseEvent<HTMLDivElement>, groupId: string, columnId: string, label: string) => void;
  onUpdateSelectedDetailGroupName: (name: string) => void;
  onUpdateSelectedDetailGroupRows: (rows: number) => void;
  renderFieldPreview: (column: Record<string, any>, index: number, scope: string) => React.ReactNode;
  selectedDetailGroup: Record<string, any> | null;
  selectedDetailGroupRowNumbers: number[];
  selectedDetailGroupRows: number;
};

function resolveDetailBoardFieldWidth(group: Record<string, any>, columnId: string, fallbackWidth: number) {
  const configuredWidth = Number(group.columnWidths?.[columnId]);
  return Math.round(configuredWidth > 0 ? configuredWidth : fallbackWidth);
}

function resolveDetailBoardLabelWidth(columnName: string) {
  return Math.max(54, Math.min(82, columnName.length * 12));
}

export const DetailBoardLayoutManager = React.memo(function DetailBoardLayoutManager({
  DesignerWorkbenchDraggableItem,
  DesignerWorkbenchDropLane,
  activeDetailBoardResize,
  availableGridColumns,
  availableUnassignedDetailColumns,
  designerWorkbenchSensors,
  detailBoardClipboardIds,
  detailBoardFieldDefaultWidth,
  detailBoardReady,
  detailBoardTheme,
  detailBoardWorkbenchDrag,
  detailBoardWorkbenchDropTarget,
  emptyFieldsNode,
  groups,
  normalizeColumn,
  onAddDetailGroup,
  onApplySuggestedDetailLayout,
  onClearDetailBoardWorkbenchDragState,
  onClearDetailGroups,
  onDeleteSelectedDetailGroup,
  onHandleDetailGroupPaste,
  onHandleDetailGroupWorkbenchDragEnd,
  onHandleDetailGroupWorkbenchDragOver,
  onHandleDetailGroupWorkbenchDragStart,
  onMergeDetailGroupColumns,
  onOpenDetailBoardPreview,
  onRemoveDetailGroupColumn,
  onResetDetailBoardFieldWidth,
  onSelectDetailGroup,
  onStartDetailBoardFieldResize,
  onUpdateSelectedDetailGroupName,
  onUpdateSelectedDetailGroupRows,
  renderFieldPreview,
  selectedDetailGroup,
  selectedDetailGroupRowNumbers,
  selectedDetailGroupRows,
}: DetailBoardLayoutManagerProps) {
  if (availableGridColumns.length === 0) {
    return <>{emptyFieldsNode}</>;
  }

  if (!detailBoardReady) {
    return (
      <div className="rounded-[20px] border border-dashed border-[color:var(--workspace-accent-border-strong)] bg-[color:var(--workspace-accent-tint)] px-5 py-10 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-[color:var(--workspace-accent)] shadow-[0_18px_30px_-24px_rgba(15,23,42,0.16)]">
          <span className="material-symbols-outlined text-[22px]">view_stream</span>
        </div>
        <div className="mt-4 text-[13px] font-bold text-slate-700 dark:text-slate-100">当前还没有详情分组</div>
        <button
          type="button"
          onClick={onAddDetailGroup}
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-[14px] border border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent)] px-3 text-[12px] font-bold text-white transition-colors hover:bg-[color:var(--workspace-accent-strong)]"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          创建第一个分组
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-[18px] border border-slate-200/75 bg-white/94 p-3.5 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-slate-900/55">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-slate-100">
          <span className="material-symbols-outlined text-[17px] text-[color:var(--workspace-accent)]">view_stream</span>
          <h4>详情分组布局</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddDetailGroup}
            className="inline-flex h-9 items-center gap-1.5 rounded-[14px] border border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent)] px-3 text-[12px] font-bold text-white transition-colors hover:bg-[color:var(--workspace-accent-strong)]"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            新增分组
          </button>
          <button
            type="button"
            onClick={onClearDetailGroups}
            className="inline-flex h-9 items-center gap-1.5 rounded-[14px] border border-slate-200/80 bg-white px-3 text-[12px] font-bold text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <span className="material-symbols-outlined text-[16px]">layers_clear</span>
            清空分组
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid gap-2">
          {groups.map((group, groupIndex) => {
            const isSelectedGroup = selectedDetailGroup?.id === group.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => onSelectDetailGroup(group.id)}
                className={`flex w-full items-start justify-between gap-3 rounded-[18px] border px-3.5 py-3 text-left transition-all ${
                  isSelectedGroup
                    ? 'border-[color:var(--workspace-accent-border-strong)] bg-[color:var(--workspace-accent-surface)] shadow-[0_18px_30px_-24px_var(--workspace-accent-shadow)]'
                    : 'border-slate-200/80 bg-white/90 hover:border-[color:var(--workspace-accent-border)] dark:border-slate-700 dark:bg-slate-950/55'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-slate-700 dark:text-slate-100">
                    {group.name || `分组 ${groupIndex + 1}`}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    {group.columnIds.length} 项 · {getDetailBoardGroupRows(group)} 行
                  </div>
                </div>
                {isSelectedGroup ? <span className="material-symbols-outlined text-[16px] text-[color:var(--workspace-accent)]">check_circle</span> : null}
              </button>
            );
          })}
        </div>

        {selectedDetailGroup ? (
          <div className="space-y-3">
            <div className={`relative rounded-[20px] border px-4 py-4 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.16)] ${detailBoardTheme.groupShell}`}>
              {activeDetailBoardResize?.groupId === selectedDetailGroup.id ? (
                <div className="pointer-events-none absolute right-4 top-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--workspace-accent-border)] bg-white/96 px-3 py-1 text-[11px] font-bold text-[color:var(--workspace-accent)] shadow-[0_16px_28px_-24px_var(--workspace-accent-shadow)] dark:bg-slate-950/92">
                  <span className="material-symbols-outlined text-[13px]">straighten</span>
                  <span className="max-w-[120px] truncate">{activeDetailBoardResize.label}</span>
                  <span className="rounded-full bg-[color:var(--workspace-accent-soft)] px-2 py-0.5">
                    {Math.round(activeDetailBoardResize.width)}px
                  </span>
                </div>
              ) : null}
              <div className="space-y-3">
                <div className="grid gap-3 [grid-template-columns:minmax(0,1fr)_108px]">
                  <div>
                    <label className={shadcnMutedLabelClass}>分组名称</label>
                    <input
                      type="text"
                      value={selectedDetailGroup.name}
                      onChange={(event) => onUpdateSelectedDetailGroupName(event.target.value)}
                      placeholder="例如：业务信息 / 审核信息"
                      className={shadcnFieldClass}
                    />
                  </div>
                  <div>
                    <label className={shadcnMutedLabelClass}>控件行数</label>
                    <input
                      type="number"
                      min={DETAIL_BOARD_GROUP_MIN_ROWS}
                      max={DETAIL_BOARD_GROUP_MAX_ROWS}
                      value={selectedDetailGroupRows}
                      onChange={(event) => {
                        const nextRows = Math.max(
                          DETAIL_BOARD_GROUP_MIN_ROWS,
                          Math.min(DETAIL_BOARD_GROUP_MAX_ROWS, Number(event.target.value) || DETAIL_BOARD_GROUP_MIN_ROWS),
                        );
                        onUpdateSelectedDetailGroupRows(nextRows);
                      }}
                      className={shadcnFieldClass}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onMergeDetailGroupColumns(selectedDetailGroup.id, detailBoardClipboardIds)}
                    disabled={detailBoardClipboardIds.length === 0}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-[14px] px-3.5 text-[12px] font-bold transition-colors ${
                      detailBoardClipboardIds.length > 0
                        ? 'border border-[color:var(--workspace-accent-border)] bg-white text-[color:var(--workspace-accent)] hover:bg-[color:var(--workspace-accent-soft)]'
                        : 'cursor-not-allowed border border-slate-200/80 bg-slate-100 text-slate-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">content_paste</span>
                    粘贴字段
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteSelectedDetailGroup}
                    className="inline-flex h-10 items-center gap-1.5 rounded-[14px] border border-rose-200 bg-white px-3.5 text-[12px] font-bold text-rose-500 transition-colors hover:bg-rose-50 dark:border-rose-500/20 dark:bg-slate-950/70 dark:hover:bg-rose-500/10"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    删除分组
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <section
                onPaste={(event) => onHandleDetailGroupPaste(event, selectedDetailGroup.id)}
                className={`rounded-[20px] border px-4 py-4 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.16)] ${detailBoardTheme.groupShell}`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-slate-100">
                    <span className="material-symbols-outlined text-[16px] text-[color:var(--workspace-accent)]">dashboard_customize</span>
                    分组字段排布
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${detailBoardTheme.groupLabel}`}>
                    {selectedDetailGroup.columnIds.length} 项
                  </span>
                </div>
                <DndContext
                  sensors={designerWorkbenchSensors}
                  onDragStart={onHandleDetailGroupWorkbenchDragStart}
                  onDragOver={onHandleDetailGroupWorkbenchDragOver}
                  onDragEnd={onHandleDetailGroupWorkbenchDragEnd}
                  onDragCancel={onClearDetailBoardWorkbenchDragState}
                >
                  <div className="space-y-2.5">
                    {selectedDetailGroupRowNumbers.map((rowNumber) => {
                      const rowColumns = selectedDetailGroup.columnIds
                        .filter((columnId: string) => getDetailBoardGroupColumnRow(selectedDetailGroup, columnId) === rowNumber)
                        .map((columnId: string) => availableGridColumns.find((column) => column.id === columnId))
                        .filter(Boolean);
                      const draggedDetailColumn = detailBoardWorkbenchDrag?.groupId === selectedDetailGroup.id
                        ? availableGridColumns.find((column) => column.id === detailBoardWorkbenchDrag.columnId) ?? null
                        : null;
                      const isRowDropTarget = detailBoardWorkbenchDrag?.groupId === selectedDetailGroup.id
                        && detailBoardWorkbenchDropTarget?.groupId === selectedDetailGroup.id
                        && detailBoardWorkbenchDropTarget?.row === rowNumber
                        && detailBoardWorkbenchDropTarget?.beforeId === null;

                      return (
                        <div key={`${selectedDetailGroup.id}-row-${rowNumber}`} className="space-y-1.5">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                            <span>第 {rowNumber} 行</span>
                            <span className="h-px flex-1 bg-slate-200/80 dark:bg-slate-700/70" />
                          </div>
                          <DesignerWorkbenchDropLane
                            dropId={getDetailBoardRowDropId(selectedDetailGroup.id, rowNumber)}
                            data={{
                              type: 'detail-board-row',
                              groupId: selectedDetailGroup.id,
                              row: rowNumber,
                            }}
                            className={cn(
                              'scrollbar-none flex min-h-[48px] items-center overflow-visible rounded-lg border border-transparent bg-transparent px-0.5 py-1 transition-colors',
                              isRowDropTarget && designerWorkbenchRowActiveClass,
                              rowColumns.length === 0 && designerWorkbenchRowEmptyClass,
                            )}
                          >
                            <div className="flex min-w-full items-center">
                              <div className="flex min-w-0 flex-1 items-center gap-1">
                                {rowColumns.length > 0 ? rowColumns.map((column, columnIndex) => {
                                  const normalizedColumn = normalizeColumn(column);
                                  const fieldWidth = resolveDetailBoardFieldWidth(
                                    selectedDetailGroup,
                                    column.id,
                                    detailBoardFieldDefaultWidth,
                                  );
                                  const labelWidth = resolveDetailBoardLabelWidth(normalizedColumn.name);
                                  const isInsertTarget = detailBoardWorkbenchDrag?.groupId === selectedDetailGroup.id
                                    && detailBoardWorkbenchDrag.columnId !== column.id
                                    && detailBoardWorkbenchDropTarget?.groupId === selectedDetailGroup.id
                                    && detailBoardWorkbenchDropTarget?.row === rowNumber
                                    && detailBoardWorkbenchDropTarget?.beforeId === column.id;

                                  return (
                                    <DesignerWorkbenchDraggableItem
                                      key={column.id}
                                      dragId={getDetailBoardDragItemId(selectedDetailGroup.id, column.id)}
                                      dropId={getDetailBoardDropItemId(selectedDetailGroup.id, column.id)}
                                      data={{
                                        type: 'detail-board-item',
                                        fieldId: column.id,
                                        groupId: selectedDetailGroup.id,
                                        row: rowNumber,
                                      }}
                                      itemAttributes={{
                                        'data-detail-field-item': 'true',
                                      }}
                                      onKeyDown={(event) => {
                                        if (event.key === 'Delete' || event.key === 'Backspace') {
                                          event.preventDefault();
                                          onRemoveDetailGroupColumn(selectedDetailGroup.id, column.id);
                                        }
                                      }}
                                      style={{ width: fieldWidth, minWidth: fieldWidth }}
                                      className={cn(
                                        getCompactWorkbenchItemClass({
                                          dragging: detailBoardWorkbenchDrag?.groupId === selectedDetailGroup.id && detailBoardWorkbenchDrag.columnId === column.id,
                                          insertTarget: isInsertTarget,
                                        }),
                                        'h-[48px] shrink-0 gap-1.5 pr-6',
                                      )}
                                    >
                                      {isInsertTarget ? (
                                        <span className="pointer-events-none absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[color:var(--workspace-accent)]" />
                                      ) : null}
                                      <div
                                        className={`shrink-0 text-left text-[11px] font-medium ${normalizedColumn.required ? 'text-[color:var(--workspace-accent-strong)]' : 'text-slate-600 dark:text-slate-200'}`}
                                        style={{ width: labelWidth }}
                                        title={normalizedColumn.name}
                                      >
                                        <span className="block truncate">{normalizedColumn.name}</span>
                                      </div>
                                      <div className="min-w-0 flex-1 pr-7">
                                        {renderFieldPreview(normalizedColumn, columnIndex, 'filter')}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          onRemoveDetailGroupColumn(selectedDetailGroup.id, column.id);
                                        }}
                                        className="absolute right-3 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-rose-500/10"
                                        title="移出当前分组"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                      </button>
                                      <div
                                        data-drag-resize-handle="true"
                                        className="absolute bottom-1.5 right-0.5 top-1.5 flex w-2 cursor-col-resize items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                                        onMouseDown={(event) => onStartDetailBoardFieldResize(event, selectedDetailGroup.id, column.id, normalizedColumn.name)}
                                        onDoubleClick={(event) => onResetDetailBoardFieldWidth(event, selectedDetailGroup.id, column.id)}
                                        title="拖动调整宽度，双击恢复自动排布"
                                      >
                                        <span className="h-5 w-px rounded-full bg-slate-300/90 transition-colors group-hover:bg-[color:var(--workspace-accent)] dark:bg-slate-600" />
                                      </div>
                                    </DesignerWorkbenchDraggableItem>
                                  );
                                }) : isRowDropTarget && draggedDetailColumn ? (
                                  <div
                                    className={cn(
                                      getCompactWorkbenchItemClass({ selected: true }),
                                      'pointer-events-none h-[48px] shrink-0 gap-1.5 rounded-md border-dashed border-primary/35 bg-background/85 pr-6 shadow-sm',
                                    )}
                                    style={{
                                      width: resolveDetailBoardFieldWidth(
                                        selectedDetailGroup,
                                        draggedDetailColumn.id,
                                        detailBoardFieldDefaultWidth,
                                      ),
                                      minWidth: resolveDetailBoardFieldWidth(
                                        selectedDetailGroup,
                                        draggedDetailColumn.id,
                                        detailBoardFieldDefaultWidth,
                                      ),
                                    }}
                                  >
                                    <div
                                      className={`shrink-0 text-left text-[11px] font-medium ${normalizeColumn(draggedDetailColumn).required ? 'text-[color:var(--workspace-accent-strong)]' : 'text-foreground'}`}
                                      style={{ width: resolveDetailBoardLabelWidth(normalizeColumn(draggedDetailColumn).name) }}
                                      title={normalizeColumn(draggedDetailColumn).name}
                                    >
                                      <span className="block truncate">{normalizeColumn(draggedDetailColumn).name}</span>
                                    </div>
                                    <div className="min-w-0 flex-1 pr-7">
                                      {renderFieldPreview(normalizeColumn(draggedDetailColumn), 0, 'filter')}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                    拖入字段到本行，或从右侧“可加入字段”中追加
                                  </div>
                                )}
                              </div>
                            </div>
                          </DesignerWorkbenchDropLane>
                        </div>
                      );
                    })}
                  </div>
                </DndContext>
              </section>

              <section className="rounded-[20px] border border-slate-200/75 bg-white/94 px-4 py-4 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-slate-900/55">
                <div className="mb-3 flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-slate-100">
                  <span className="material-symbols-outlined text-[16px] text-[color:var(--workspace-accent)]">playlist_add</span>
                  可加入字段
                </div>
                {availableUnassignedDetailColumns.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableUnassignedDetailColumns.map((column) => {
                      const normalizedColumn = normalizeColumn(column);
                      return (
                        <button
                          key={`${selectedDetailGroup.id}-available-${column.id}`}
                          type="button"
                          onClick={() => onMergeDetailGroupColumns(selectedDetailGroup.id, [column.id])}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-[color:var(--workspace-accent-border)] hover:bg-[color:var(--workspace-accent-soft)] hover:text-[color:var(--workspace-accent-strong)] dark:border-slate-700 dark:bg-slate-950/76 dark:text-slate-200"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          {normalizedColumn.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] font-medium leading-5 text-slate-400 dark:text-slate-500">
                    当前主表字段已经全部分配到分组里了。
                  </div>
                )}
              </section>

              <section className="rounded-[20px] border border-slate-200/75 bg-white/94 px-4 py-4 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-slate-900/55">
                <div className="mb-3 flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-slate-100">
                  <span className="material-symbols-outlined text-[16px] text-[color:var(--workspace-accent)]">frame_inspect</span>
                  布局操作
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={onApplySuggestedDetailLayout}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[14px] border border-[color:var(--workspace-accent-border)] bg-[color:var(--workspace-accent-soft)] px-3 text-[12px] font-bold text-[color:var(--workspace-accent-strong)] transition-colors hover:bg-[color:var(--workspace-accent-tint)]"
                  >
                    <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
                    推荐布局
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDetailBoardPreview(1)}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[14px] border border-slate-200/90 bg-white px-3 text-[12px] font-bold text-slate-600 transition-colors hover:border-[color:var(--workspace-accent-border)] hover:text-[color:var(--workspace-accent-strong)] dark:border-slate-700 dark:bg-slate-950/72 dark:text-slate-200"
                  >
                    <span className="material-symbols-outlined text-[15px]">preview</span>
                    预览详情布局
                  </button>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
});
