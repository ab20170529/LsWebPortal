import React from 'react';
import { motion } from 'framer-motion';
import { ConfigWizardFooter, ConfigWizardSidebar, type ConfigWizardStepItem } from './config-wizard-chrome';
import { ConfigWizardStepContent } from './config-wizard-step-content';

export type BuildConfigWizardModalNodesInput = {
  activeConfigMenuId: string | null;
  archiveLayoutCanvasNode: React.ReactNode;
  builderSelectionContextMenuNode: React.ReactNode;
  canGoBack: boolean;
  completedSteps: number[];
  configStep: number;
  configSteps: ConfigWizardStepItem[];
  detailBoardPreviewNode: React.ReactNode;
  handleConfigNext: () => void;
  handleConfigPrevious: () => void;
  handleConfigStepSelect: (stepId: number) => void;
  handleLockedTypeStepSelect: () => void;
  isConfigFullscreenActive: boolean;
  isMenuInfoLoading: boolean;
  isMenuInfoSaving: boolean;
  isModuleSettingStep: boolean;
  longTextEditorNode: React.ReactNode;
  mainHiddenColumnsModalNode: React.ReactNode;
  menuInfoNode: React.ReactNode;
  moduleIntroEditorNode: React.ReactNode;
  modulePreviewNode: React.ReactNode;
  modulePreviewStep: number;
  processDesignNode: React.ReactNode;
  processDesignStep: number;
  moduleSettingNode: React.ReactNode;
  moduleSettingStep: number;
  moduleTypeSelectionNode: React.ReactNode;
  nextDisabled: boolean;
  nextLabel: string;
  onClose: () => void;
  onSave: () => void;
  onToggleFullscreen: () => void;
  previewContextMenuNode: React.ReactNode;
  restrictionNode: React.ReactNode;
  restrictionStep: number;
  saveDisabled: boolean;
  saveLabel: string;
  showFullscreenToggle: boolean;
  surveyPlanningNode: React.ReactNode;
};

export function buildConfigWizardModalNodes(input: BuildConfigWizardModalNodesInput) {
  return {
    bodyNode: (
      <motion.div
        key={input.configStep}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`mx-auto flex w-full flex-1 min-h-0 flex-col ${
          input.isConfigFullscreenActive
            ? 'max-w-none overflow-hidden'
            : input.isModuleSettingStep
              ? 'max-w-none'
              : 'max-w-[1600px]'
        }`}
      >
        <div className="mb-0"></div>
        <ConfigWizardStepContent
          configStep={input.configStep}
          menuInfoNode={input.menuInfoNode}
          moduleIntroEditorNode={input.moduleIntroEditorNode}
          modulePreviewNode={input.modulePreviewNode}
          modulePreviewStep={input.modulePreviewStep}
          processDesignNode={input.processDesignNode}
          processDesignStep={input.processDesignStep}
          moduleSettingNode={input.moduleSettingNode}
          moduleSettingStep={input.moduleSettingStep}
          moduleTypeSelectionNode={input.moduleTypeSelectionNode}
          restrictionNode={input.restrictionNode}
          restrictionStep={input.restrictionStep}
          surveyPlanningNode={input.surveyPlanningNode}
        />
      </motion.div>
    ),
    footerNode: (
      <ConfigWizardFooter
        canGoBack={input.canGoBack}
        isConfigFullscreenActive={input.isConfigFullscreenActive}
        nextDisabled={input.nextDisabled}
        nextLabel={input.nextLabel}
        onNext={input.handleConfigNext}
        onPrevious={input.handleConfigPrevious}
        onSave={input.onSave}
        onToggleFullscreen={input.onToggleFullscreen}
        saveDisabled={input.saveDisabled}
        saveLabel={input.saveLabel}
        showFullscreenToggle={input.showFullscreenToggle}
      />
    ),
    overlayNodes: (
      <>
        {input.longTextEditorNode}
        {input.archiveLayoutCanvasNode}
        {input.detailBoardPreviewNode}
        {input.mainHiddenColumnsModalNode}
        {input.configStep === input.modulePreviewStep ? null : input.builderSelectionContextMenuNode}
        {input.configStep === input.modulePreviewStep ? null : input.previewContextMenuNode}
      </>
    ),
    sidebarNode: (
      <ConfigWizardSidebar
        completedSteps={input.completedSteps}
        configStep={input.configStep}
        isFullscreenConfigActive={input.isConfigFullscreenActive}
        isTypeStepLocked={input.activeConfigMenuId !== null}
        onClose={input.onClose}
        onLockedTypeStepSelect={input.handleLockedTypeStepSelect}
        onStepSelect={input.handleConfigStepSelect}
        steps={input.configSteps}
      />
    ),
  };
}
