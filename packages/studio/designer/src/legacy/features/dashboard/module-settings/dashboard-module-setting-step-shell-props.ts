import { buildModuleSettingStepShellProps } from './module-setting-step-shell-props';
import type { BuildModuleSettingStepShellPropsInput } from './module-setting-step-shell-props';

type BuildDashboardModuleSettingStepShellPropsInput = {
  common: Pick<
    BuildModuleSettingStepShellPropsInput,
    | 'activeResize'
    | 'activeTab'
    | 'addTab'
    | 'archiveMainTableBuilderNode'
    | 'billDocumentWorkbenchNode'
    | 'businessType'
    | 'columnOperationPanel'
    | 'conditionToolbarNode'
    | 'currentModuleName'
    | 'currentDetailFillType'
    | 'currentDetailFillTypeValue'
    | 'detailTabs'
    | 'detailWebUrl'
    | 'inspectorPaneWidth'
    | 'isConfigFullscreenActive'
    | 'isTreePaneVisible'
    | 'moduleSettingStageHeightClass'
    | 'moduleSettingStageStyle'
    | 'onActivateDetailTab'
    | 'onActivateTableConfig'
    | 'onOpenMainHiddenColumnsModal'
    | 'onToggleFullscreen'
    | 'renderFieldPreview'
    | 'setBuilderSelectionContextMenu'
    | 'setInspectorPanelTab'
    | 'setSelectedArchiveNodeId'
    | 'treeRelationColumn'
    | 'workspaceTheme'
    | 'workspaceThemeStyles'
    | 'workspaceThemeVars'
  >;
  document: Pick<
    BuildModuleSettingStepShellPropsInput,
    | 'detailGridActionConfig'
    | 'documentDetailTableBuilderNode'
    | 'documentLeftPaneWidth'
    | 'documentTreeTableBuilderNode'
    | 'handlePasteColumns'
    | 'mainGridActionConfig'
    | 'mainTableHiddenColumnsCount'
    | 'onSelectDetailGridAction'
    | 'onSelectMainGridAction'
    | 'onStartDocumentLeftResize'
    | 'selectedDetailGridAction'
    | 'selectedMainGridAction'
    | 'setDetailTableColumns'
    | 'setLeftTableColumns'
    | 'setMainTableColumns'
    | 'showDetailGridActionBar'
  >;
  tree: Pick<
    BuildModuleSettingStepShellPropsInput,
    | 'autoFitColumnWidth'
    | 'buildColumn'
    | 'buildConditionField'
    | 'buildDocumentFilterRuntimeRules'
    | 'builderDetailTableBuilderNode'
    | 'builderLeftTableBuilderNode'
    | 'builderMainTableBuilderNode'
    | 'conditionPanelControlWidth'
    | 'conditionPanelResizeMaxWidth'
    | 'conditionPanelResizeMinWidth'
    | 'deleteSelectedColumns'
    | 'deleteSelectedConditions'
    | 'deleteTab'
    | 'onActivateCondition'
    | 'isDetailFillSelected'
    | 'isDetailViewSelected'
    | 'isSingleTableSyncing'
    | 'mainDocumentFilterRuntimeRules'
    | 'mainFilterFields'
    | 'mainTableColumns'
    | 'selectedDetailForDelete'
    | 'selectedLeftForDelete'
    | 'selectedMainFilterId'
    | 'selectedMainFiltersForDelete'
    | 'selectedMainForDelete'
    | 'setMainFilterFields'
    | 'setSelectedMainFiltersForDelete'
    | 'startResize'
  >;
};

export function buildDashboardModuleSettingStepShellProps(
  input: BuildDashboardModuleSettingStepShellPropsInput,
) {
  return buildModuleSettingStepShellProps({
    ...input.common,
    ...input.document,
    ...input.tree,
  });
}
