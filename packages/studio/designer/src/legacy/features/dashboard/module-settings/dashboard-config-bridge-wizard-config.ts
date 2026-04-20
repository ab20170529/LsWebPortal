import { buildDashboardConfigBridgeWizardInput } from './dashboard-config-bridge-wizard-input';

type DashboardConfigBridgeWizardConfig = Parameters<typeof buildDashboardConfigBridgeWizardInput>[0];

export function buildDashboardConfigBridgeWizardConfig({
  activeConfigMenuId,
  hasActiveConfigMenu,
  canGoBack,
  completedSteps,
  configStep,
  configSteps,
  handleConfigNext,
  handleConfigPageSave,
  handleConfigPrevious,
  handleConfigStepSelect,
  handleLockedTypeStepSelect,
  isConfigFullscreenActive,
  isMenuInfoBuilt,
  isMenuInfoLoading,
  isMenuInfoSaving,
  isModuleSettingStep,
  isRestrictionTabSaving,
  isSingleTableModuleEnsuring,
  isSingleTableModuleSettingsSaving,
  menuInfoNode,
  moduleIntroEditorNode,
  modulePreviewNode,
  modulePreviewStep,
  moduleSettingStep,
  nextLabel,
  onClose,
  onToggleFullscreen,
  processDesignNode,
  processDesignStep,
  restrictionStep,
  saveLabel,
  surveyPlanningNode,
  moduleTypeSelectionNode,
}: {
  activeConfigMenuId: DashboardConfigBridgeWizardConfig['chromeState']['activeConfigMenuId'];
  hasActiveConfigMenu: boolean;
  canGoBack: DashboardConfigBridgeWizardConfig['chromeState']['canGoBack'];
  completedSteps: DashboardConfigBridgeWizardConfig['chromeState']['completedSteps'];
  configStep: DashboardConfigBridgeWizardConfig['chromeState']['configStep'];
  configSteps: DashboardConfigBridgeWizardConfig['chromeState']['configSteps'];
  handleConfigNext: DashboardConfigBridgeWizardConfig['actions']['handleConfigNext'];
  handleConfigPageSave: () => Promise<void>;
  handleConfigPrevious: DashboardConfigBridgeWizardConfig['actions']['handleConfigPrevious'];
  handleConfigStepSelect: DashboardConfigBridgeWizardConfig['actions']['handleConfigStepSelect'];
  handleLockedTypeStepSelect: DashboardConfigBridgeWizardConfig['actions']['handleLockedTypeStepSelect'];
  isConfigFullscreenActive: DashboardConfigBridgeWizardConfig['chromeState']['isConfigFullscreenActive'];
  isMenuInfoBuilt: boolean;
  isMenuInfoLoading: DashboardConfigBridgeWizardConfig['chromeState']['isMenuInfoLoading'];
  isMenuInfoSaving: DashboardConfigBridgeWizardConfig['chromeState']['isMenuInfoSaving'];
  isModuleSettingStep: DashboardConfigBridgeWizardConfig['chromeState']['isModuleSettingStep'];
  isRestrictionTabSaving: boolean;
  isSingleTableModuleEnsuring: boolean;
  isSingleTableModuleSettingsSaving: boolean;
  menuInfoNode: DashboardConfigBridgeWizardConfig['stepNodes']['menuInfoNode'];
  moduleIntroEditorNode: DashboardConfigBridgeWizardConfig['stepNodes']['moduleIntroEditorNode'];
  modulePreviewNode: DashboardConfigBridgeWizardConfig['stepNodes']['modulePreviewNode'];
  modulePreviewStep: DashboardConfigBridgeWizardConfig['chromeState']['modulePreviewStep'];
  moduleSettingStep: DashboardConfigBridgeWizardConfig['chromeState']['moduleSettingStep'];
  nextLabel: DashboardConfigBridgeWizardConfig['chromeState']['nextLabel'];
  onClose: DashboardConfigBridgeWizardConfig['actions']['onClose'];
  onToggleFullscreen: DashboardConfigBridgeWizardConfig['actions']['onToggleFullscreen'];
  processDesignNode: DashboardConfigBridgeWizardConfig['stepNodes']['processDesignNode'];
  processDesignStep: DashboardConfigBridgeWizardConfig['chromeState']['processDesignStep'];
  restrictionStep: DashboardConfigBridgeWizardConfig['chromeState']['restrictionStep'];
  saveLabel: DashboardConfigBridgeWizardConfig['chromeState']['saveLabel'];
  surveyPlanningNode: DashboardConfigBridgeWizardConfig['stepNodes']['surveyPlanningNode'];
  moduleTypeSelectionNode: DashboardConfigBridgeWizardConfig['stepNodes']['moduleTypeSelectionNode'];
}): DashboardConfigBridgeWizardConfig {
  return {
    chromeState: {
      activeConfigMenuId,
      canGoBack,
      completedSteps,
      configStep,
      configSteps,
      isConfigFullscreenActive,
      isMenuInfoLoading,
      isMenuInfoSaving,
      isModuleSettingStep,
      modulePreviewStep,
      processDesignStep,
      moduleSettingStep,
      nextDisabled: (configStep === 2 && (isMenuInfoLoading || isMenuInfoSaving || !hasActiveConfigMenu))
        || (configStep + 1 >= moduleSettingStep && !isMenuInfoBuilt)
        || (configStep === moduleSettingStep && (isSingleTableModuleEnsuring || isSingleTableModuleSettingsSaving))
        || ((configStep === restrictionStep || configStep === processDesignStep) && isRestrictionTabSaving),
      nextLabel,
      restrictionStep,
      saveDisabled: (configStep === 2 && (isMenuInfoLoading || isMenuInfoSaving))
        || (configStep === moduleSettingStep && (isSingleTableModuleEnsuring || isSingleTableModuleSettingsSaving))
        || ((configStep === restrictionStep || configStep === processDesignStep) && isRestrictionTabSaving),
      saveLabel,
      showFullscreenToggle: configStep === moduleSettingStep
        || configStep === restrictionStep
        || configStep === processDesignStep
        || configStep === modulePreviewStep,
    },
    actions: {
      handleConfigNext,
      handleConfigPrevious,
      handleConfigStepSelect,
      handleLockedTypeStepSelect,
      onClose,
      onSave: () => {
        void handleConfigPageSave();
      },
      onToggleFullscreen,
    },
    stepNodes: {
      menuInfoNode,
      moduleIntroEditorNode,
      modulePreviewNode,
      processDesignNode,
      moduleTypeSelectionNode,
      surveyPlanningNode,
    },
  };
}
