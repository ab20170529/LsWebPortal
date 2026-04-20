import React from 'react';

import { ConfigWizardModalShell } from './module-settings/config-wizard-modal-shell';

export function DashboardConfigModal({
  bodyNode,
  configStep,
  footerNode,
  isConfigOpen,
  isFullscreenConfigActive,
  isModuleSettingStep,
  modulePreviewStep,
  onClose,
  overlayNodes,
  sidebarNode,
  toastMessage,
}: {
  bodyNode: React.ReactNode;
  configStep: number;
  footerNode: React.ReactNode;
  isConfigOpen: boolean;
  isFullscreenConfigActive: boolean;
  isModuleSettingStep: boolean;
  modulePreviewStep: number;
  onClose: () => void;
  overlayNodes?: React.ReactNode;
  sidebarNode: React.ReactNode;
  toastMessage: string | null;
}) {
  return (
    <ConfigWizardModalShell
      open={isConfigOpen}
      isFullscreenConfigActive={isFullscreenConfigActive}
      isModulePreviewStep={configStep === modulePreviewStep}
      isModuleSettingStep={isModuleSettingStep}
      onClose={onClose}
      toastMessage={toastMessage}
      overlayNodes={overlayNodes}
      sidebarNode={sidebarNode}
      bodyNode={bodyNode}
      footerNode={footerNode}
    />
  );
}
