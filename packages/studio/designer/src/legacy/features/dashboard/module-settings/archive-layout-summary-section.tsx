import React from 'react';
import { getDetailBoardGroupRows } from './detail-board-config';

type ArchiveLayoutSummarySectionProps = {
  availableGridColumnCount: number;
  compactCardClass: string;
  compactInfoCardClass: string;
  emptyStateText?: string;
  groupSummaryTitle?: string;
  groups: Record<string, any>[];
  onOpenConditionEditor?: () => void;
  title?: string;
  onOpenEditor: () => void;
  onOpenPreview: () => void;
  sectionTitleClass: string;
};

export const ArchiveLayoutSummarySection = React.memo(function ArchiveLayoutSummarySection({
  availableGridColumnCount,
  compactCardClass,
  compactInfoCardClass,
  emptyStateText = '还没有分组',
  groupSummaryTitle = '分组概览',
  groups,
  onOpenConditionEditor,
  title = '基础档案详情布局',
  onOpenEditor,
  onOpenPreview,
  sectionTitleClass,
}: ArchiveLayoutSummarySectionProps) {
  const groupCount = groups.length;
  const assignedFieldCount = groups.reduce((sum: number, group: any) => sum + (group.columnIds?.length ?? 0), 0);
  const unassignedFieldCount = Math.max(0, availableGridColumnCount - assignedFieldCount);

  return (
    <div className="space-y-4">
      <section className={compactCardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className={sectionTitleClass}>
              <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">dashboard_customize</span>
              <h4>{title}</h4>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {onOpenConditionEditor ? (
              <button
                type="button"
                onClick={onOpenConditionEditor}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-[color:var(--workspace-accent-border)] hover:text-[color:var(--workspace-accent-strong)]"
              >
                <span className="material-symbols-outlined text-[15px]">filter_alt</span>
                设计条件
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenEditor}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[color:var(--workspace-accent)] px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-[color:var(--workspace-accent-strong)]"
            >
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              点击设计
            </button>
            <button
              type="button"
              onClick={onOpenPreview}
              disabled={groupCount === 0}
              className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3.5 text-[12px] font-semibold transition-colors ${
                groupCount > 0
                  ? 'border-slate-200 bg-white text-slate-600 hover:border-[color:var(--workspace-accent-border)] hover:text-[color:var(--workspace-accent-strong)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                  : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">preview</span>
              预览布局
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className={compactInfoCardClass}>
            <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">分组数量</div>
            <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">{groupCount} 组</div>
          </div>
          <div className={compactInfoCardClass}>
            <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">已排布字段</div>
            <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">{assignedFieldCount} 项</div>
          </div>
          <div className={compactInfoCardClass}>
            <div className="text-[11px] font-bold tracking-[0.08em] text-slate-400">待排布字段</div>
            <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-100">{unassignedFieldCount} 项</div>
          </div>
        </div>
      </section>

      <section className={compactCardClass}>
        <div className={sectionTitleClass}>
          <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">tab_group</span>
          <h4>{groupSummaryTitle}</h4>
        </div>
        {groupCount > 0 ? (
          <div className="grid gap-2.5">
            {groups.map((group: any, groupIndex: number) => (
              <div
                key={group.id}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/55"
              >
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-semibold text-slate-700 dark:text-slate-100">
                    {group.name || `分组 ${groupIndex + 1}`}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {(group.columnIds?.length ?? 0)} 项字段 · {getDetailBoardGroupRows(group)} 行
                  </div>
                </div>
                <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  {groupIndex + 1}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-200/80 bg-slate-50/60 px-4 py-8 text-center text-[12px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/35 dark:text-slate-400">
            {emptyStateText}
          </div>
        )}
      </section>
    </div>
  );
});
