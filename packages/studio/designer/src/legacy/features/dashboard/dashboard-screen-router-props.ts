import type { ComponentProps } from 'react';

import { buildDashboardModuleScreenProps } from './dashboard-module-screen-props';
import {
  buildDashboardConfigModalNode,
  buildFunctionFlowDesignWorkbenchNode,
  buildDashboardResearchRecordWorkbenchNode,
  buildServerPermissionWorkbenchNode,
  buildToolFeedbackWorkbenchNode,
} from './dashboard-screen-node-builders';
import { DashboardScreenRouter } from './dashboard-screen-router';

type DashboardConfigModalNodeProps = Parameters<typeof buildDashboardConfigModalNode>[0];
type DashboardModuleScreenPropsInput = Parameters<typeof buildDashboardModuleScreenProps>[0];
type DashboardFunctionFlowDesignWorkbenchProps = Parameters<typeof buildFunctionFlowDesignWorkbenchNode>[0];
type DashboardResearchRecordWorkbenchProps = Parameters<typeof buildDashboardResearchRecordWorkbenchNode>[0];
type DashboardServerPermissionWorkbenchProps = Parameters<typeof buildServerPermissionWorkbenchNode>[0];
type DashboardToolFeedbackWorkbenchProps = Parameters<typeof buildToolFeedbackWorkbenchNode>[0];

export function buildDashboardScreenRouterProps({
  configModalProps,
  deleteConfirmNode,
  functionFlowDesignWorkbenchProps,
  isFunctionFlowDesignActive,
  isResearchRecordActive,
  isServerPermissionActive,
  isToolFeedbackActive,
  moduleScreenInput,
  researchRecordWorkbenchProps,
  serverPermissionWorkbenchProps,
  toolFeedbackWorkbenchProps,
}: {
  configModalProps: DashboardConfigModalNodeProps;
  deleteConfirmNode: ComponentProps<typeof DashboardScreenRouter>['deleteConfirmNode'];
  functionFlowDesignWorkbenchProps: DashboardFunctionFlowDesignWorkbenchProps;
  isFunctionFlowDesignActive: ComponentProps<typeof DashboardScreenRouter>['isFunctionFlowDesignActive'];
  isResearchRecordActive: ComponentProps<typeof DashboardScreenRouter>['isResearchRecordActive'];
  isServerPermissionActive: ComponentProps<typeof DashboardScreenRouter>['isServerPermissionActive'];
  isToolFeedbackActive: ComponentProps<typeof DashboardScreenRouter>['isToolFeedbackActive'];
  moduleScreenInput: DashboardModuleScreenPropsInput;
  researchRecordWorkbenchProps: DashboardResearchRecordWorkbenchProps;
  serverPermissionWorkbenchProps: DashboardServerPermissionWorkbenchProps;
  toolFeedbackWorkbenchProps: DashboardToolFeedbackWorkbenchProps;
}): ComponentProps<typeof DashboardScreenRouter> {
  return {
    configModalNode: buildDashboardConfigModalNode(configModalProps),
    deleteConfirmNode,
    functionFlowDesignWorkbenchNode: buildFunctionFlowDesignWorkbenchNode(functionFlowDesignWorkbenchProps),
    isFunctionFlowDesignActive,
    isResearchRecordActive,
    isServerPermissionActive,
    isToolFeedbackActive,
    moduleScreenProps: buildDashboardModuleScreenProps(moduleScreenInput),
    researchRecordWorkbenchNode: buildDashboardResearchRecordWorkbenchNode(researchRecordWorkbenchProps),
    serverPermissionWorkbenchNode: buildServerPermissionWorkbenchNode(serverPermissionWorkbenchProps),
    toolFeedbackWorkbenchNode: buildToolFeedbackWorkbenchNode(toolFeedbackWorkbenchProps),
  };
}
