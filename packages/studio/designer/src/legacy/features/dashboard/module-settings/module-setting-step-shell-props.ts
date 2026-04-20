import type React from 'react';
import type { ModuleSettingStepShellProps } from './module-setting-step-shell';
import type { GridOperationActionKey } from './grid-operation-config';

export type BuildModuleSettingStepShellPropsInput = {
  activeResize: any;
  activeTab: string;
  addTab: () => void;
  archiveMainTableBuilderNode: React.ReactNode;
  autoFitColumnWidth: (...args: any[]) => void;
  billDocumentWorkbenchNode: React.ReactNode;
  buildColumn: (prefix: string, index: number, overrides?: Record<string, any>) => any;
  buildConditionField: (index: number) => any;
  buildDocumentFilterRuntimeRules: (fields: any[], activeResize: any) => string;
  builderDetailTableBuilderNode: React.ReactNode;
  builderLeftTableBuilderNode: React.ReactNode;
  builderMainTableBuilderNode: React.ReactNode;
  businessType: ModuleSettingStepShellProps['businessType'];
  columnOperationPanel: React.ReactNode;
  conditionPanelControlWidth: number;
  conditionPanelResizeMaxWidth: number;
  conditionPanelResizeMinWidth: number;
  conditionToolbarNode: React.ReactNode;
  currentModuleName: ModuleSettingStepShellProps['currentModuleName'];
  currentDetailFillType: string;
  currentDetailFillTypeValue: string;
  deleteSelectedColumns: (scope: 'left' | 'main' | 'detail', ids: string[]) => void;
  deleteSelectedConditions: (scope: 'left' | 'main' | 'detail', ids: string[]) => void;
  deleteTab: (tabId: string, event: React.MouseEvent) => void;
  detailTabs: any[];
  detailWebUrl: string;
  documentDetailTableBuilderNode: React.ReactNode;
  documentLeftPaneWidth: number;
  documentTreeTableBuilderNode: React.ReactNode;
  handlePasteColumns: (event: React.ClipboardEvent<HTMLDivElement>, setter: any) => void;
  inspectorPaneWidth: number;
  isConfigFullscreenActive: boolean;
  isDetailFillSelected: boolean;
  isDetailViewSelected: boolean;
  isSingleTableSyncing: boolean;
  isTreePaneVisible: boolean;
  detailGridActionConfig: Record<string, any> | null;
  mainDocumentFilterRuntimeRules?: string;
  mainFilterFields: any[];
  mainGridActionConfig: Record<string, any>;
  mainTableColumns: any[];
  mainTableHiddenColumnsCount: number;
  moduleSettingStageHeightClass: string;
  moduleSettingStageStyle: React.CSSProperties;
  onActivateCondition: (scope: 'main', id: string) => void;
  onActivateDetailTab: (tabId: string) => void;
  onActivateTableConfig: (scope: 'detail', targetId?: string | null) => void;
  onOpenMainHiddenColumnsModal: () => void;
  onToggleFullscreen: () => void;
  onSelectDetailGridAction: (actionKey: GridOperationActionKey) => void;
  onSelectMainGridAction: (actionKey: GridOperationActionKey) => void;
  onStartDocumentLeftResize: (event: React.MouseEvent<HTMLDivElement>) => void;
  renderFieldPreview: ModuleSettingStepShellProps['tree']['renderFieldPreview'];
  selectedDetailGridAction: GridOperationActionKey | null;
  selectedDetailForDelete: string[];
  selectedLeftForDelete: string[];
  selectedMainFilterId: string | null;
  selectedMainFiltersForDelete: string[];
  selectedMainGridAction: GridOperationActionKey | null;
  selectedMainForDelete: string[];
  setBuilderSelectionContextMenu: (menu: any) => void;
  setDetailTableColumns: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  setInspectorPanelTab: React.Dispatch<React.SetStateAction<string>>;
  setLeftTableColumns: React.Dispatch<React.SetStateAction<any[]>>;
  setMainFilterFields: React.Dispatch<React.SetStateAction<any[]>>;
  setMainTableColumns: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedArchiveNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedMainFiltersForDelete: React.Dispatch<React.SetStateAction<string[]>>;
  startResize: (...args: any[]) => void;
  treeRelationColumn: any;
  workspaceTheme: string;
  workspaceThemeStyles: ModuleSettingStepShellProps['workspaceThemeStyles'];
  workspaceThemeVars: React.CSSProperties;
  showDetailGridActionBar: boolean;
};

function getPastedText(event: React.ClipboardEvent<HTMLDivElement>) {
  return event.clipboardData.getData('text');
}

function parsePastedColumnNames(text: string) {
  return text.split(/[\t\n]/).map((item) => item.trim()).filter(Boolean);
}

export function buildModuleSettingStepShellProps(
  input: BuildModuleSettingStepShellPropsInput,
): ModuleSettingStepShellProps {
  return {
    billDocumentWorkbenchNode: input.billDocumentWorkbenchNode,
    businessType: input.businessType,
    columnOperationPanel: input.columnOperationPanel,
    currentModuleName: input.currentModuleName,
    inspectorPaneWidth: input.inspectorPaneWidth,
    isConfigFullscreenActive: input.isConfigFullscreenActive,
    moduleSettingStageHeightClass: input.moduleSettingStageHeightClass,
    moduleSettingStageStyle: input.moduleSettingStageStyle,
    onToggleFullscreen: input.onToggleFullscreen,
    workspaceTheme: input.workspaceTheme,
    workspaceThemeStyles: input.workspaceThemeStyles,
    document: {
      activeTab: input.activeTab,
      archiveMainTableBuilderNode: input.archiveMainTableBuilderNode,
      conditionToolbarNode: input.conditionToolbarNode,
      currentDetailFillType: input.currentDetailFillType,
      detailGridActionConfig: input.detailGridActionConfig,
      detailTabs: input.detailTabs,
      documentDetailTableBuilderNode: input.documentDetailTableBuilderNode,
      documentLeftPaneWidth: input.documentLeftPaneWidth,
      documentTreeTableBuilderNode: input.documentTreeTableBuilderNode,
      isDetailFillSelected: input.isDetailFillSelected,
      isTreePaneVisible: input.isTreePaneVisible,
      mainGridActionConfig: input.mainGridActionConfig,
      mainTableHiddenColumnsCount: input.mainTableHiddenColumnsCount,
      onActivateDetailFill: () => {
        input.setSelectedArchiveNodeId(`detail-${input.activeTab}`);
        input.setInspectorPanelTab('common');
        input.onActivateTableConfig('detail', input.currentDetailFillTypeValue);
      },
      onActivateDetailTab: input.onActivateDetailTab,
      onAddDetailTab: input.addTab,
      onDeleteDetailTab: input.deleteTab,
      onOpenMainHiddenColumnsModal: input.onOpenMainHiddenColumnsModal,
      onPasteDetailTableColumns: (event) => {
        const text = getPastedText(event);
        if (!text) return;
        const newColNames = parsePastedColumnNames(text);
        if (newColNames.length === 0) return;

        event.preventDefault();
        input.setDetailTableColumns((prev) => {
          const currentCols = prev[input.activeTab] || [];
          const newCols = newColNames.map((name, index) => input.buildColumn('d_col', currentCols.length + index + 1, { name }));
          return {
            ...prev,
            [input.activeTab]: [...currentCols, ...newCols],
          };
        });
      },
      onPasteMainTable: (event) => input.handlePasteColumns(event, input.setMainTableColumns),
      onPasteTreePanel: (event) => input.handlePasteColumns(event, input.setLeftTableColumns),
      onSelectDetailGridAction: input.onSelectDetailGridAction,
      onSelectMainGridAction: input.onSelectMainGridAction,
      onStartLeftResize: input.onStartDocumentLeftResize,
      selectedDetailGridAction: input.selectedDetailGridAction,
      selectedMainGridAction: input.selectedMainGridAction,
      showDetailGridActionBar: input.showDetailGridActionBar,
      treeRelationColumn: input.treeRelationColumn,
      workspaceThemeVars: input.workspaceThemeVars,
    },
    tree: {
      activeResize: input.activeResize,
      activeTab: input.activeTab,
      autoFitColumnWidth: input.autoFitColumnWidth,
      buildDocumentFilterRuntimeRules: input.buildDocumentFilterRuntimeRules,
      builderDetailTableBuilderNode: input.builderDetailTableBuilderNode,
      builderLeftTableBuilderNode: input.builderLeftTableBuilderNode,
      builderMainTableBuilderNode: input.builderMainTableBuilderNode,
      conditionPanelControlWidth: input.conditionPanelControlWidth,
      conditionPanelResizeMaxWidth: input.conditionPanelResizeMaxWidth,
      conditionPanelResizeMinWidth: input.conditionPanelResizeMinWidth,
      currentDetailFillType: input.currentDetailFillType,
      detailTabs: input.detailTabs,
      detailWebUrl: input.detailWebUrl,
      isDetailViewSelected: input.isDetailViewSelected,
      isSingleTableSyncing: input.isSingleTableSyncing,
      mainDocumentFilterRuntimeRules: input.mainDocumentFilterRuntimeRules,
      mainFilterFields: input.mainFilterFields,
      mainTableColumns: input.mainTableColumns,
      mainTableHiddenColumnsCount: input.mainTableHiddenColumnsCount,
      onActivateCurrentDetailView: () => {
        input.setSelectedArchiveNodeId(`detail-${input.activeTab}`);
        input.setInspectorPanelTab('common');
        input.onActivateTableConfig('detail', input.currentDetailFillTypeValue);
      },
      onActivateDetailTab: input.onActivateDetailTab,
      onActivateMainFilter: (id) => {
        input.setSelectedArchiveNodeId('archive-filter');
        input.onActivateCondition('main', id);
      },
      onAddDetailColumn: () => input.setDetailTableColumns((prev) => ({
        ...prev,
        [input.activeTab]: [
          ...(prev[input.activeTab] || []),
          { id: `d_col_${Date.now()}`, name: `字段 ${(prev[input.activeTab] || []).length + 1}`, type: '文本', width: 120 },
        ],
      })),
      onAddDetailTab: input.addTab,
      onAddLeftColumn: () => input.setLeftTableColumns((prev) => [...prev, { id: `l_col_${Date.now()}`, name: `字段 ${prev.length + 1}`, type: '文本', width: 120 }]),
      onAddMainColumn: () => input.setMainTableColumns((prev) => [...prev, input.buildColumn('m_col', prev.length + 1)]),
      onAddMainFilter: () => {
        const next = input.buildConditionField(input.mainFilterFields.length + 1);
        input.setMainFilterFields((prev) => [...prev, next]);
        input.setSelectedMainFiltersForDelete([next.id]);
        input.setSelectedArchiveNodeId('archive-filter');
        input.onActivateCondition('main', next.id);
      },
      onDeleteDetailTab: input.deleteTab,
      onDeleteLeftSelection: () => input.deleteSelectedColumns('left', input.selectedLeftForDelete),
      onDeleteMainFilters: () => input.deleteSelectedConditions('main', input.selectedMainFiltersForDelete),
      onDeleteMainSelection: () => input.deleteSelectedColumns('main', input.selectedMainForDelete),
      onDeleteSelectedDetailColumns: () => input.deleteSelectedColumns('detail', input.selectedDetailForDelete),
      onOpenDetailWebConfig: () => {
        input.setSelectedArchiveNodeId(`detail-${input.activeTab}`);
        input.setInspectorPanelTab('common');
        input.onActivateTableConfig('detail', '网页');
      },
      onOpenMainHiddenColumnsModal: input.onOpenMainHiddenColumnsModal,
      onPasteDetailColumns: (event) => {
        const text = getPastedText(event);
        if (!text) return;
        const newColNames = parsePastedColumnNames(text);
        if (newColNames.length === 0) return;

        event.preventDefault();
        const newCols = newColNames.map((name, index) => ({
          id: `d_col_${Date.now()}_${index}`,
          name,
          type: '文本',
          width: 100,
        }));
        input.setDetailTableColumns((prev) => ({
          ...prev,
          [input.activeTab]: [...(prev[input.activeTab] || []), ...newCols],
        }));
      },
      onPasteLeftColumns: (event) => input.handlePasteColumns(event, input.setLeftTableColumns),
      onPasteMainColumns: (event) => input.handlePasteColumns(event, input.setMainTableColumns),
      onSetBuilderSelectionContextMenu: input.setBuilderSelectionContextMenu,
      renderFieldPreview: input.renderFieldPreview,
      selectedDetailForDelete: input.selectedDetailForDelete,
      selectedLeftForDeleteCount: input.selectedLeftForDelete.length,
      selectedMainFilterId: input.selectedMainFilterId,
      selectedMainFiltersForDelete: input.selectedMainFiltersForDelete,
      selectedMainForDeleteCount: input.selectedMainForDelete.length,
      setMainFilterFields: input.setMainFilterFields,
      setSelectedMainFiltersForDelete: input.setSelectedMainFiltersForDelete,
      startResize: input.startResize,
    },
  };
}
