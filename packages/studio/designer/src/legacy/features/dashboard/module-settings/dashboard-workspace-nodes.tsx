import React from 'react';
import { ArchiveLayoutCanvasModalContainer } from './archive-layout-canvas-modal-container';
import {
  BuilderSelectionContextMenuOverlay,
  PreviewContextMenuOverlay,
} from './context-menus';
import { DocumentConditionWorkbenchModalBridge } from './document-workspace-panels';
import { LongTextEditorModal } from './long-text-editor-modal';
import { ModuleSettingStepShell } from './module-setting-step-shell';

export type BuildDashboardWorkspaceBridgeNodesInput = {
  archiveLayoutCanvasProps: React.ComponentProps<typeof ArchiveLayoutCanvasModalContainer>;
  builderSelectionContextMenu: React.ComponentProps<typeof BuilderSelectionContextMenuOverlay>['menu'];
  documentConditionToolbarProps: React.ComponentProps<typeof DocumentConditionWorkbenchModalBridge>;
  longTextEditorModalProps: React.ComponentProps<typeof LongTextEditorModal>;
  onCloseBuilderSelectionContextMenu: () => void;
  onClosePreviewContextMenu: () => void;
  onDeleteBuilderSelection: () => void;
  onTriggerPreviewContextMenuItem: React.ComponentProps<typeof PreviewContextMenuOverlay>['onTriggerItem'];
  previewContextMenu: React.ComponentProps<typeof PreviewContextMenuOverlay>['menu'];
};

export type BuildModuleSettingNodeInput = {
  moduleSettingsSectionRef: React.RefObject<HTMLDivElement | null>;
  moduleSettingStepShellProps: React.ComponentProps<typeof ModuleSettingStepShell>;
};

export function buildDashboardWorkspaceBridgeNodes(input: BuildDashboardWorkspaceBridgeNodesInput) {
  return {
    archiveLayoutCanvasNode: (
      <ArchiveLayoutCanvasModalContainer {...input.archiveLayoutCanvasProps} />
    ),
    builderSelectionContextMenuNode: (
      <BuilderSelectionContextMenuOverlay
        menu={input.builderSelectionContextMenu}
        onClose={input.onCloseBuilderSelectionContextMenu}
        onDelete={input.onDeleteBuilderSelection}
      />
    ),
    documentConditionToolbarNode: (
      <DocumentConditionWorkbenchModalBridge {...input.documentConditionToolbarProps} />
    ),
    longTextEditorNode: (
      <LongTextEditorModal {...input.longTextEditorModalProps} />
    ),
    previewContextMenuNode: (
      <PreviewContextMenuOverlay
        menu={input.previewContextMenu}
        onClose={input.onClosePreviewContextMenu}
        onTriggerItem={input.onTriggerPreviewContextMenuItem}
      />
    ),
  };
}

export function buildModuleSettingNode({
  moduleSettingsSectionRef,
  moduleSettingStepShellProps,
}: BuildModuleSettingNodeInput) {
  return (
    <div ref={moduleSettingsSectionRef} className="min-h-0 flex flex-1 flex-col min-w-0">
      <ModuleSettingStepShell {...moduleSettingStepShellProps} />
    </div>
  );
}
