import React from 'react';
import type {
  ModuleIntroBlockType,
  ModuleIntroEditorActions,
  ModuleIntroEditorRefs,
} from './module-intro-editor-step';
import { MenuInfoStep } from './menu-info-step';
import { ModuleIntroEditorStep } from './module-intro-editor-step';
import { ModulePreviewStep } from './module-preview-step';
import { ModuleTypeSelectionStep } from './module-type-selection-step';
import { SurveyPlanningStep } from './survey-planning-step';

export type BuildConfigWizardStepNodesInput = {
  activeConfigMenuId: string | null;
  activeConfigModuleKey: string;
  advancedFilledMenuFieldCount: number;
  businessType: 'document' | 'table' | 'tree';
  commonFilledMenuFieldCount: number;
  commonFuncs: string[];
  currentModuleCode: string;
  currentAdvancedMenuKeys: string[];
  currentAdvancedMenuSections: any[];
  currentMenuDraft: Record<string, string | boolean>;
  currentMenuFieldEntriesCount: number;
  currentMenuFieldMap: Map<string, any>;
  currentModuleGuideLabel: string;
  currentModuleName: string;
  currentPinnedMenuKeys: string[];
  currentPinnedMenuKeySet: Set<string>;
  currentCommonMenuSections: any[];
  filledMenuFieldCount: number;
  funcOptions: any[];
  isFullscreenEditor: boolean;
  isFuncPopoverOpen: boolean;
  isGenerating: boolean;
  isMenuInfoLoading: boolean;
  isMenuInfoSaving: boolean;
  menuConfigTableDesc: string;
  menuConfigTableName: string;
  menuInfoError: string | null;
  menuInfoTab: 'common' | 'advanced';
  moduleIntroActions: ModuleIntroEditorActions;
  moduleIntroBlockType: ModuleIntroBlockType;
  moduleIntroRefs: ModuleIntroEditorRefs;
  moduleIntroSelectedImageWidth: number | null;
  processDesignNode: React.ReactNode;
  moduleTypeOptions: any[];
  onBackToTypeSelect: () => void;
  onBusinessTypeChange: (value: 'document' | 'table' | 'tree') => void;
  onCloseFuncPopover: () => void;
  onGenerateSurveyPlan: (mode: string, dataSource?: string) => void;
  onMenuInfoTabChange: (tab: 'common' | 'advanced') => void;
  onResetSurveyFlow: () => void;
  onToggleFieldPinned: (fieldKey: string) => void;
  onToggleFunc: (value: string) => void;
  onToggleFuncPopover: () => void;
  onUpdateMenuDraft: (fieldKey: string, value: string | boolean) => void;
  previewTitle: string;
  surveyAnswers: string[];
  surveyError: string | null;
  surveyPlan: any;
  surveyPlanModel: string;
  surveyStep: number;
};

export function buildConfigWizardStepNodes(input: BuildConfigWizardStepNodesInput) {
  return {
    menuInfoNode: (
      <MenuInfoStep
        activeConfigModuleKey={input.activeConfigModuleKey}
        advancedFilledMenuFieldCount={input.advancedFilledMenuFieldCount}
        businessType={input.businessType}
        commonFilledMenuFieldCount={input.commonFilledMenuFieldCount}
        commonFuncs={input.commonFuncs}
        currentAdvancedMenuKeys={input.currentAdvancedMenuKeys}
        currentAdvancedMenuSections={input.currentAdvancedMenuSections}
        currentMenuDraft={input.currentMenuDraft}
        currentMenuFieldEntriesCount={input.currentMenuFieldEntriesCount}
        currentMenuFieldMap={input.currentMenuFieldMap}
        currentModuleGuideLabel={input.currentModuleGuideLabel}
        currentPinnedMenuKeys={input.currentPinnedMenuKeys}
        currentPinnedMenuKeySet={input.currentPinnedMenuKeySet}
        currentCommonMenuSections={input.currentCommonMenuSections}
        filledMenuFieldCount={input.filledMenuFieldCount}
        funcOptions={input.funcOptions}
        isEditingMenu={input.activeConfigMenuId !== null}
        isFuncPopoverOpen={input.isFuncPopoverOpen}
        isMenuInfoLoading={input.isMenuInfoLoading}
        isMenuInfoSaving={input.isMenuInfoSaving}
        menuConfigTableDesc={input.menuConfigTableDesc}
        menuConfigTableName={input.menuConfigTableName}
        menuInfoError={input.menuInfoError}
        menuInfoTab={input.menuInfoTab}
        onBackToTypeSelect={input.onBackToTypeSelect}
        onCloseFuncPopover={input.onCloseFuncPopover}
        onMenuInfoTabChange={input.onMenuInfoTabChange}
        onToggleFieldPinned={input.onToggleFieldPinned}
        onToggleFunc={input.onToggleFunc}
        onToggleFuncPopover={input.onToggleFuncPopover}
        onUpdateMenuDraft={input.onUpdateMenuDraft}
      />
    ),
    moduleIntroEditorNode: (
      <ModuleIntroEditorStep
        actions={input.moduleIntroActions}
        isFullscreenEditor={input.isFullscreenEditor}
        moduleIntroBlockType={input.moduleIntroBlockType}
        moduleIntroSelectedImageWidth={input.moduleIntroSelectedImageWidth}
        refs={input.moduleIntroRefs}
      />
    ),
    processDesignNode: input.processDesignNode,
    modulePreviewNode: (
      <ModulePreviewStep
        businessType={input.businessType}
        currentModuleCode={input.currentModuleCode}
        currentModuleName={input.currentModuleName}
        title={input.previewTitle}
      />
    ),
    moduleTypeSelectionNode: (
      <ModuleTypeSelectionStep
        businessType={input.businessType}
        menuConfigTableName={input.menuConfigTableName}
        onBusinessTypeChange={input.onBusinessTypeChange}
        options={input.moduleTypeOptions}
      />
    ),
    surveyPlanningNode: (
      <SurveyPlanningStep
        isGenerating={input.isGenerating}
        onGenerateSurveyPlan={input.onGenerateSurveyPlan}
        onResetSurveyFlow={input.onResetSurveyFlow}
        surveyAnswers={input.surveyAnswers}
        surveyError={input.surveyError}
        surveyPlan={input.surveyPlan}
        surveyPlanModel={input.surveyPlanModel}
        surveyStep={input.surveyStep}
      />
    ),
  };
}
