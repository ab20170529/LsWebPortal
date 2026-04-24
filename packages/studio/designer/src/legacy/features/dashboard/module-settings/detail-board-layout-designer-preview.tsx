import React, { useMemo } from 'react';

import { ArchiveLayoutFieldShell } from './archive-layout-field-shell';
import {
  buildDetailBoardPreviewGroupsFromDesignerLayout,
  DETAIL_BOARD_DESIGNER_ROOT_GROUP_ID,
} from './detail-board-layout-designer-adapter';
import type { LayoutFieldWorkbenchMetaResolver } from './layout-field-workbench-meta';

type DetailBoardTheme = {
  groupLabel: string;
  groupShell: string;
};

type DetailBoardLayoutDesignerPreviewProps = {
  detailBoardConfig: Record<string, any>;
  detailBoardTheme: DetailBoardTheme;
  getDetailBoardFieldLiveHeight: (groupId: string, columnId: string, fallbackHeight: number) => number;
  getDetailBoardFieldLiveWidth: (groupId: string, columnId: string, fallbackWidth: number) => number;
  getLayoutFieldWorkbenchMeta: LayoutFieldWorkbenchMetaResolver;
  mainTableColumns: Record<string, any>[];
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
};

function getPreviewBodyHeight(items: Array<{ y: number; h: number }>) {
  const maxBottom = items.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  return Math.max(140, maxBottom + 24);
}

export const DetailBoardLayoutDesignerPreview = React.memo(function DetailBoardLayoutDesignerPreview({
  detailBoardConfig,
  detailBoardTheme,
  getDetailBoardFieldLiveHeight,
  getDetailBoardFieldLiveWidth,
  getLayoutFieldWorkbenchMeta,
  mainTableColumns,
  onResetDetailBoardFieldHeight,
  onResetDetailBoardFieldWidth,
  onStartDetailBoardFieldHeightResize,
  onStartDetailBoardFieldResize,
  renderFieldPreview,
}: DetailBoardLayoutDesignerPreviewProps) {
  const previewGroups = useMemo(
    () => buildDetailBoardPreviewGroupsFromDesignerLayout(detailBoardConfig.designerLayout),
    [detailBoardConfig.designerLayout],
  );
  const columnById = useMemo(
    () => new Map(mainTableColumns.map((column) => [String(column.id), column])),
    [mainTableColumns],
  );

  if (previewGroups.length === 0) {
    return (
      <section className={`rounded-[18px] border border-dashed px-6 py-10 text-center ${detailBoardTheme.groupShell}`}>
        <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-white text-[color:var(--workspace-accent)] shadow-[0_18px_30px_-24px_rgba(15,23,42,0.16)]">
          <span className="material-symbols-outlined text-[24px]">view_stream</span>
        </div>
        <div className="mt-4 text-[15px] font-bold text-slate-800 dark:text-slate-100">还没有详情分组</div>
      </section>
    );
  }

  return (
    <>
      {previewGroups.map((group) => {
        const previewItems = group.items
          .map((item) => {
            const column = item.field ? columnById.get(String(item.field)) : null;
            if (!column) {
              return null;
            }

            const layoutMeta = getLayoutFieldWorkbenchMeta(column, item.w, item.h);
            const liveWidth = getDetailBoardFieldLiveWidth(group.id, String(item.field), item.w || layoutMeta.width);
            const liveHeight = getDetailBoardFieldLiveHeight(group.id, String(item.field), item.h || layoutMeta.height);
            const liveMeta = getLayoutFieldWorkbenchMeta(column, liveWidth, liveHeight);

            return {
              column,
              item,
              liveHeight,
              liveMeta,
              liveWidth,
            };
          })
          .filter(Boolean) as Array<{
            column: Record<string, any>;
            item: { field?: string; h: number; w: number; x: number; y: number };
            liveHeight: number;
            liveMeta: ReturnType<LayoutFieldWorkbenchMetaResolver>;
            liveWidth: number;
          }>;

        return (
          <section
            key={group.id}
            className={`overflow-hidden rounded-xl border bg-white shadow-[0_12px_28px_-28px_rgba(15,23,42,0.2)] dark:bg-slate-950 ${detailBoardTheme.groupShell}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3 dark:border-slate-700">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">{group.title}</div>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${detailBoardTheme.groupLabel}`}>
                {previewItems.length} 项
              </span>
            </div>
            <div className="px-3.5 py-3">
              <div
                className="relative overflow-auto rounded-[18px] border border-slate-200/70 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-900/40"
                style={{ minHeight: getPreviewBodyHeight(previewItems.map((item) => ({ y: item.item.y, h: item.liveHeight }))) }}
              >
                {previewItems.map(({ column, item, liveHeight, liveMeta, liveWidth }, index) => (
                  <div
                    key={String(item.field)}
                    data-detail-field-item="true"
                    style={{
                      height: liveHeight,
                      left: item.x,
                      maxWidth: liveWidth,
                      minWidth: liveMeta.minWidth,
                      position: 'absolute',
                      top: item.y,
                      width: liveWidth,
                    }}
                    className="group min-w-0 self-start"
                  >
                    <ArchiveLayoutFieldShell
                      getLayoutFieldWorkbenchMeta={getLayoutFieldWorkbenchMeta}
                      height={liveHeight}
                      rawField={column}
                      renderFieldPreview={renderFieldPreview}
                      rowIndex={index}
                      width={liveWidth}
                    />
                    <button
                      type="button"
                      onMouseDown={(event) => onStartDetailBoardFieldResize(event, group.id, String(item.field), liveMeta.field.name, liveMeta.minWidth)}
                      onDoubleClick={(event) => onResetDetailBoardFieldWidth(event, group.id, String(item.field))}
                      className="absolute bottom-1.5 right-0 top-1.5 flex w-3 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                      title="拖动调整宽度，双击恢复自动排布"
                    >
                      <span className="h-8 w-px rounded-full bg-slate-300/90 transition-colors group-hover:bg-[color:var(--workspace-accent)] dark:bg-slate-600" />
                    </button>
                    {liveMeta.isTallControl ? (
                      <button
                        type="button"
                        onMouseDown={(event) => onStartDetailBoardFieldHeightResize(event, group.id, String(item.field), liveMeta.field.name, liveMeta.minHeight)}
                        onDoubleClick={(event) => onResetDetailBoardFieldHeight(event, group.id, String(item.field))}
                        className="absolute bottom-0 left-10 right-6 flex h-3 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                        title="拖动调整高度，双击恢复默认高度"
                      >
                        <span className="h-px w-10 rounded-full bg-slate-300/90 transition-colors group-hover:bg-[color:var(--workspace-accent)] dark:bg-slate-600" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              {group.id === DETAIL_BOARD_DESIGNER_ROOT_GROUP_ID ? (
                <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                  根画布中的字段会归类到这里预览。
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </>
  );
});
