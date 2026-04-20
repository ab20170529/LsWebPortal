import React from 'react';

import { GridOperationConfigBar } from './grid-operation-config-bar';
import { MemoDocumentDetailWorkbench } from './detail-workbench';
import { DetailFillPlaceholder, DetailTabsWorkspace } from './detail-tabs-workspace';
import { DocumentGridToolbarBridge, DocumentTreePanel } from './document-workspace-panels';
import { type GridOperationActionKey } from './grid-operation-config';
import { TableWorkbenchPanel } from './table-workbench-panel';

export type ModuleSettingStepShellProps = {
  billDocumentWorkbenchNode: React.ReactNode;
  businessType: 'document' | 'table' | 'tree';
  columnOperationPanel: React.ReactNode;
  currentModuleName: string;
  inspectorPaneWidth: number;
  isConfigFullscreenActive: boolean;
  moduleSettingStageHeightClass: string;
  moduleSettingStageStyle: React.CSSProperties;
  onToggleFullscreen: () => void;
  workspaceTheme?: string;
  workspaceThemeStyles: {
    tableSurface: string;
  };
  document: {
    activeTab: string;
    archiveMainTableBuilderNode: React.ReactNode;
    conditionToolbarNode: React.ReactNode;
    currentDetailFillType: string;
    detailGridActionConfig: Record<string, any> | null;
    detailTabs: any[];
    documentDetailTableBuilderNode: React.ReactNode;
    documentLeftPaneWidth: number;
    documentTreeTableBuilderNode: React.ReactNode;
    isDetailFillSelected: boolean;
    isTreePaneVisible: boolean;
    mainGridActionConfig: Record<string, any>;
    mainTableHiddenColumnsCount: number;
    onActivateDetailFill: () => void;
    onActivateDetailTab: (tabId: string) => void;
    onAddDetailTab: () => void;
    onDeleteDetailTab: (tabId: string, event: React.MouseEvent) => void;
    onOpenMainHiddenColumnsModal: () => void;
    onPasteDetailTableColumns: React.ClipboardEventHandler<HTMLDivElement>;
    onPasteMainTable: React.ClipboardEventHandler<HTMLDivElement>;
    onPasteTreePanel: React.ClipboardEventHandler<HTMLDivElement>;
    onSelectDetailGridAction: (actionKey: GridOperationActionKey) => void;
    onSelectMainGridAction: (actionKey: GridOperationActionKey) => void;
    onStartLeftResize: (event: React.MouseEvent<HTMLDivElement>) => void;
    selectedDetailGridAction: GridOperationActionKey | null;
    selectedMainGridAction: GridOperationActionKey | null;
    showDetailGridActionBar: boolean;
    treeRelationColumn: any;
    workspaceThemeVars: React.CSSProperties;
  };
  tree: {
    activeResize: any;
    activeTab: string;
    autoFitColumnWidth: (...args: any[]) => void;
    buildDocumentFilterRuntimeRules: (fields: any[], activeResize: any) => string;
    builderDetailTableBuilderNode: React.ReactNode;
    builderLeftTableBuilderNode: React.ReactNode;
    builderMainTableBuilderNode: React.ReactNode;
    conditionPanelControlWidth: number;
    conditionPanelResizeMaxWidth: number;
    conditionPanelResizeMinWidth: number;
    currentDetailFillType: string;
    detailTabs: any[];
    detailWebUrl: string;
    isDetailViewSelected: boolean;
    isSingleTableSyncing: boolean;
    mainDocumentFilterRuntimeRules?: string;
    mainFilterFields: any[];
    mainTableColumns: any[];
    mainTableHiddenColumnsCount: number;
    onActivateCurrentDetailView: () => void;
    onActivateDetailTab: (tabId: string) => void;
    onActivateMainFilter: (id: string) => void;
    onAddDetailColumn: () => void;
    onAddDetailTab: () => void;
    onAddLeftColumn: () => void;
    onAddMainColumn: () => void;
    onAddMainFilter: () => void;
    onDeleteDetailTab: (tabId: string, event: React.MouseEvent) => void;
    onDeleteLeftSelection: () => void;
    onDeleteMainFilters: () => void;
    onDeleteMainSelection: () => void;
    onDeleteSelectedDetailColumns: () => void;
    onOpenDetailWebConfig: () => void;
    onOpenMainHiddenColumnsModal: () => void;
    onPasteDetailColumns: React.ClipboardEventHandler<HTMLDivElement>;
    onPasteLeftColumns: React.ClipboardEventHandler<HTMLDivElement>;
    onPasteMainColumns: React.ClipboardEventHandler<HTMLDivElement>;
    onSetBuilderSelectionContextMenu: (menu: any) => void;
    renderFieldPreview: (rawField: any, rowIndex: number, mode?: 'table' | 'filter' | 'condition') => React.ReactNode;
    selectedDetailForDelete: string[];
    selectedLeftForDeleteCount: number;
    selectedMainFilterId: string | null;
    selectedMainFiltersForDelete: string[];
    selectedMainForDeleteCount: number;
    setMainFilterFields: React.Dispatch<React.SetStateAction<any[]>>;
    setSelectedMainFiltersForDelete: React.Dispatch<React.SetStateAction<string[]>>;
    startResize: (...args: any[]) => void;
  };
};

export function ModuleSettingStepShell({
  billDocumentWorkbenchNode,
  businessType,
  columnOperationPanel,
  currentModuleName,
  inspectorPaneWidth,
  isConfigFullscreenActive,
  moduleSettingStageHeightClass,
  moduleSettingStageStyle,
  onToggleFullscreen,
  workspaceThemeStyles,
  document,
  tree,
}: ModuleSettingStepShellProps) {
  const hasDocumentDetails = document.detailTabs.length > 0;
  const stageShellClass = `flex min-h-0 overflow-hidden bg-[#f3f6fa] ${workspaceThemeStyles.tableSurface}`;
  const documentWorkspaceShellClass = 'flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-none bg-[linear-gradient(180deg,#fbfdff_0%,#f2f7fb_100%)] p-1.5 shadow-[0_24px_48px_-44px_rgba(96,165,250,0.22)]';
  const documentWorkspaceGridClass = hasDocumentDetails
    ? 'grid-rows-[minmax(340px,1.08fr)_minmax(300px,0.92fr)] gap-y-2.5'
    : 'grid-rows-[minmax(0,1fr)]';
  const workspacePanelClass = 'flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#d9e2ec] bg-white shadow-none';
  const workspacePanelHeaderClass = 'flex items-center justify-between border-b border-[#e6edf5] bg-[#f8fafc] px-4 py-3';
  const sectionIconClass = 'flex size-8 items-center justify-center rounded-[10px] border border-[#dbe5ef] bg-[#f6f9fc] text-[color:var(--workspace-accent-strong)]';
  const sectionActionButtonClass = 'inline-flex items-center gap-1 rounded-[10px] border border-[#dbe5ef] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800';
  const primaryActionButtonClass = 'inline-flex items-center gap-1 rounded-[10px] bg-[color:var(--workspace-accent)] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_10px_18px_-16px_rgba(15,23,42,0.2)] transition-all hover:bg-[color:var(--workspace-accent-strong)]';
  const rightPaneShellClass = 'flex min-h-0 shrink-0 flex-col border-l border-[#e2e8f0] bg-[#f7f9fc]';
  const singleTableDesignTitle = `${String(currentModuleName || '当前模块').trim() || '当前模块'} - 单表设计`;
  const alignedInspectorPaneWidth = Math.min(inspectorPaneWidth, isConfigFullscreenActive ? 392 : 360);
  const documentMainTableFooterNode = (
    <div className="flex min-h-0 flex-col">
      <GridOperationConfigBar
        config={document.mainGridActionConfig}
        selectedActionKey={document.selectedMainGridAction}
        onSelectAction={document.onSelectMainGridAction}
      />
      {!hasDocumentDetails ? (
        <div className="border-t border-dashed border-[color:var(--workspace-accent-border)] bg-[#fbfdff] px-4 py-3 dark:bg-slate-900/75">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">当前未创建明细</div>
              <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-300">
                点击创建明细后，会恢复下方明细工作台，继续按上下分区方式配置。
              </p>
            </div>
            <button
              type="button"
              onClick={document.onAddDetailTab}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-[color:var(--workspace-accent)] px-4 text-[12px] font-semibold text-white shadow-[0_12px_24px_-22px_var(--workspace-accent-shadow)] transition-colors hover:bg-[color:var(--workspace-accent-strong)]"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              创建明细
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (businessType === 'document') {
    return (
      <>
        <div style={moduleSettingStageStyle} className={`${stageShellClass} ${moduleSettingStageHeightClass}`}>
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            <div className="border-b border-[#e6edf5] bg-[#fbfcfe]">
              <div
                className="cursor-pointer select-none border-t-[4px] border-[color:var(--workspace-accent)] px-6 py-3 text-center transition-colors hover:bg-[#f8fbff]"
                onDoubleClick={onToggleFullscreen}
                title="双击切换全屏"
              >
                <div className="text-[22px] font-bold tracking-[0.06em] text-slate-700">
                  {singleTableDesignTitle}
                </div>
              </div>
            </div>
            <div className="min-h-0 min-w-0 flex flex-1 overflow-hidden">
              {document.isTreePaneVisible ? (
                <>
                  <div className="flex min-h-0 shrink-0 flex-col" style={{ width: document.documentLeftPaneWidth }}>
                    <DocumentTreePanel
                      treeRelationColumn={document.treeRelationColumn}
                      workspaceThemeVars={document.workspaceThemeVars}
                      documentTreeTableBuilderNode={document.documentTreeTableBuilderNode}
                      onPaste={document.onPasteTreePanel}
                    />
                  </div>

                  <div
                    className="group flex w-3 shrink-0 cursor-col-resize items-center justify-center"
                    onMouseDown={document.onStartLeftResize}
                  >
                    <div className="h-28 w-px rounded-full bg-[#dbe4ee] transition-colors group-hover:bg-[color:var(--workspace-accent-border-strong)] dark:bg-slate-700" />
                  </div>
                </>
              ) : null}

              <div className="h-full min-h-0 min-w-0 flex-1">
                <div className={documentWorkspaceShellClass}>
                  <div className={`grid h-full min-h-0 overflow-hidden ${documentWorkspaceGridClass}`}>
                    <TableWorkbenchPanel
                      bodyNode={document.archiveMainTableBuilderNode}
                      bodyStyle={{ backgroundColor: '#ffffff' }}
                      footerNode={documentMainTableFooterNode}
                      onPaste={document.onPasteMainTable}
                    />

                    {hasDocumentDetails ? (
                      <div className="relative flex min-h-0 flex-col overflow-hidden before:pointer-events-none before:absolute before:inset-x-8 before:-top-1 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(148,163,184,0.58),transparent)]">
                        <MemoDocumentDetailWorkbench
                          detailTabs={document.detailTabs}
                          activeTab={document.activeTab}
                          currentDetailFillType={document.currentDetailFillType}
                          onActivateTab={document.onActivateDetailTab}
                          onAddTab={document.onAddDetailTab}
                          footerNode={document.showDetailGridActionBar ? (
                            <GridOperationConfigBar
                              config={document.detailGridActionConfig}
                              selectedActionKey={document.selectedDetailGridAction}
                              onSelectAction={document.onSelectDetailGridAction}
                            />
                          ) : null}
                          onPasteTableColumns={document.onPasteDetailTableColumns}
                          tableBuilderNode={document.documentDetailTableBuilderNode}
                          fillPlaceholderNode={(
                            <DetailFillPlaceholder
                              currentDetailFillType={document.currentDetailFillType}
                              isSelected={document.isDetailFillSelected}
                              onActivate={document.onActivateDetailFill}
                            />
                          )}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={rightPaneShellClass} style={{ width: alignedInspectorPaneWidth, minWidth: alignedInspectorPaneWidth }}>
            {columnOperationPanel}
          </div>
        </div>
        {document.conditionToolbarNode}
      </>
    );
  }

  if (businessType === 'table') {
    return (
      <div style={moduleSettingStageStyle} className={`${stageShellClass} flex-1 ${isConfigFullscreenActive ? 'min-h-[640px]' : ''}`}>
        <div className="grid h-full min-h-0 flex-1 gap-0" style={{ gridTemplateColumns: `minmax(0,1fr) ${alignedInspectorPaneWidth}px` }}>
          <div className="flex h-full min-h-0">
            {billDocumentWorkbenchNode}
          </div>
          <div className={rightPaneShellClass} style={{ width: alignedInspectorPaneWidth, minWidth: alignedInspectorPaneWidth }}>
            {columnOperationPanel}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={moduleSettingStageStyle} className={`${stageShellClass} flex-col ${moduleSettingStageHeightClass}`}>
      <div className={`cloudy-cloud-grid studio-grid-bg grid min-h-0 flex-1 ${
        isConfigFullscreenActive
          ? 'xl:grid-cols-[minmax(220px,0.72fr)_minmax(0,1.28fr)]'
          : 'xl:grid-cols-[minmax(260px,0.82fr)_minmax(0,1.18fr)]'
      } gap-0`}>
        <div className={workspacePanelClass}>
          <div className={workspacePanelHeaderClass}>
            <div className="flex items-center gap-3">
              <div className={sectionIconClass}>
                <span className="material-symbols-outlined text-[16px]">view_sidebar</span>
              </div>
              <div>
                <h4 className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">左侧表配置</h4>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {tree.selectedLeftForDeleteCount > 0 ? (
                <button
                  onClick={tree.onDeleteLeftSelection}
                  className="inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1 text-[11px] font-semibold text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  删除 ({tree.selectedLeftForDeleteCount})
                </button>
              ) : null}
              <button
                onClick={tree.onAddLeftColumn}
                className={primaryActionButtonClass}
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                新增
              </button>
            </div>
          </div>
            <div
              className="min-h-0 flex-1 overflow-hidden outline-none"
              tabIndex={0}
              onPaste={tree.onPasteLeftColumns}
              style={{ backgroundColor: '#fcfdff' }}
            >
              <div className="px-3 pb-3 pt-2">
                {tree.builderLeftTableBuilderNode}
            </div>
          </div>
        </div>

        <div className="grid min-h-0 gap-0 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className={workspacePanelClass}>
            <div className={workspacePanelHeaderClass}>
              <div className="flex items-center gap-3">
                <div className={`${sectionIconClass} text-emerald-600`}>
                  <span className="material-symbols-outlined text-[16px]">table_rows</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">主表字段配置</h4>
                    {tree.isSingleTableSyncing ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        同步中
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button hidden
                  type="button"
                  onClick={tree.onOpenMainHiddenColumnsModal}
                  disabled={tree.mainTableHiddenColumnsCount === 0}
                  className={`${sectionActionButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <span className="material-symbols-outlined text-[14px]">view_column</span>
                  详细列 {tree.mainTableHiddenColumnsCount > 0 ? `(${tree.mainTableHiddenColumnsCount})` : ''}
                </button>
                {tree.selectedMainForDeleteCount > 0 ? (
                  <button
                    onClick={tree.onDeleteMainSelection}
                    className="inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1 text-[11px] font-semibold text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    删除 ({tree.selectedMainForDeleteCount})
                  </button>
                ) : null}
                <button
                  onClick={tree.onAddMainColumn}
                  className={primaryActionButtonClass}
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  新增
                </button>
              </div>
            </div>
            <div className="border-b border-slate-200 bg-white">
              <div
                className="cursor-pointer select-none border-t-[4px] border-[color:var(--workspace-accent)] px-6 py-5 text-center transition-colors hover:bg-[#f8fbff]"
                onDoubleClick={onToggleFullscreen}
                title="双击切换全屏"
              >
                <div className="text-[28px] font-bold tracking-[0.08em] text-slate-700">
                  {singleTableDesignTitle}
                </div>
              </div>
            </div>
            <DocumentGridToolbarBridge
              activeResize={tree.activeResize}
              autoFitColumnWidth={tree.autoFitColumnWidth}
              buildDocumentFilterRuntimeRules={tree.buildDocumentFilterRuntimeRules}
              columns={tree.mainTableColumns}
              title="主表字段配置"
              selectedCount={tree.selectedMainForDeleteCount}
              onDelete={tree.onDeleteMainSelection}
              onAdd={tree.onAddMainColumn}
              filterConfig={{
                fields: tree.mainFilterFields,
                selectedId: tree.selectedMainFilterId,
                selectedIds: tree.selectedMainFiltersForDelete,
                setSelectedIds: tree.setSelectedMainFiltersForDelete,
                setFields: tree.setMainFilterFields,
                scope: 'main',
                onActivate: tree.onActivateMainFilter,
                onAdd: tree.onAddMainFilter,
                onDelete: tree.onDeleteMainFilters,
              }}
              options={{
                hideActionBar: true,
                filterRuntimeRules: tree.mainDocumentFilterRuntimeRules,
              }}
              metrics={{
                filterControlWidth: tree.conditionPanelControlWidth,
                filterResizeMaxWidth: tree.conditionPanelResizeMaxWidth,
                filterResizeMinWidth: tree.conditionPanelResizeMinWidth,
              }}
              onSetBuilderSelectionContextMenu={tree.onSetBuilderSelectionContextMenu}
              renderFieldPreview={tree.renderFieldPreview}
              startResize={tree.startResize}
            />
            <div
              className="min-h-0 flex-1 overflow-hidden outline-none"
              tabIndex={0}
              onPaste={tree.onPasteMainColumns}
              style={{ backgroundColor: '#fcfdff' }}
            >
              {tree.builderMainTableBuilderNode}
            </div>
          </div>

          <div className={workspacePanelClass}>
            <div className={workspacePanelHeaderClass}>
              <div className="flex items-center gap-3">
                <div className={`${sectionIconClass} text-blue-600`}>
                  <span className="material-symbols-outlined text-[16px]">tab_group</span>
                </div>
                <div>
                  <h4 className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">明细页签配置</h4>
                  <p className="mt-0.5 text-[11px] text-slate-400">页签与填充方式集中在这里</p>
                </div>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-500 dark:bg-blue-500/10">明细页签</span>
            </div>
            <DetailTabsWorkspace
              activeTab={tree.activeTab}
              currentDetailFillType={tree.currentDetailFillType}
              detailTabs={tree.detailTabs}
              detailWebUrl={tree.detailWebUrl}
              isConfigFullscreenActive={isConfigFullscreenActive}
              isDetailViewSelected={tree.isDetailViewSelected}
              onActivateCurrentView={tree.onActivateCurrentDetailView}
              onActivateTab={tree.onActivateDetailTab}
              onAddTab={tree.onAddDetailTab}
              onDeleteSelectedColumns={tree.onDeleteSelectedDetailColumns}
              onAddField={tree.onAddDetailColumn}
              onPasteTableColumns={tree.onPasteDetailColumns}
              onOpenWebConfig={tree.onOpenDetailWebConfig}
              selectedDetailForDelete={tree.selectedDetailForDelete}
              tableBuilderNode={tree.builderDetailTableBuilderNode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
