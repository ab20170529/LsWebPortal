import React from 'react';
import { motion } from 'framer-motion';

type ConfigWizardStepContentProps = {
  configStep: number;
  moduleIntroEditorNode: React.ReactNode;
  processDesignNode: React.ReactNode;
  processDesignStep: number;
  modulePreviewNode: React.ReactNode;
  modulePreviewStep: number;
  moduleSettingNode: React.ReactNode;
  moduleSettingStep: number;
  moduleTypeSelectionNode: React.ReactNode;
  restrictionNode: React.ReactNode;
  restrictionStep: number;
  surveyPlanningNode: React.ReactNode;
  menuInfoNode: React.ReactNode;
};

export function ConfigWizardStepContent({
  configStep,
  moduleIntroEditorNode,
  processDesignNode,
  processDesignStep,
  modulePreviewNode,
  modulePreviewStep,
  moduleSettingNode,
  moduleSettingStep,
  moduleTypeSelectionNode,
  restrictionNode,
  restrictionStep,
  surveyPlanningNode,
  menuInfoNode,
}: ConfigWizardStepContentProps) {
  return (
    <>
      {configStep === 1 ? moduleTypeSelectionNode : null}

      {configStep === 2 ? menuInfoNode : null}

      {configStep === 3 ? moduleIntroEditorNode : null}

      {configStep === moduleSettingStep ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          {moduleSettingNode}
        </motion.div>
      ) : null}

      {configStep === restrictionStep ? (
        <motion.div
          key="restriction-workbench"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          {restrictionNode}
        </motion.div>
      ) : null}

      {configStep === processDesignStep ? (
        <motion.div
          key="process-design-step"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          {processDesignNode}
        </motion.div>
      ) : null}

      {configStep === 4 ? surveyPlanningNode : null}

      {configStep === modulePreviewStep ? (
        <motion.div
          key="module-preview-step"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          {modulePreviewNode}
        </motion.div>
      ) : null}
    </>
  );
}
