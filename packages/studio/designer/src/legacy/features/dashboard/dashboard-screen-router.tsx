import React from 'react';

import { DashboardModuleScreen } from './dashboard-module-screen';
import { DashboardServerPermissionScreen } from './dashboard-server-permission-screen';

export function DashboardScreenRouter({
  configModalNode,
  deleteConfirmNode,
  functionFlowDesignWorkbenchNode,
  isFunctionFlowDesignActive,
  isResearchRecordActive,
  isServerPermissionActive,
  isToolFeedbackActive,
  moduleScreenProps,
  researchRecordWorkbenchNode,
  serverPermissionWorkbenchNode,
  toolFeedbackWorkbenchNode,
}: {
  configModalNode: React.ReactNode;
  deleteConfirmNode: React.ReactNode;
  functionFlowDesignWorkbenchNode: React.ReactNode;
  isFunctionFlowDesignActive: boolean;
  isResearchRecordActive: boolean;
  isServerPermissionActive: boolean;
  isToolFeedbackActive: boolean;
  moduleScreenProps: Omit<
    React.ComponentProps<typeof DashboardModuleScreen>,
    'configModalNode' | 'deleteConfirmNode'
  >;
  researchRecordWorkbenchNode: React.ReactNode;
  serverPermissionWorkbenchNode: React.ReactNode;
  toolFeedbackWorkbenchNode: React.ReactNode;
}) {
  const {
    contentKey,
    headerProps,
    overviewProps,
    sidebarProps,
  } = moduleScreenProps;

  if (isServerPermissionActive) {
    return (
      <DashboardServerPermissionScreen
        configModalNode={configModalNode}
        contentNode={serverPermissionWorkbenchNode}
        deleteConfirmNode={deleteConfirmNode}
        headerProps={headerProps}
        sidebarProps={sidebarProps}
      />
    );
  }

  if (isToolFeedbackActive) {
    return (
      <DashboardServerPermissionScreen
        configModalNode={configModalNode}
        contentNode={toolFeedbackWorkbenchNode}
        deleteConfirmNode={deleteConfirmNode}
        headerProps={headerProps}
        sidebarProps={sidebarProps}
      />
    );
  }

  if (isResearchRecordActive) {
    return (
      <DashboardServerPermissionScreen
        configModalNode={configModalNode}
        contentNode={researchRecordWorkbenchNode}
        deleteConfirmNode={deleteConfirmNode}
        headerProps={headerProps}
        sidebarProps={sidebarProps}
      />
    );
  }

  if (isFunctionFlowDesignActive) {
    return (
      <DashboardServerPermissionScreen
        configModalNode={configModalNode}
        contentNode={functionFlowDesignWorkbenchNode}
        deleteConfirmNode={deleteConfirmNode}
        headerProps={headerProps}
        sidebarProps={sidebarProps}
      />
    );
  }

  return (
    <DashboardModuleScreen
      configModalNode={configModalNode}
      contentKey={contentKey}
      deleteConfirmNode={deleteConfirmNode}
      headerProps={headerProps}
      overviewProps={overviewProps}
      sidebarProps={sidebarProps}
    />
  );
}
