import React from 'react';

import {
  getShadcnTabTriggerClass,
  shadcnTabListClass,
} from '../../../components/ui/shadcn-inspector';
import { ConditionPanelInspector } from './condition-panel-inspector';
import { ContextMenuInspector } from './context-menu-inspector';
import { DetailTabInspector } from './detail-tab-inspector';
import { FieldInspectorController } from './field-inspector-controller';
import { GridActionInspector } from './grid-action-inspector';
import { GridInspectorController } from './grid-inspector-controller';
import {
  EmptyInspectorPanel,
  WorkspaceThemeInspector,
} from './misc-inspectors';
import { SourceGridInspector } from './source-grid-inspector';

export type InspectorTabId = 'common' | 'advanced' | 'contextmenu' | 'color' | 'columns';

export type InspectorPanelRouterProps = {
  activeTab: string;
  businessType: string;
  conditionPanelProps: Record<string, any>;
  contextMenuProps: Record<string, any>;
  detailTabProps: Record<string, any>;
  emptyInspectorProps: Record<string, any>;
  fieldProps: Record<string, any>;
  getDetailFillTypeByTabId: (tabId: string) => string;
  gridProps: Record<string, any>;
  inspectorPanelTab: InspectorTabId;
  inspectorTarget: any;
  normalizeDetailFillTypeValue: (fillType?: string) => string;
  onSelectInspectorTab: (tabId: InspectorTabId) => void;
  selectedColumnContext: any | null;
  sourceGridProps: Record<string, any>;
  workspaceThemeProps: Record<string, any>;
};

export function InspectorPanelRouter({
  activeTab,
  businessType,
  conditionPanelProps,
  contextMenuProps,
  detailTabProps,
  emptyInspectorProps,
  fieldProps,
  getDetailFillTypeByTabId,
  gridProps,
  inspectorPanelTab,
  inspectorTarget,
  normalizeDetailFillTypeValue,
  onSelectInspectorTab,
  selectedColumnContext,
  sourceGridProps,
  workspaceThemeProps,
}: InspectorPanelRouterProps) {
  if (!selectedColumnContext) {
    return <EmptyInspectorPanel {...(emptyInspectorProps as any)} />;
  }

  const isDocumentScopedGridInspector = selectedColumnContext.kind === 'grid'
    && businessType !== 'table'
    && (
      selectedColumnContext.scope === 'main-grid'
      || selectedColumnContext.scope === 'left-grid'
      || (
        selectedColumnContext.scope === 'detail-grid'
        && normalizeDetailFillTypeValue(
          inspectorTarget.kind === 'detail-grid'
            ? inspectorTarget.id
            : getDetailFillTypeByTabId(activeTab),
        ) === '表格'
      )
    );
  const documentScopedGridContextMenuCount = isDocumentScopedGridInspector
    ? (selectedColumnContext.column?.contextMenuItems ?? []).length
    : 0;
  const documentScopedGridColorRuleCount = isDocumentScopedGridInspector
    ? (selectedColumnContext.column?.colorRules ?? []).length
    : 0;
  const isBillFieldInspector = businessType === 'table'
    && selectedColumnContext.kind === 'column'
    && (
      selectedColumnContext.scope === 'main'
      || selectedColumnContext.scope === 'detail'
    );
  const isBillGridInspector = businessType === 'table'
    && selectedColumnContext.kind === 'grid'
    && (
      selectedColumnContext.scope === 'main-grid'
      || selectedColumnContext.scope === 'detail-grid'
    );
  const documentScopedGridLabel = selectedColumnContext.scope === 'left-grid'
    ? '左表'
    : selectedColumnContext.scope === 'detail-grid'
      ? '明细表'
      : '主表';
  const shouldHideBillInspectorTabs = isBillFieldInspector || isBillGridInspector;
  const inspectorTabs: Array<{ count?: number; icon: string; id: InspectorTabId; label: string }> = selectedColumnContext.kind === 'grid-action'
    ? [
        { id: 'common', label: '核心配置', icon: 'dashboard_customize' },
      ]
    : shouldHideBillInspectorTabs
      ? [
          { id: 'common', label: '核心配置', icon: 'dashboard_customize' },
        ]
    : isDocumentScopedGridInspector
      ? [
          { id: 'common', label: documentScopedGridLabel, icon: 'dashboard_customize' },
          { id: 'columns', label: '列数据', icon: 'table_rows' },
          { id: 'advanced', label: '布局', icon: 'view_stream' },
          { id: 'contextmenu', label: '右键', icon: 'right_click', count: documentScopedGridContextMenuCount },
          { id: 'color', label: '颜色', icon: 'palette', count: documentScopedGridColorRuleCount },
        ]
      : [
          { id: 'common', label: '核心配置', icon: 'dashboard_customize' },
          { id: 'advanced', label: '扩展配置', icon: 'network_node' },
        ];
  const currentInspectorTab = inspectorTabs.some((tab) => tab.id === inspectorPanelTab) ? inspectorPanelTab : 'common';
  const isCommonPanelTab = currentInspectorTab === 'common';
  const isColumnsPanelTab = currentInspectorTab === 'columns';
  const isContextMenuPanelTab = currentInspectorTab === 'contextmenu';
  const isColorPanelTab = currentInspectorTab === 'color';
  const useIconOnlyInspectorTabs = isDocumentScopedGridInspector;
  const inspectorCountBadgeClass = 'absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full border border-white bg-[#e04f5f] px-1 text-[9px] font-black leading-none text-white shadow-[0_10px_18px_-14px_rgba(224,79,95,0.78)] dark:border-slate-950';
  const inspectorTabsNode = shouldHideBillInspectorTabs
    ? null
    : (
        <div className={useIconOnlyInspectorTabs ? 'inline-flex items-center gap-1 rounded-md border border-slate-200/80 bg-slate-100/90 p-0.5 dark:border-slate-800 dark:bg-slate-900' : shadcnTabListClass}>
          {inspectorTabs.map((tab) => {
            const isActive = currentInspectorTab === tab.id;
            const hasCountBadge = typeof tab.count === 'number' && tab.count > 0;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectInspectorTab(tab.id)}
                title={tab.label}
                aria-label={tab.label}
                className={useIconOnlyInspectorTabs
                  ? (
                      isActive
                        ? 'relative flex size-9 items-center justify-center rounded-[8px] border border-slate-200/80 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50'
                        : 'relative flex size-9 items-center justify-center rounded-[8px] text-slate-500 transition-colors hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-950 dark:hover:text-slate-100'
                    )
                  : getShadcnTabTriggerClass(isActive)}
              >
                <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-[#1686e3]' : 'text-slate-400 dark:text-slate-500'}`}>{tab.icon}</span>
                {useIconOnlyInspectorTabs ? <span className="sr-only">{tab.label}</span> : <span className="truncate">{tab.label}</span>}
                {hasCountBadge ? (
                  <span className={inspectorCountBadgeClass}>
                    {tab.count! > 9 ? '9+' : tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      );

  if (selectedColumnContext.kind === 'workspace-theme') {
    return <WorkspaceThemeInspector {...(workspaceThemeProps as any)} />;
  }

  if (selectedColumnContext.kind === 'source-grid') {
    return <SourceGridInspector {...(sourceGridProps as any)} />;
  }

  if (selectedColumnContext.kind === 'detail-tab') {
    return (
      <DetailTabInspector
        {...(detailTabProps as any)}
        inspectorTabsNode={inspectorTabsNode}
        isCommonPanelTab={isCommonPanelTab}
      />
    );
  }

  if (selectedColumnContext.kind === 'contextmenu') {
    return (
      <ContextMenuInspector
        {...(contextMenuProps as any)}
        inspectorTabsNode={inspectorTabsNode}
        isCommonPanelTab={isCommonPanelTab}
      />
    );
  }

  if (selectedColumnContext.kind === 'grid') {
    return (
      <GridInspectorController
        {...(gridProps as any)}
        isColumnsPanelTab={isColumnsPanelTab}
        inspectorTabsNode={inspectorTabsNode}
        isColorPanelTab={isColorPanelTab}
        isCommonPanelTab={isCommonPanelTab}
        isContextMenuPanelTab={isContextMenuPanelTab}
      />
    );
  }

  if (selectedColumnContext.kind === 'grid-action') {
    return <GridActionInspector context={selectedColumnContext} />;
  }

  if (selectedColumnContext.kind === 'condition-panel') {
    return <ConditionPanelInspector {...(conditionPanelProps as any)} />;
  }

  return (
    <FieldInspectorController
      {...(fieldProps as any)}
      isCommonPanelTab={isCommonPanelTab}
      renderInspectorTabsNode={inspectorTabsNode}
    />
  );
}
