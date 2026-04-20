import { DashboardScreenRouter } from './dashboard-screen-router';
import { buildDashboardScreenRouterProps } from './dashboard-screen-router-props';
import { useDashboardConfigBridgeNodes } from './module-settings/use-dashboard-config-bridge-nodes';

type DashboardConfigBridgeInputs = Parameters<typeof useDashboardConfigBridgeNodes>[0];
type DashboardScreenRouterBuilderInput = Parameters<typeof buildDashboardScreenRouterProps>[0];

export type UseDashboardScreenRuntimeInput = {
  bridgeInputs: DashboardConfigBridgeInputs;
  screen: {
    configModal: Omit<
      DashboardScreenRouterBuilderInput['configModalProps'],
      'bodyNode' | 'footerNode' | 'overlayNodes' | 'sidebarNode'
    >;
    functionFlowDesignWorkbenchProps: DashboardScreenRouterBuilderInput['functionFlowDesignWorkbenchProps'];
    isFunctionFlowDesignActive: DashboardScreenRouterBuilderInput['isFunctionFlowDesignActive'];
    isResearchRecordActive: DashboardScreenRouterBuilderInput['isResearchRecordActive'];
    isServerPermissionActive: DashboardScreenRouterBuilderInput['isServerPermissionActive'];
    isToolFeedbackActive: DashboardScreenRouterBuilderInput['isToolFeedbackActive'];
    moduleScreenInput: DashboardScreenRouterBuilderInput['moduleScreenInput'];
    researchRecordWorkbenchProps: DashboardScreenRouterBuilderInput['researchRecordWorkbenchProps'];
    serverPermissionWorkbenchProps: DashboardScreenRouterBuilderInput['serverPermissionWorkbenchProps'];
    toolFeedbackWorkbenchProps: DashboardScreenRouterBuilderInput['toolFeedbackWorkbenchProps'];
  };
};

export function useDashboardScreenRuntime({
  bridgeInputs,
  screen,
}: UseDashboardScreenRuntimeInput) {
  const dashboardConfigBridgeNodes = useDashboardConfigBridgeNodes(bridgeInputs);
  const screenRouterProps = buildDashboardScreenRouterProps({
    configModalProps: {
      ...screen.configModal,
      bodyNode: dashboardConfigBridgeNodes.configWizardModalNodes.bodyNode,
      footerNode: dashboardConfigBridgeNodes.configWizardModalNodes.footerNode,
      overlayNodes: dashboardConfigBridgeNodes.configWizardModalNodes.overlayNodes,
      sidebarNode: dashboardConfigBridgeNodes.configWizardModalNodes.sidebarNode,
    },
    deleteConfirmNode: dashboardConfigBridgeNodes.deleteConfirmNode,
    functionFlowDesignWorkbenchProps: screen.functionFlowDesignWorkbenchProps,
    isFunctionFlowDesignActive: screen.isFunctionFlowDesignActive,
    isResearchRecordActive: screen.isResearchRecordActive,
    isServerPermissionActive: screen.isServerPermissionActive,
    isToolFeedbackActive: screen.isToolFeedbackActive,
    moduleScreenInput: screen.moduleScreenInput,
    researchRecordWorkbenchProps: screen.researchRecordWorkbenchProps,
    serverPermissionWorkbenchProps: screen.serverPermissionWorkbenchProps,
    toolFeedbackWorkbenchProps: screen.toolFeedbackWorkbenchProps,
  });

  return <DashboardScreenRouter {...screenRouterProps} />;
}
