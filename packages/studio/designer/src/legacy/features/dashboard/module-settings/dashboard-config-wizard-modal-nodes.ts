import {
  buildConfigWizardModalNodes,
  type BuildConfigWizardModalNodesInput,
} from './config-wizard-modal-nodes';

type DashboardConfigWizardModalNodesInput = {
  chrome: Pick<
    BuildConfigWizardModalNodesInput,
    | 'activeConfigMenuId'
    | 'canGoBack'
    | 'completedSteps'
    | 'configStep'
    | 'configSteps'
    | 'isConfigFullscreenActive'
    | 'isMenuInfoLoading'
    | 'isMenuInfoSaving'
    | 'isModuleSettingStep'
    | 'modulePreviewStep'
    | 'processDesignStep'
    | 'moduleSettingStep'
    | 'nextDisabled'
    | 'nextLabel'
    | 'restrictionStep'
    | 'saveDisabled'
    | 'saveLabel'
    | 'showFullscreenToggle'
  >;
  actions: Pick<
    BuildConfigWizardModalNodesInput,
    | 'handleConfigNext'
    | 'handleConfigPrevious'
    | 'handleConfigStepSelect'
    | 'handleLockedTypeStepSelect'
    | 'onClose'
    | 'onSave'
    | 'onToggleFullscreen'
  >;
  overlays: Pick<
    BuildConfigWizardModalNodesInput,
    | 'archiveLayoutCanvasNode'
    | 'builderSelectionContextMenuNode'
    | 'detailBoardPreviewNode'
    | 'longTextEditorNode'
    | 'mainHiddenColumnsModalNode'
    | 'previewContextMenuNode'
  >;
  stepNodes: Pick<
    BuildConfigWizardModalNodesInput,
    | 'menuInfoNode'
    | 'moduleIntroEditorNode'
    | 'modulePreviewNode'
    | 'processDesignNode'
    | 'moduleSettingNode'
    | 'moduleTypeSelectionNode'
    | 'restrictionNode'
    | 'surveyPlanningNode'
  >;
};

export function buildDashboardConfigWizardModalNodes(
  input: DashboardConfigWizardModalNodesInput,
) {
  return buildConfigWizardModalNodes({
    ...input.chrome,
    ...input.actions,
    ...input.overlays,
    ...input.stepNodes,
  });
}
