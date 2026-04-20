import type { BuildDashboardConfigBridgeNodesInput } from './dashboard-config-bridge-nodes';

type BuildDashboardConfigBridgeWizardInput = {
  actions: BuildDashboardConfigBridgeNodesInput['wizard']['modal']['actions'];
  chromeState: BuildDashboardConfigBridgeNodesInput['wizard']['modal']['chrome'];
  stepNodes: BuildDashboardConfigBridgeNodesInput['wizard']['modal']['stepNodes'];
};

export function buildDashboardConfigBridgeWizardInput(
  input: BuildDashboardConfigBridgeWizardInput,
): BuildDashboardConfigBridgeNodesInput['wizard'] {
  return {
    modal: {
      chrome: input.chromeState,
      actions: input.actions,
      overlays: {},
      stepNodes: input.stepNodes,
    },
  };
}
