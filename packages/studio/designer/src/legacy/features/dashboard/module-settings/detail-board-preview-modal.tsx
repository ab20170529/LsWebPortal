import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArchiveLayoutFieldShell } from './archive-layout-field-shell';
import { DetailBoardLayoutDesignerPreview } from './detail-board-layout-designer-preview';
import {
  getDetailBoardGroupColumnRow,
  getDetailBoardGroupRows,
  getDetailBoardTheme,
} from './detail-board-config';
import type { LayoutFieldWorkbenchMetaResolver } from './layout-field-workbench-meta';

type DetailBoardPreviewModalProps = {
  detailBoardConfig: Record<string, any>;
  detailBoardSortColumnId: string | null;
  getDetailBoardFieldLiveHeight: (groupId: string, columnId: string, fallbackHeight: number) => number;
  getDetailBoardFieldLiveWidth: (groupId: string, columnId: string, fallbackWidth: number) => number;
  getLayoutFieldWorkbenchMeta: LayoutFieldWorkbenchMetaResolver;
  isOpen: boolean;
  mainTableColumns: Record<string, any>[];
  onClose: () => void;
  onResetDetailBoardFieldHeight: (event: React.MouseEvent<any>, groupId: string, columnId: string) => void;
  onResetDetailBoardFieldWidth: (event: React.MouseEvent<any>, groupId: string, columnId: string) => void;
  onStartDetailBoardFieldHeightResize: (
    event: React.MouseEvent<any>,
    groupId: string,
    columnId: string,
    label: string,
    minHeightOverride?: number,
  ) => void;
  onStartDetailBoardFieldResize: (
    event: React.MouseEvent<any>,
    groupId: string,
    columnId: string,
    label: string,
    minWidthOverride?: number,
  ) => void;
  renderFieldPreview: (column: Record<string, any>, index: number, scope: string) => React.ReactNode;
  workspaceTheme: string;
  workspaceThemeVars: React.CSSProperties;
};

export const DetailBoardPreviewModal = React.memo(function DetailBoardPreviewModal({
  detailBoardConfig,
  detailBoardSortColumnId,
  getDetailBoardFieldLiveHeight,
  getDetailBoardFieldLiveWidth,
  getLayoutFieldWorkbenchMeta,
  isOpen,
  mainTableColumns,
  onClose,
  onResetDetailBoardFieldHeight,
  onResetDetailBoardFieldWidth,
  onStartDetailBoardFieldHeightResize,
  onStartDetailBoardFieldResize,
  renderFieldPreview,
  workspaceTheme,
  workspaceThemeVars,
}: DetailBoardPreviewModalProps) {
  if (!isOpen) return null;

  const detailBoardTheme = getDetailBoardTheme(workspaceTheme);
  const hasDesignerLayout = Boolean(detailBoardConfig?.designerLayout?.items?.length);
  const sortColumnId = detailBoardSortColumnId || detailBoardConfig.sortColumnId || mainTableColumns[0]?.id || null;
  const panelGroups = detailBoardConfig.groups
    .map((group: any) => ({
      ...group,
      columns: group.columnIds
        .map((columnId: string) => mainTableColumns.find((column) => column.id === columnId))
        .filter(Boolean),
    }))
    .filter((group: any) => group.columns.length > 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-6 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          onClick={(event) => event.stopPropagation()}
          style={workspaceThemeVars}
          className="flex h-[84vh] w-full max-w-[1160px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.995),rgba(245,248,252,0.985))] shadow-[0_60px_140px_-52px_rgba(15,23,42,0.68)] dark:border-slate-700 dark:bg-slate-900"
        >
          <div className={`border-b border-slate-200 px-6 py-4 dark:border-slate-700 ${detailBoardTheme.hero}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl border border-white/70 bg-white/82 text-[color:var(--workspace-accent)] shadow-[0_16px_28px_-24px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-slate-900/58">
                    <span className="material-symbols-outlined text-[18px]">view_stream</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[17px] font-bold tracking-[-0.02em] text-slate-900 dark:text-white">详情布局预览</div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
                      拖动字段右侧分隔线可调宽度，拖动下边缘可放大备注框。
                    </div>
                    <div className="mt-2 inline-flex items-center rounded-xl border border-white/70 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[color:var(--workspace-accent-strong)] shadow-[0_12px_24px_-22px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-slate-900/58">
                      {hasDesignerLayout ? '当前预览来源：designerLayout 优先模式' : '当前预览来源：legacy groups 兼容模式'}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="inline-flex size-11 items-center justify-center rounded-[18px] border border-white/75 bg-white/80 text-slate-500 transition-colors hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          <div className="scrollbar-none min-h-0 flex-1 overflow-auto bg-[linear-gradient(180deg,rgba(250,252,255,0.98),rgba(244,247,251,0.96))] dark:bg-slate-900">
            <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3 px-5 py-4">
              {hasDesignerLayout ? (
                <DetailBoardLayoutDesignerPreview
                  detailBoardConfig={detailBoardConfig}
                  detailBoardTheme={detailBoardTheme}
                  getDetailBoardFieldLiveHeight={getDetailBoardFieldLiveHeight}
                  getDetailBoardFieldLiveWidth={getDetailBoardFieldLiveWidth}
                  getLayoutFieldWorkbenchMeta={getLayoutFieldWorkbenchMeta}
                  mainTableColumns={mainTableColumns}
                  onResetDetailBoardFieldHeight={onResetDetailBoardFieldHeight}
                  onResetDetailBoardFieldWidth={onResetDetailBoardFieldWidth}
                  onStartDetailBoardFieldHeightResize={onStartDetailBoardFieldHeightResize}
                  onStartDetailBoardFieldResize={onStartDetailBoardFieldResize}
                  renderFieldPreview={renderFieldPreview}
                />
              ) : panelGroups.length === 0 ? (
                <section className={`rounded-[18px] border border-dashed px-6 py-10 text-center ${detailBoardTheme.groupShell}`}>
                  <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-white text-[color:var(--workspace-accent)] shadow-[0_18px_30px_-24px_rgba(15,23,42,0.16)]">
                    <span className="material-symbols-outlined text-[24px]">view_stream</span>
                  </div>
                  <div className="mt-4 text-[15px] font-bold text-slate-800 dark:text-slate-100">还没有详情分组</div>
                </section>
              ) : panelGroups.map((group: any) => {
                const orderedColumns = [...group.columns].sort((left: any, right: any) => {
                  if (left.id === sortColumnId) return -1;
                  if (right.id === sortColumnId) return 1;
                  return 0;
                });
                const rowNumbers = Array.from({ length: getDetailBoardGroupRows(group) }, (_, index) => index + 1);

                return (
                  <section
                    key={group.id}
                    className={`overflow-hidden rounded-xl border bg-white shadow-[0_12px_28px_-28px_rgba(15,23,42,0.2)] dark:bg-slate-950 ${detailBoardTheme.groupShell}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3 dark:border-slate-700">
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">{group.name}</div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${detailBoardTheme.groupLabel}`}>
                        {orderedColumns.length} 项
                      </span>
                    </div>
                    <div className="px-3.5 py-3">
                      <div className="space-y-2.5">
                        {rowNumbers.map((rowNumber) => {
                          const rowColumns = orderedColumns.filter((column: any) => getDetailBoardGroupColumnRow(group, column.id) === rowNumber);
                          if (rowColumns.length === 0) return null;

                          return (
                            <div
                              key={`${group.id}-preview-row-${rowNumber}`}
                              className="overflow-x-auto px-1 py-1.5"
                            >
                              <div className="flex items-start gap-2">
                                {rowColumns.map((column: any, columnIndex: number) => {
                                  const layoutMeta = getLayoutFieldWorkbenchMeta(column, group.columnWidths?.[column.id]);
                                  const liveWidth = getDetailBoardFieldLiveWidth(group.id, column.id, layoutMeta.width);
                                  const liveHeight = getDetailBoardFieldLiveHeight(group.id, column.id, layoutMeta.height);
                                  const liveMeta = getLayoutFieldWorkbenchMeta(column, liveWidth, liveHeight);

                                  return (
                                    <div
                                      key={column.id}
                                      data-detail-field-item="true"
                                      style={{
                                        width: liveWidth,
                                        minWidth: liveMeta.minWidth,
                                        maxWidth: liveWidth,
                                        height: liveMeta.isTallControl ? liveHeight : undefined,
                                      }}
                                      className={`group relative min-w-0 shrink-0 self-start ${liveMeta.frameClass}`}
                                    >
                                      <ArchiveLayoutFieldShell
                                        getLayoutFieldWorkbenchMeta={getLayoutFieldWorkbenchMeta}
                                        height={liveHeight}
                                        rawField={liveMeta.field}
                                        renderFieldPreview={renderFieldPreview}
                                        rowIndex={columnIndex}
                                        width={liveWidth}
                                      />
                                      <button
                                        type="button"
                                        onMouseDown={(event) => onStartDetailBoardFieldResize(event, group.id, column.id, liveMeta.field.name, liveMeta.minWidth)}
                                        onDoubleClick={(event) => onResetDetailBoardFieldWidth(event, group.id, column.id)}
                                        className="absolute bottom-1.5 right-0 top-1.5 flex w-3 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                                        title="拖动调整宽度，双击恢复自动排布"
                                      >
                                        <span className="h-8 w-px rounded-full bg-slate-300/90 transition-colors group-hover:bg-[color:var(--workspace-accent)] dark:bg-slate-600" />
                                      </button>
                                      {liveMeta.isTallControl ? (
                                        <button
                                          type="button"
                                          onMouseDown={(event) => onStartDetailBoardFieldHeightResize(event, group.id, column.id, liveMeta.field.name, liveMeta.minHeight)}
                                          onDoubleClick={(event) => onResetDetailBoardFieldHeight(event, group.id, column.id)}
                                          className="absolute bottom-0 left-10 right-6 flex h-3 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                                          title="拖动调整高度，双击恢复默认高度"
                                        >
                                          <span className="h-px w-10 rounded-full bg-slate-300/90 transition-colors group-hover:bg-[color:var(--workspace-accent)] dark:bg-slate-600" />
                                        </button>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
