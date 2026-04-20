import { buildDashboardConfigWizardModalNodes } from './dashboard-config-wizard-modal-nodes';
import { buildDashboardModalBridgeNodes } from './dashboard-modal-bridge-nodes';
import { buildDashboardModuleSettingNode } from './dashboard-module-setting-node';
import { buildDashboardModuleSettingStepShellProps } from './dashboard-module-setting-step-shell-props';
import { buildDashboardRestrictionWorkbenchNode } from './dashboard-restriction-workbench-node';
import { buildDashboardWorkspaceBridgeBuilder } from './dashboard-workspace-bridge-builder';

type WorkspaceBridgeInput = Parameters<typeof buildDashboardWorkspaceBridgeBuilder>[0];
type ModuleSettingShellInput = Parameters<typeof buildDashboardModuleSettingStepShellProps>[0];
type RestrictionNodeInput = Parameters<typeof buildDashboardRestrictionWorkbenchNode>[0];
type DashboardModalInput = Parameters<typeof buildDashboardModalBridgeNodes>[0];
type ModuleSettingNodeInput = Parameters<typeof buildDashboardModuleSettingNode>[0];
type ConfigWizardModalInput = Parameters<typeof buildDashboardConfigWizardModalNodes>[0];

export type BuildDashboardConfigBridgeNodesInput = {
  workspace: WorkspaceBridgeInput;
  moduleSetting: {
    container: ModuleSettingNodeInput['container'];
    shell: {
      common: Omit<ModuleSettingShellInput['common'], 'conditionToolbarNode'>;
      document: ModuleSettingShellInput['document'];
      tree: ModuleSettingShellInput['tree'];
    };
  };
  restriction: RestrictionNodeInput;
  modals: DashboardModalInput;
  wizard: {
    modal: {
      chrome: ConfigWizardModalInput['chrome'];
      actions: ConfigWizardModalInput['actions'];
      overlays: Omit<
        ConfigWizardModalInput['overlays'],
        | 'archiveLayoutCanvasNode'
        | 'builderSelectionContextMenuNode'
        | 'detailBoardPreviewNode'
        | 'longTextEditorNode'
        | 'mainHiddenColumnsModalNode'
        | 'previewContextMenuNode'
      >;
      stepNodes: Omit<
        ConfigWizardModalInput['stepNodes'],
        'moduleSettingNode' | 'restrictionNode'
      >;
    };
  };
};

export function buildDashboardConfigBridgeNodes(
  input: BuildDashboardConfigBridgeNodesInput,
) {
  const dashboardWorkspaceBridgeNodes = buildDashboardWorkspaceBridgeBuilder(input.workspace);
  const moduleSettingStepShellProps = buildDashboardModuleSettingStepShellProps({
    ...input.moduleSetting.shell,
    common: {
      ...input.moduleSetting.shell.common,
      conditionToolbarNode: dashboardWorkspaceBridgeNodes.documentConditionToolbarNode,
    },
  });
  const restrictionWorkbenchNode = buildDashboardRestrictionWorkbenchNode(input.restriction);
  const dashboardModalNodes = buildDashboardModalBridgeNodes(input.modals);
  const moduleSettingNode = buildDashboardModuleSettingNode({
    container: input.moduleSetting.container,
    shell: {
      moduleSettingStepShellProps,
    },
  });
  const configWizardModalNodes = buildDashboardConfigWizardModalNodes({
    ...input.wizard.modal,
    overlays: {
      ...input.wizard.modal.overlays,
      archiveLayoutCanvasNode: dashboardWorkspaceBridgeNodes.archiveLayoutCanvasNode,
      builderSelectionContextMenuNode: dashboardWorkspaceBridgeNodes.builderSelectionContextMenuNode,
      detailBoardPreviewNode: dashboardModalNodes.detailBoardPreviewNode,
      longTextEditorNode: dashboardWorkspaceBridgeNodes.longTextEditorNode,
      mainHiddenColumnsModalNode: dashboardModalNodes.mainHiddenColumnsModalNode,
      previewContextMenuNode: dashboardWorkspaceBridgeNodes.previewContextMenuNode,
    },
    stepNodes: {
      ...input.wizard.modal.stepNodes,
      moduleSettingNode,
      restrictionNode: restrictionWorkbenchNode,
    },
  });

  return {
    configWizardModalNodes,
    deleteConfirmNode: dashboardModalNodes.deleteConfirmNode,
  };
}
