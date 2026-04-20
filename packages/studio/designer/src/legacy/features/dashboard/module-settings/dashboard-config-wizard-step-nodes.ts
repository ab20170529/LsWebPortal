import { buildConfigWizardStepNodes, type BuildConfigWizardStepNodesInput } from './config-wizard-step-nodes';

type DashboardConfigWizardStepNodesInput = {
  menuInfo: Pick<
    BuildConfigWizardStepNodesInput,
    | 'activeConfigMenuId'
    | 'activeConfigModuleKey'
    | 'advancedFilledMenuFieldCount'
    | 'businessType'
    | 'commonFilledMenuFieldCount'
    | 'commonFuncs'
    | 'currentModuleCode'
    | 'currentAdvancedMenuKeys'
    | 'currentAdvancedMenuSections'
    | 'currentMenuDraft'
    | 'currentMenuFieldEntriesCount'
    | 'currentMenuFieldMap'
    | 'currentModuleGuideLabel'
    | 'currentModuleName'
    | 'currentPinnedMenuKeys'
    | 'currentPinnedMenuKeySet'
    | 'currentCommonMenuSections'
    | 'filledMenuFieldCount'
    | 'funcOptions'
    | 'isFuncPopoverOpen'
    | 'isMenuInfoLoading'
    | 'isMenuInfoSaving'
    | 'menuConfigTableDesc'
    | 'menuConfigTableName'
    | 'menuInfoError'
    | 'menuInfoTab'
    | 'onBackToTypeSelect'
    | 'onCloseFuncPopover'
    | 'onMenuInfoTabChange'
    | 'onToggleFieldPinned'
    | 'onToggleFunc'
    | 'onToggleFuncPopover'
    | 'onUpdateMenuDraft'
  >;
  moduleIntro: Pick<
    BuildConfigWizardStepNodesInput,
    | 'isFullscreenEditor'
    | 'moduleIntroActions'
    | 'moduleIntroBlockType'
    | 'moduleIntroRefs'
    | 'moduleIntroSelectedImageWidth'
  >;
  processDesign: Pick<BuildConfigWizardStepNodesInput, 'processDesignNode'>;
  preview: Pick<BuildConfigWizardStepNodesInput, 'previewTitle'>;
  survey: Pick<
    BuildConfigWizardStepNodesInput,
    | 'isGenerating'
    | 'onGenerateSurveyPlan'
    | 'onResetSurveyFlow'
    | 'surveyAnswers'
    | 'surveyError'
    | 'surveyPlan'
    | 'surveyPlanModel'
    | 'surveyStep'
  >;
  typeSelection: Pick<
    BuildConfigWizardStepNodesInput,
    | 'businessType'
    | 'menuConfigTableName'
    | 'onBusinessTypeChange'
  > & {
    moduleGuideProfiles: Record<string, Record<string, any>>;
    moduleTypeOptions: Array<Record<string, any>>;
  };
};

export function buildDashboardConfigWizardStepNodes(
  input: DashboardConfigWizardStepNodesInput,
) {
  const moduleTypeOptions = input.typeSelection.moduleTypeOptions.map((option) => ({
    ...option,
    ...(input.typeSelection.moduleGuideProfiles[option.value] ?? {}),
  }));

  return buildConfigWizardStepNodes({
    ...input.menuInfo,
    ...input.moduleIntro,
    ...input.processDesign,
    ...input.preview,
    ...input.survey,
    businessType: input.typeSelection.businessType,
    menuConfigTableName: input.typeSelection.menuConfigTableName,
    moduleTypeOptions,
    onBusinessTypeChange: input.typeSelection.onBusinessTypeChange,
  });
}
