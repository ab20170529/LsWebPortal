import type { ComponentProps, ReactNode } from 'react';

import { DashboardConfigModal } from './dashboard-config-modal';
import { FunctionFlowDesignWorkbench } from './function-flow-design-workbench';
import { ResearchRecordWorkbench } from './research-record-workbench';
import { ResearchRecordExplorerWorkbench } from './research-record-explorer';
import { ServerPermissionWorkbench } from './server-permission-workbench';
import { ToolFeedbackWorkbench } from './tool-feedback-workbench';

export function buildDashboardConfigModalNode(
  props: ComponentProps<typeof DashboardConfigModal>,
): ReactNode {
  return <DashboardConfigModal {...props} />;
}

export function buildDashboardResearchRecordWorkbenchNode(
  props: ComponentProps<typeof ResearchRecordWorkbench>,
): ReactNode {
  return <ResearchRecordExplorerWorkbench {...props} />;
}

export function buildFunctionFlowDesignWorkbenchNode(
  props: ComponentProps<typeof FunctionFlowDesignWorkbench>,
): ReactNode {
  return <FunctionFlowDesignWorkbench {...props} />;
}

export function buildServerPermissionWorkbenchNode(
  props: ComponentProps<typeof ServerPermissionWorkbench>,
): ReactNode {
  return <ServerPermissionWorkbench {...props} />;
}

export function buildToolFeedbackWorkbenchNode(
  props: ComponentProps<typeof ToolFeedbackWorkbench>,
): ReactNode {
  return <ToolFeedbackWorkbench {...props} />;
}
