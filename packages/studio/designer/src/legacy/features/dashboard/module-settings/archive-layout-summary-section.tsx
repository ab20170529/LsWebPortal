import React from 'react';
import {
  shadcnInspectorActionButtonClass,
  getShadcnInspectorListBadgeClass,
  getShadcnInspectorListItemClass,
  shadcnInspectorListClass,
  shadcnInspectorPrimaryActionButtonClass,
} from '../../../components/ui/shadcn-inspector';
import { getDetailBoardGroupRows } from './detail-board-config';

type ArchiveLayoutSummarySectionProps = {
  availableGridColumnCount: number;
  compactCardClass: string;
  emptyStateText?: string;
  groupSummaryTitle?: string;
  groups: Record<string, any>[];
  onOpenConditionEditor?: () => void;
  onSelectGroup?: (groupId: string) => void;
  title?: string;
  onOpenEditor: () => void;
  onOpenPreview: () => void;
  sectionTitleClass: string;
  selectedGroupId?: string | null;
};

export const ArchiveLayoutSummarySection = React.memo(function ArchiveLayoutSummarySection({
  compactCardClass,
  emptyStateText = '还没有分组',
  groupSummaryTitle = '分组概览',
  groups,
  onOpenConditionEditor,
  onSelectGroup,
  title = '基础档案详情布局',
  onOpenEditor,
  sectionTitleClass,
  selectedGroupId = null,
}: ArchiveLayoutSummarySectionProps) {
  const groupCount = groups.length;
  const resolvedSelectedGroupId = selectedGroupId && groups.some((group: any) => String(group.id) === String(selectedGroupId))
    ? String(selectedGroupId)
    : (groups[0]?.id ? String(groups[0].id) : null);

  return (
    <div className="space-y-1.5">
      <section className={compactCardClass}>
        <div className="space-y-3">
          <div className={sectionTitleClass}>
            <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">dashboard_customize</span>
            <h4>{title}</h4>
          </div>
          <div className="flex justify-start">
            <div className="flex shrink-0 flex-col items-stretch gap-2">
            <button
              type="button"
              onClick={onOpenEditor}
              className={`${shadcnInspectorPrimaryActionButtonClass} h-9 min-w-[116px] justify-center px-3.5 text-[12px]`}
            >
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              定义设计
            </button>
            {onOpenConditionEditor ? (
              <button
                type="button"
                onClick={onOpenConditionEditor}
                className={`${shadcnInspectorActionButtonClass} h-9 min-w-[116px] justify-center px-3.5 text-[12px]`}
              >
                <span className="material-symbols-outlined text-[15px]">filter_alt</span>
                条件设计
              </button>
            ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className={compactCardClass}>
        <div className={sectionTitleClass}>
          <span className="material-symbols-outlined text-[18px] text-[color:var(--workspace-accent)]">tab_group</span>
          <h4>{groupSummaryTitle}</h4>
        </div>
        {groupCount > 0 ? (
          <div className={shadcnInspectorListClass}>
            {groups.map((group: any, groupIndex: number) => (
              <button
                key={group.id}
                type="button"
                onClick={() => {
                  if (group.id && onSelectGroup) {
                    onSelectGroup(String(group.id));
                  }
                }}
                className={getShadcnInspectorListItemClass(String(group.id) === resolvedSelectedGroupId)}
              >
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-[13px] ${String(group.id) === resolvedSelectedGroupId ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-medium'}`}>
                    {group.name || `分组 ${groupIndex + 1}`}
                  </div>
                  <div className={`mt-1 text-[11px] ${String(group.id) === resolvedSelectedGroupId ? 'text-slate-500 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {(group.columnIds?.length ?? 0)} 项字段 · {getDetailBoardGroupRows(group)} 行
                  </div>
                </div>
                <span className={getShadcnInspectorListBadgeClass(String(group.id) === resolvedSelectedGroupId)}>
                  {group.columnIds?.length ?? 0}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-200/60 bg-white/70 px-4 py-8 text-center text-[12px] text-slate-500 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
            {emptyStateText}
          </div>
        )}
      </section>
    </div>
  );
});
