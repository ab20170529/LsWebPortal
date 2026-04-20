import type { useDashboardTableBuilderRuntime } from './use-dashboard-table-builder-runtime';

type DashboardTableBuilderRuntimeConfig = Parameters<typeof useDashboardTableBuilderRuntime>[0];

type DashboardTableBuilderRuntimeBuilderConfig = {
  actions: {
    activateColumnSelection: DashboardTableBuilderRuntimeConfig['runtime']['activateColumnSelection'];
    activateTableConfigSelection: DashboardTableBuilderRuntimeConfig['bridge']['options']['activateTableConfigSelection'];
    autoFitColumnWidth: DashboardTableBuilderRuntimeConfig['runtime']['autoFitColumnWidth'];
    openDetailBoardPreview: DashboardTableBuilderRuntimeConfig['bridge']['options']['openDetailBoardPreview'];
    setBuilderSelectionContextMenu: DashboardTableBuilderRuntimeConfig['runtime']['setBuilderSelectionContextMenu'];
    setDetailTableColumns: DashboardTableBuilderRuntimeConfig['bridge']['options']['setDetailTableColumns'];
    setSelectedArchiveNodeId: DashboardTableBuilderRuntimeConfig['bridge']['options']['setSelectedArchiveNodeId'];
    setSelectedDetailForDelete: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['documentDetail']['setSelectedForDelete'];
    setSelectedLeftForDelete: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['documentTree']['setSelectedForDelete'];
    setSelectedMainForDelete: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['archiveMain']['setSelectedForDelete'];
    startResize: DashboardTableBuilderRuntimeConfig['runtime']['startResize'];
  };
  columns: {
    billDetailColumns: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['billDetail']['cols'];
    detailTableColumns: DashboardTableBuilderRuntimeConfig['bridge']['options']['detailTableColumns'];
    detailTableConfigs: DashboardTableBuilderRuntimeConfig['bridge']['options']['detailTableConfigs'];
    leftTableColumns: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['documentTree']['cols'];
    mainRenderableColumns: DashboardTableBuilderRuntimeConfig['bridge']['options']['mainRenderableColumns'];
    mainTableColumns: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['archiveMain']['cols'];
    mainTableConfig: DashboardTableBuilderRuntimeConfig['bridge']['options']['mainTableConfig'];
  };
  helpers: DashboardTableBuilderRuntimeConfig['helpers'];
  metrics: DashboardTableBuilderRuntimeConfig['metrics'];
  selection: {
    inspectorTargetId: DashboardTableBuilderRuntimeConfig['bridge']['options']['inspectorTargetId'];
    selectedDetailColId: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['documentDetail']['selectedId'];
    selectedDetailForDelete: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['documentDetail']['selectedForDelete'];
    selectedLeftColId: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['documentTree']['selectedId'];
    selectedLeftForDelete: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['documentTree']['selectedForDelete'];
    selectedMainColId: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['archiveMain']['selectedId'];
    selectedMainForDelete: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['archiveMain']['selectedForDelete'];
    selectedTableConfigScope: DashboardTableBuilderRuntimeConfig['bridge']['options']['selectedTableConfigScope'];
  };
  setters: {
    setBillDetailColumns: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['billDetail']['setCols'];
    setLeftTableColumns: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['documentTree']['setCols'];
    setMainTableColumns: DashboardTableBuilderRuntimeConfig['bridge']['nodes']['archiveMain']['setCols'];
  };
  state: {
    activeResize: DashboardTableBuilderRuntimeConfig['runtime']['activeResize'];
    activeTab: DashboardTableBuilderRuntimeConfig['bridge']['options']['activeTab'];
    businessType: DashboardTableBuilderRuntimeConfig['runtime']['businessType'];
    detailTabsLength: number;
    isCompactModuleSetting: DashboardTableBuilderRuntimeConfig['runtime']['isCompactModuleSetting'];
    mainDetailBoardEnabled: DashboardTableBuilderRuntimeConfig['bridge']['options']['mainDetailBoardEnabled'];
    mainDetailBoardGroupsLength: DashboardTableBuilderRuntimeConfig['bridge']['options']['mainDetailBoardGroupsLength'];
    normalizedMainDetailBoardConfig: DashboardTableBuilderRuntimeConfig['bridge']['options']['normalizedMainDetailBoardConfig'];
    showDetailGridActionBar: boolean;
    workspaceTheme: DashboardTableBuilderRuntimeConfig['runtime']['workspaceTheme'];
    workspaceThemeVars: DashboardTableBuilderRuntimeConfig['runtime']['workspaceThemeVars'];
  };
};

export function buildDashboardTableBuilderRuntimeBuilderConfig({
  actions,
  columns,
  helpers,
  metrics,
  selection,
  setters,
  state,
}: DashboardTableBuilderRuntimeBuilderConfig): DashboardTableBuilderRuntimeConfig {
  return {
    runtime: {
      activeResize: state.activeResize,
      workspaceTheme: state.workspaceTheme,
      workspaceThemeVars: state.workspaceThemeVars,
      isCompactModuleSetting: state.isCompactModuleSetting,
      businessType: state.businessType,
      activateColumnSelection: actions.activateColumnSelection,
      setBuilderSelectionContextMenu: actions.setBuilderSelectionContextMenu,
      startResize: actions.startResize,
      autoFitColumnWidth: actions.autoFitColumnWidth,
    },
    helpers,
    metrics,
    bridge: {
      options: {
        activeTab: state.activeTab,
        activateTableConfigSelection: actions.activateTableConfigSelection,
        detailTableColumns: columns.detailTableColumns,
        detailTableConfigs: columns.detailTableConfigs,
        detailTabsLength: state.detailTabsLength,
        inspectorTargetId: selection.inspectorTargetId,
        mainDetailBoardEnabled: state.mainDetailBoardEnabled,
        mainDetailBoardGroupsLength: state.mainDetailBoardGroupsLength,
        mainRenderableColumns: columns.mainRenderableColumns,
        mainTableConfig: columns.mainTableConfig,
        normalizedMainDetailBoardConfig: state.normalizedMainDetailBoardConfig,
        openDetailBoardPreview: actions.openDetailBoardPreview,
        selectedTableConfigScope: selection.selectedTableConfigScope,
        setDetailTableColumns: actions.setDetailTableColumns,
        setSelectedArchiveNodeId: actions.setSelectedArchiveNodeId,
        showDetailGridActionBar: state.showDetailGridActionBar,
      },
      nodes: {
        archiveMain: {
          cols: columns.mainTableColumns,
          setCols: setters.setMainTableColumns,
          selectedId: selection.selectedMainColId,
          selectedForDelete: selection.selectedMainForDelete,
          setSelectedForDelete: actions.setSelectedMainForDelete,
        },
        documentTree: {
          cols: columns.leftTableColumns,
          setCols: setters.setLeftTableColumns,
          selectedId: selection.selectedLeftColId,
          selectedForDelete: selection.selectedLeftForDelete,
          setSelectedForDelete: actions.setSelectedLeftForDelete,
        },
        builderLeft: {
          cols: columns.leftTableColumns,
          setCols: setters.setLeftTableColumns,
          selectedId: selection.selectedLeftColId,
          selectedForDelete: selection.selectedLeftForDelete,
          setSelectedForDelete: actions.setSelectedLeftForDelete,
        },
        builderMain: {
          cols: columns.mainTableColumns,
          setCols: setters.setMainTableColumns,
          selectedId: selection.selectedMainColId,
          selectedForDelete: selection.selectedMainForDelete,
          setSelectedForDelete: actions.setSelectedMainForDelete,
        },
        documentDetail: {
          selectedId: selection.selectedDetailColId,
          selectedForDelete: selection.selectedDetailForDelete,
          setSelectedForDelete: actions.setSelectedDetailForDelete,
        },
        builderDetail: {
          selectedId: selection.selectedDetailColId,
          selectedForDelete: selection.selectedDetailForDelete,
          setSelectedForDelete: actions.setSelectedDetailForDelete,
        },
        billDetail: {
          cols: columns.billDetailColumns,
          setCols: setters.setBillDetailColumns,
          selectedId: selection.selectedDetailColId,
          selectedForDelete: selection.selectedDetailForDelete,
          setSelectedForDelete: actions.setSelectedDetailForDelete,
        },
      },
    },
  };
}
